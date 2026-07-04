import { create } from "zustand";
import type {
  Conversation,
  ConversationTab,
  Message,
  MessageStatus,
  ReplyTo,
  UserStatus,
} from "@/types";
import { chatService } from "@/services";
import { socketClient, socketEmitter } from "@/services/socket";
import { generateId } from "@/lib/api";

interface ChatState {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  activeConversationId: string | null;
  searchQuery: string;
  activeTab: ConversationTab;
  typingUsers: Record<string, string[]>;
  onlineUsers: string[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;
  error: string | null;
  replyTo: ReplyTo | null;

  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  setActiveConversation: (id: string | null) => void;
  sendMessage: (content: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => void;
  deleteMessage: (messageId: string) => void;
  markAsRead: (conversationId: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string, userId: string) => void;
  setSearchQuery: (query: string) => void;
  setActiveTab: (tab: ConversationTab) => void;
  setReplyTo: (reply: ReplyTo | null) => void;
  searchConversations: () => Promise<void>;
  clearError: () => void;
  getActiveConversation: () => Conversation | null;
  getActiveMessages: () => Message[];

  // Real-time handlers
  handleIncomingMessage: (message: Message) => void;
  handleMessageUpdated: (message: Message) => void;
  handleMessageDeleted: (payload: { messageId: string; conversationId: string }) => void;
  handleMessageStatus: (payload: { messageId: string; conversationId: string; status: MessageStatus }) => void;
  handleMessageReaction: (message: Message) => void;
  handleConversationUpdated: (conversation: Conversation) => void;
  handleTypingUpdate: (conversationId: string, userId: string, isTyping: boolean) => void;
  handleOnlineUsers: (userIds: string[]) => void;
  handlePresenceUpdate: (userId: string, status: UserStatus) => void;
}

function upsertConversation(conversations: Conversation[], updated: Conversation): Conversation[] {
  const idx = conversations.findIndex((c) => c.id === updated.id);
  if (idx >= 0) {
    const next = [...conversations];
    next[idx] = updated;
    return next.sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  }
  return [updated, ...conversations];
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  messages: {},
  activeConversationId: null,
  searchQuery: "",
  activeTab: "all",
  typingUsers: {},
  onlineUsers: [],
  isLoadingConversations: false,
  isLoadingMessages: false,
  isSending: false,
  error: null,
  replyTo: null,

  fetchConversations: async () => {
    set({ isLoadingConversations: true, error: null });
    const result = await chatService.getConversations();
    if (result.success) {
      set({ conversations: result.data, isLoadingConversations: false });
    } else {
      set({ error: result.error.message, isLoadingConversations: false });
    }
  },

  fetchMessages: async (conversationId) => {
    set({ isLoadingMessages: true, error: null });
    const result = await chatService.getMessages(conversationId);
    if (result.success) {
      set((state) => ({
        messages: { ...state.messages, [conversationId]: result.data },
        isLoadingMessages: false,
      }));
    } else {
      set({ error: result.error.message, isLoadingMessages: false });
    }
  },

  setActiveConversation: (id) => {
    const prev = get().activeConversationId;
    if (prev === id) return;

    if (prev) {
      socketEmitter.leaveConversation(prev);
    }
    set({ activeConversationId: id, replyTo: null });
    if (id) {
      socketEmitter.joinConversation(id);
      get().markAsRead(id);
      if (!get().messages[id]) {
        get().fetchMessages(id);
      }
    }
  },

  sendMessage: async (content) => {
    const { activeConversationId, replyTo } = get();
    if (!activeConversationId || !content.trim()) return;

    const tempId = generateId("temp");
    const optimisticMessage: Message = {
      id: tempId,
      conversationId: activeConversationId,
      senderId: "user-1",
      content: content.trim(),
      createdAt: new Date().toISOString(),
      status: "sending",
      reactions: [],
      replyTo: replyTo ?? undefined,
      tempId,
    };

    set((state) => ({
      messages: {
        ...state.messages,
        [activeConversationId]: [
          ...(state.messages[activeConversationId] ?? []),
          optimisticMessage,
        ],
      },
      isSending: true,
      replyTo: null,
    }));

    if (socketClient.isConnected()) {
      socketEmitter.sendMessage({
        conversationId: activeConversationId,
        content: content.trim(),
        replyTo: replyTo ?? undefined,
        tempId,
      });
      set({ isSending: false });
    } else {
      const result = await chatService.sendMessage({
        conversationId: activeConversationId,
        content: content.trim(),
        replyTo: replyTo ?? undefined,
      });

      if (result.success) {
        set((state) => ({
          messages: {
            ...state.messages,
            [activeConversationId]: (state.messages[activeConversationId] ?? []).map((m) =>
              m.tempId === tempId ? result.data : m
            ),
          },
          conversations: state.conversations.map((c) =>
            c.id === activeConversationId
              ? { ...c, lastMessage: content.trim(), lastMessageAt: result.data.createdAt }
              : c
          ),
          isSending: false,
        }));
      } else {
        set((state) => ({
          messages: {
            ...state.messages,
            [activeConversationId]: (state.messages[activeConversationId] ?? []).map((m) =>
              m.tempId === tempId ? { ...m, status: "failed" as MessageStatus } : m
            ),
          },
          error: result.error.message,
          isSending: false,
        }));
      }
    }
  },

  editMessage: (messageId, content) => {
    const { activeConversationId } = get();
    if (!activeConversationId) return;

    set((state) => ({
      messages: {
        ...state.messages,
        [activeConversationId]: (state.messages[activeConversationId] ?? []).map((m) =>
          m.id === messageId ? { ...m, content, editedAt: new Date().toISOString() } : m
        ),
      },
    }));

    if (socketClient.isConnected()) {
      socketEmitter.editMessage({ messageId, conversationId: activeConversationId, content });
    }
  },

  deleteMessage: (messageId) => {
    const { activeConversationId } = get();
    if (!activeConversationId) return;

    set((state) => ({
      messages: {
        ...state.messages,
        [activeConversationId]: (state.messages[activeConversationId] ?? []).map((m) =>
          m.id === messageId ? { ...m, isDeleted: true, content: "This message was deleted" } : m
        ),
      },
    }));

    if (socketClient.isConnected()) {
      socketEmitter.deleteMessage({ messageId, conversationId: activeConversationId });
    }
  },

  markAsRead: async (conversationId) => {
    const msgs = get().messages[conversationId] ?? [];
    const unreadIds = msgs
      .filter((m) => m.senderId !== "user-1" && m.status !== "seen")
      .map((m) => m.id);

    if (socketClient.isConnected() && unreadIds.length > 0) {
      socketEmitter.markMessagesRead({ conversationId, messageIds: unreadIds });
    } else {
      await chatService.markAsRead(conversationId);
    }

    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      ),
    }));
  },

  addReaction: (messageId, emoji, userId) => {
    const { activeConversationId } = get();
    if (!activeConversationId) return;

    set((state) => {
      const msgs = state.messages[activeConversationId] ?? [];
      return {
        messages: {
          ...state.messages,
          [activeConversationId]: msgs.map((m) => {
            if (m.id !== messageId) return m;
            const existing = m.reactions.findIndex(
              (r) => r.emoji === emoji && r.userId === userId
            );
            const reactions =
              existing >= 0
                ? m.reactions.filter((_, i) => i !== existing)
                : [...m.reactions, { emoji, userId }];
            return { ...m, reactions };
          }),
        },
      };
    });

    if (socketClient.isConnected()) {
      socketEmitter.reactToMessage({ messageId, conversationId: activeConversationId, emoji });
    } else {
      chatService.addReaction(messageId, emoji, userId);
    }
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
    get().searchConversations();
  },

  setActiveTab: (tab) => {
    set({ activeTab: tab });
    get().searchConversations();
  },

  searchConversations: async () => {
    const { searchQuery, activeTab } = get();
    set({ isLoadingConversations: true });
    const result = await chatService.searchConversations(searchQuery, activeTab);
    if (result.success) {
      set({ conversations: result.data, isLoadingConversations: false });
    } else {
      set({ error: result.error.message, isLoadingConversations: false });
    }
  },

  setReplyTo: (reply) => set({ replyTo: reply }),
  clearError: () => set({ error: null }),

  getActiveConversation: () => {
    const { conversations, activeConversationId } = get();
    return conversations.find((c) => c.id === activeConversationId) ?? null;
  },

  getActiveMessages: () => {
    const { messages, activeConversationId } = get();
    if (!activeConversationId) return [];
    return messages[activeConversationId] ?? [];
  },

  handleIncomingMessage: (message) => {
    set((state) => {
      const existing = state.messages[message.conversationId] ?? [];
      if (existing.some((m) => m.id === message.id)) return state;

      const updated = message.tempId
        ? existing.map((m) => (m.tempId === message.tempId || m.id === message.tempId ? message : m))
        : [...existing, message];

      return {
        messages: { ...state.messages, [message.conversationId]: updated },
      };
    });
  },

  handleMessageUpdated: (message) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [message.conversationId]: (state.messages[message.conversationId] ?? []).map((m) =>
          m.id === message.id ? message : m
        ),
      },
    }));
  },

  handleMessageDeleted: ({ messageId, conversationId }) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] ?? []).map((m) =>
          m.id === messageId
            ? { ...m, isDeleted: true, content: "This message was deleted" }
            : m
        ),
      },
    }));
  },

  handleMessageStatus: ({ messageId, conversationId, status }) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] ?? []).map((m) =>
          m.id === messageId ? { ...m, status } : m
        ),
      },
    }));
  },

  handleMessageReaction: (message) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [message.conversationId]: (state.messages[message.conversationId] ?? []).map((m) =>
          m.id === message.id ? message : m
        ),
      },
    }));
  },

  handleConversationUpdated: (conversation) => {
    set((state) => ({
      conversations: upsertConversation(state.conversations, conversation),
    }));
  },

  handleTypingUpdate: (conversationId, userId, isTyping) => {
    set((state) => {
      const current = state.typingUsers[conversationId] ?? [];
      const updated = isTyping
        ? current.includes(userId) ? current : [...current, userId]
        : current.filter((id) => id !== userId);
      return {
        typingUsers: { ...state.typingUsers, [conversationId]: updated },
      };
    });
  },

  handleOnlineUsers: (userIds) => {
    set((state) => ({
      onlineUsers: userIds,
      conversations: state.conversations.map((c) => {
        if (c.type !== "dm") return c;
        const otherId = c.participantIds.find((id) => id !== "user-1");
        return { ...c, isOnline: otherId ? userIds.includes(otherId) : c.isOnline };
      }),
    }));
  },

  handlePresenceUpdate: (userId, status) => {
    set((state) => ({
      conversations: state.conversations.map((c) => {
        if (!c.participantIds.includes(userId)) return c;
        if (c.type !== "dm") return c;
        return { ...c, isOnline: status === "online" };
      }),
    }));
  },
}));
