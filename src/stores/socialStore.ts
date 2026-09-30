import { create } from "zustand";
import type {
  Conversation,
  FriendRequest,
  FriendshipStatusResponse,
  MessageRequest,
  User,
} from "@/types";
import { friendService } from "@/services/friend/friendService";
import { messageRequestService } from "@/services/messageRequest/messageRequestService";
import { socketEmitter } from "@/services/socket";
import { useChatStore } from "./chatStore";

interface SocialState {
  friends: User[];
  receivedFriendRequests: FriendRequest[];
  sentFriendRequests: FriendRequest[];
  receivedMessageRequests: MessageRequest[];
  sentMessageRequests: MessageRequest[];
  friendshipStatuses: Record<string, FriendshipStatusResponse>;
  friendshipStatusErrors: Record<string, string>;
  loadingFriends: boolean;
  loadingFriendRequests: boolean;
  loadingMessageRequests: boolean;
  pendingActions: Record<string, boolean>;
  error: string | null;
  initialized: boolean;

  reset: () => void;
  initialize: () => Promise<void>;
  loadFriends: (force?: boolean) => Promise<void>;
  loadFriendRequests: (force?: boolean) => Promise<void>;
  loadMessageRequests: (force?: boolean) => Promise<void>;
  addSentMessageRequest: (conversation: Conversation) => void;
  loadFriendshipStatus: (userId: string) => Promise<void>;
  sendFriendRequest: (userId: string) => Promise<boolean>;
  acceptFriendRequest: (requestId: string) => Promise<boolean>;
  rejectFriendRequest: (requestId: string) => Promise<boolean>;
  cancelFriendRequest: (requestId: string) => Promise<boolean>;
  removeFriend: (userId: string) => Promise<boolean>;
  acceptMessageRequest: (conversationId: string) => Promise<boolean>;
  rejectMessageRequest: (conversationId: string) => Promise<boolean>;
  handleFriendRequestEvent: () => void;
  handleFriendAccepted: () => void;
  handleFriendRejected: (request: FriendRequest) => void;
  handleFriendRemovedEvent: (friendId: string) => void;
  handleFriendPresence: (userId: string, status: User["status"]) => void;
  handleMessageRequestEvent: () => void;
  handleMessageRequestAccepted: (conversationId: string) => void;
  handleMessageRequestRejected: (conversationId: string) => void;
  clearError: () => void;
}

function withPending<T extends { id: string }>(items: T[], id: string): T[] {
  return items.filter((item) => item.id !== id);
}

export const useSocialStore = create<SocialState>((set, get) => ({
  friends: [],
  receivedFriendRequests: [],
  sentFriendRequests: [],
  receivedMessageRequests: [],
  sentMessageRequests: [],
  friendshipStatuses: {},
  friendshipStatusErrors: {},
  loadingFriends: false,
  loadingFriendRequests: false,
  loadingMessageRequests: false,
  pendingActions: {},
  error: null,
  initialized: false,

  reset: () =>
    set({
      friends: [],
      receivedFriendRequests: [],
      sentFriendRequests: [],
      receivedMessageRequests: [],
      sentMessageRequests: [],
      friendshipStatuses: {},
      friendshipStatusErrors: {},
      loadingFriends: false,
      loadingFriendRequests: false,
      loadingMessageRequests: false,
      pendingActions: {},
      error: null,
      initialized: false,
    }),

  initialize: async () => {
    if (get().initialized) return;
    await Promise.all([
      get().loadFriends(),
      get().loadFriendRequests(),
      get().loadMessageRequests(),
    ]);
    set({ initialized: true });
  },

  loadFriends: async (force = false) => {
    if (get().loadingFriends || (!force && get().initialized)) return;
    set({ loadingFriends: true, error: null });
    const result = await friendService.getFriends();
    if (result.success) {
      set((state) => ({
        friends: result.data,
        loadingFriends: false,
        friendshipStatuses: result.data.reduce(
          (statuses, friend) => ({
            ...statuses,
            [friend.id]: { status: "friends", areFriends: true },
          }),
          state.friendshipStatuses,
        ),
      }));
    } else {
      set({ loadingFriends: false, error: result.error.message });
    }
  },

  loadFriendRequests: async (force = false) => {
    if (get().loadingFriendRequests || (!force && get().initialized)) return;
    set({ loadingFriendRequests: true, error: null });
    const [received, sent] = await Promise.all([
      friendService.getRequests("received"),
      friendService.getRequests("sent"),
    ]);
    if (!received.success) {
      set({
        loadingFriendRequests: false,
        error: received.error.message,
      });
      return;
    }
    if (!sent.success) {
      set({ loadingFriendRequests: false, error: sent.error.message });
      return;
    }
    set({
      receivedFriendRequests: received.data,
      sentFriendRequests: sent.data,
      loadingFriendRequests: false,
      friendshipStatuses: {
        ...get().friendshipStatuses,
        ...Object.fromEntries(
          received.data.map((request) => [
            request.senderId,
            { status: "received", areFriends: false },
          ]),
        ),
        ...Object.fromEntries(
          sent.data.map((request) => [
            request.recipientId,
            { status: "sent", areFriends: false },
          ]),
        ),
      },
    });
  },

  loadMessageRequests: async (force = false) => {
    if (get().loadingMessageRequests || (!force && get().initialized)) return;
    set({ loadingMessageRequests: true, error: null });
    const [received, sent] = await Promise.all([
      messageRequestService.getRequests("received"),
      messageRequestService.getRequests("sent"),
    ]);
    if (!received.success) {
      set({
        loadingMessageRequests: false,
        error: received.error.message,
      });
      return;
    }
    if (!sent.success) {
      set({ loadingMessageRequests: false, error: sent.error.message });
      return;
    }
    set({
      receivedMessageRequests: received.data,
      sentMessageRequests: sent.data,
      loadingMessageRequests: false,
    });
  },

  addSentMessageRequest: (conversation) => {
    if (conversation.requestStatus !== "pending") return;
    const request: MessageRequest = {
      id: conversation.id,
      conversation,
      requestedBy: conversation.requestedBy ?? "",
      createdAt: conversation.lastMessageAt,
    };
    set((state) => ({
      sentMessageRequests: [
        request,
        ...withPending(state.sentMessageRequests, conversation.id),
      ],
    }));
  },

  loadFriendshipStatus: async (userId) => {
    const key = `friendship:${userId}`;
    if (
      !userId ||
      get().friendshipStatuses[userId] ||
      get().pendingActions[key]
    )
      return;
    set((state) => ({
      pendingActions: { ...state.pendingActions, [key]: true },
      friendshipStatusErrors: { ...state.friendshipStatusErrors, [userId]: "" },
    }));
    const result = await friendService.getStatus(userId);
    if (result.success) {
      set((state) => ({
        friendshipStatuses: {
          ...state.friendshipStatuses,
          [userId]: result.data,
        },
        pendingActions: { ...state.pendingActions, [key]: false },
      }));
    } else {
      set((state) => ({
        pendingActions: { ...state.pendingActions, [key]: false },
        friendshipStatusErrors: {
          ...state.friendshipStatusErrors,
          [userId]: result.error.message,
        },
      }));
    }
  },

  sendFriendRequest: async (userId) => {
    set((state) => ({
      pendingActions: { ...state.pendingActions, [userId]: true },
      error: null,
    }));
    const result = await friendService.sendRequest(userId);
    if (!result.success) {
      set((state) => ({
        pendingActions: { ...state.pendingActions, [userId]: false },
        error: result.error.message,
      }));
      return false;
    }
    set((state) => ({
      sentFriendRequests: [
        result.data,
        ...withPending(state.sentFriendRequests, result.data.id),
      ],
      friendshipStatuses: {
        ...state.friendshipStatuses,
        [userId]: { status: "sent", areFriends: false },
      },
      pendingActions: { ...state.pendingActions, [userId]: false },
    }));
    return true;
  },

  acceptFriendRequest: async (requestId) => {
    set((state) => ({
      pendingActions: { ...state.pendingActions, [requestId]: true },
      error: null,
    }));
    const result = await friendService.acceptRequest(requestId);
    if (!result.success) {
      set((state) => ({
        pendingActions: { ...state.pendingActions, [requestId]: false },
        error: result.error.message,
      }));
      return false;
    }
    const request = result.data;
    const friend = request.sender;
    set((state) => ({
      receivedFriendRequests: withPending(
        state.receivedFriendRequests,
        requestId,
      ),
      friends:
        friend && !state.friends.some((item) => item.id === friend.id)
          ? [friend, ...state.friends]
          : state.friends,
      friendshipStatuses: request.senderId
        ? {
            ...state.friendshipStatuses,
            [request.senderId]: { status: "friends", areFriends: true },
          }
        : state.friendshipStatuses,
      pendingActions: { ...state.pendingActions, [requestId]: false },
    }));
    await Promise.all([
      get().loadFriends(true),
      get().loadFriendRequests(true),
      useChatStore.getState().fetchConversations(true),
    ]);
    return true;
  },

  rejectFriendRequest: async (requestId) => {
    set((state) => ({
      pendingActions: { ...state.pendingActions, [requestId]: true },
      error: null,
    }));
    const result = await friendService.rejectRequest(requestId);
    if (!result.success) {
      set((state) => ({
        pendingActions: { ...state.pendingActions, [requestId]: false },
        error: result.error.message,
      }));
      return false;
    }
    set((state) => ({
      receivedFriendRequests: withPending(
        state.receivedFriendRequests,
        requestId,
      ),
      sentFriendRequests: withPending(state.sentFriendRequests, requestId),
      friendshipStatuses: {
        ...state.friendshipStatuses,
        [result.data.senderId]: { status: "none", areFriends: false },
        [result.data.recipientId]: { status: "none", areFriends: false },
      },
      pendingActions: { ...state.pendingActions, [requestId]: false },
    }));
    return true;
  },

  cancelFriendRequest: async (requestId) => {
    set((state) => ({
      pendingActions: { ...state.pendingActions, [requestId]: true },
      error: null,
    }));
    const result = await friendService.cancelRequest(requestId);
    if (!result.success) {
      set((state) => ({
        pendingActions: { ...state.pendingActions, [requestId]: false },
        error: result.error.message,
      }));
      return false;
    }
    set((state) => ({
      sentFriendRequests: withPending(state.sentFriendRequests, requestId),
      friendshipStatuses: {
        ...state.friendshipStatuses,
        [result.data.recipientId]: { status: "none", areFriends: false },
      },
      pendingActions: { ...state.pendingActions, [requestId]: false },
    }));
    return true;
  },

  removeFriend: async (userId) => {
    set((state) => ({
      pendingActions: { ...state.pendingActions, [userId]: true },
      error: null,
    }));
    const result = await friendService.removeFriend(userId);
    if (!result.success) {
      set((state) => ({
        pendingActions: { ...state.pendingActions, [userId]: false },
        error: result.error.message,
      }));
      return false;
    }
    set((state) => ({
      friends: state.friends.filter((friend) => friend.id !== userId),
      friendshipStatuses: {
        ...state.friendshipStatuses,
        [userId]: { status: "none", areFriends: false },
      },
      pendingActions: { ...state.pendingActions, [userId]: false },
    }));
    return true;
  },

  acceptMessageRequest: async (conversationId) => {
    set((state) => ({
      pendingActions: { ...state.pendingActions, [conversationId]: true },
      error: null,
    }));
    const result = await messageRequestService.accept(conversationId);
    if (!result.success) {
      set((state) => ({
        pendingActions: { ...state.pendingActions, [conversationId]: false },
        error: result.error.message,
      }));
      return false;
    }
    set((state) => ({
      receivedMessageRequests: withPending(
        state.receivedMessageRequests,
        conversationId,
      ),
      sentMessageRequests: withPending(
        state.sentMessageRequests,
        conversationId,
      ),
      pendingActions: { ...state.pendingActions, [conversationId]: false },
    }));
    useChatStore.getState().handleConversationUpdated(result.data);
    if (useChatStore.getState().activeConversationId === conversationId) {
      socketEmitter.joinConversation(conversationId);
    }
    return true;
  },

  rejectMessageRequest: async (conversationId) => {
    set((state) => ({
      pendingActions: { ...state.pendingActions, [conversationId]: true },
      error: null,
    }));
    const result = await messageRequestService.reject(conversationId);
    if (!result.success) {
      set((state) => ({
        pendingActions: { ...state.pendingActions, [conversationId]: false },
        error: result.error.message,
      }));
      return false;
    }
    set((state) => ({
      receivedMessageRequests: withPending(
        state.receivedMessageRequests,
        conversationId,
      ),
      sentMessageRequests: withPending(
        state.sentMessageRequests,
        conversationId,
      ),
      pendingActions: { ...state.pendingActions, [conversationId]: false },
    }));
    useChatStore.getState().removeConversation(conversationId);
    return true;
  },

  handleFriendRequestEvent: () => {
    void get().loadFriendRequests(true);
  },

  handleFriendAccepted: () => {
    void Promise.all([
      get().loadFriends(true),
      get().loadFriendRequests(true),
      useChatStore.getState().fetchConversations(true),
    ]);
  },

  handleFriendRejected: (request) => {
    set((state) => ({
      receivedFriendRequests: withPending(
        state.receivedFriendRequests,
        request.id,
      ),
      sentFriendRequests: withPending(state.sentFriendRequests, request.id),
      friendshipStatuses: {
        ...state.friendshipStatuses,
        [request.senderId]: { status: "none", areFriends: false },
        [request.recipientId]: { status: "none", areFriends: false },
      },
    }));
  },

  handleFriendRemovedEvent: (friendId) => {
    set((state) => ({
      friends: state.friends.filter((friend) => friend.id !== friendId),
      friendshipStatuses: {
        ...state.friendshipStatuses,
        [friendId]: { status: "none", areFriends: false },
      },
    }));
  },

  handleFriendPresence: (userId, status) => {
    set((state) => ({
      friends: state.friends.map((friend) =>
        friend.id === userId ? { ...friend, status } : friend,
      ),
    }));
  },

  handleMessageRequestEvent: () => {
    void get().loadMessageRequests(true);
  },

  handleMessageRequestAccepted: (conversationId) => {
    set((state) => ({
      receivedMessageRequests: withPending(
        state.receivedMessageRequests,
        conversationId,
      ),
      sentMessageRequests: withPending(
        state.sentMessageRequests,
        conversationId,
      ),
    }));
    if (useChatStore.getState().activeConversationId === conversationId) {
      socketEmitter.joinConversation(conversationId);
    }
    void useChatStore.getState().fetchConversations(true);
  },

  handleMessageRequestRejected: (conversationId) => {
    set((state) => ({
      receivedMessageRequests: withPending(
        state.receivedMessageRequests,
        conversationId,
      ),
      sentMessageRequests: withPending(
        state.sentMessageRequests,
        conversationId,
      ),
    }));
    useChatStore.getState().removeConversation(conversationId);
  },

  clearError: () => set({ error: null }),
}));
