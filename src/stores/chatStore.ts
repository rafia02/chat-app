import { create } from "zustand";
import type {
  Conversation,
  ConversationTab,
  Message,
  MessageStatus,
  ReplyTo,
} from "@/types";
import { chatService } from "@/services";
import { socketClient, socketEmitter } from "@/services/socket";
import { generateId } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

interface ChatState {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  activeConversationId: string | null;
  searchQuery: string;
  activeTab: ConversationTab;
  typingUsers: Record<string, string[]>;
  onlineUsers: string[];
  isLoadingConversations: boolean;
  hasAttemptedConversations: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;
  error: string | null;
  replyTo: ReplyTo | null;

  fetchConversations: (force?: boolean) => Promise<void>;
  fetchConversation: (id: string) => Promise<void>;
  createDM: (otherUserId: string) => Promise<Conversation | null>;
  createGroup: (
    name: string,
    members: string[],
  ) => Promise<Conversation | null>;
  fetchMessages: (conversationId: string, page?: number) => Promise<void>;
  setActiveConversation: (id: string | null) => void;
  sendMessage: (content: string, file?: File) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
  addReaction: (
    messageId: string,
    emoji: string,
    userId: string,
  ) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setActiveTab: (tab: ConversationTab) => void;
  setReplyTo: (reply: ReplyTo | null) => void;
  searchConversations: () => Promise<void>;
  clearError: () => void;
  getActiveConversation: () => Conversation | null;
  getActiveMessages: () => Message[];

  handleIncomingMessage: (message: Message) => void;
  handleMessageUpdated: (message: Message) => void;
  handleMessageDeleted: (payload: {
    messageId: string;
    conversationId: string;
  }) => void;
  handleMessageStatus: (payload: {
    messageId: string;
    conversationId: string;
    status: MessageStatus;
  }) => void;
  handleMessageReaction: (message: Message) => void;
  handleMessageDelivered: (payload: {
    messageId: string;
    conversationId: string;
  }) => void;
  handleMessageSeen: (payload: {
    conversationId: string;
    messageIds: string[];
    userId: string;
  }) => void;
  handleConversationUpdated: (conversation: Conversation) => void;
  removeConversation: (conversationId: string) => void;
  handleTypingUpdate: (
    conversationId: string,
    userId: string,
    isTyping: boolean,
  ) => void;
  handleUserOnline: (userId: string) => void;
  handleUserOffline: (userId: string) => void;
}

function currentUserId(): string {
  return useAuthStore.getState().user?.id ?? "";
}

function upsertConversation(
  conversations: Conversation[],
  updated: Conversation,
): Conversation[] {
  const idx = conversations.findIndex((c) => c.id === updated.id);
  if (idx >= 0) {
    const next = [...conversations];
    next[idx] = { ...next[idx], ...updated };
    return next.sort(
      (a, b) =>
        new Date(b.lastMessageAt).getTime() -
        new Date(a.lastMessageAt).getTime(),
    );
  }
  return [updated, ...conversations];
}

function withOnlineFlags(
  conversations: Conversation[],
  onlineUsers: string[],
  userId: string,
): Conversation[] {
  return conversations.map((c) => {
    if (c.type !== "dm") return c;
    const otherId = c.participantIds.find((id) => id !== userId);
    return {
      ...c,
      isOnline: otherId ? onlineUsers.includes(otherId) : c.isOnline,
    };
  });
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
  hasAttemptedConversations: false,
  isLoadingMessages: false,
  isSending: false,
  error: null,
  replyTo: null,

  fetchConversations: async (force = false) => {
    if (
      get().isLoadingConversations ||
      (!force && get().hasAttemptedConversations)
    )
      return;
    set({
      isLoadingConversations: true,
      hasAttemptedConversations: true,
      error: null,
    });
    const result = await chatService.getConversations();
    if (result.success) {
      const userId = currentUserId();
      set((state) => ({
        conversations: withOnlineFlags(result.data, state.onlineUsers, userId),
        isLoadingConversations: false,
      }));
    } else {
      set({ error: result.error.message, isLoadingConversations: false });
    }
  },

  fetchConversation: async (id) => {
    if (!id) return;

    const existing = get().conversations.find((c) => c.id === id);
    if (existing) return;

    set({ isLoadingConversations: true, error: null });
    const result = await chatService.getConversation(id);
    if (result.success) {
      const userId = currentUserId();
      set((state) => ({
        conversations: withOnlineFlags(
          upsertConversation(state.conversations, result.data),
          state.onlineUsers,
          userId,
        ),
        isLoadingConversations: false,
      }));
    } else {
      set({ error: result.error.message, isLoadingConversations: false });
    }
  },

  createDM: async (otherUserId) => {
    set({ isLoadingConversations: true, error: null });
    const result = await chatService.createDM(otherUserId);
    if (!result.success) {
      set({ error: result.error.message, isLoadingConversations: false });
      return null;
    }

    const userId = currentUserId();
    set((state) => ({
      conversations: withOnlineFlags(
        upsertConversation(state.conversations, result.data),
        state.onlineUsers,
        userId,
      ),
      isLoadingConversations: false,
    }));
    return result.data;
  },

  createGroup: async (name, members) => {
    set({ isLoadingConversations: true, error: null });
    const result = await chatService.createGroup(name, members);
    if (!result.success) {
      set({ error: result.error.message, isLoadingConversations: false });
      return null;
    }

    const userId = currentUserId();
    set((state) => ({
      conversations: withOnlineFlags(
        upsertConversation(state.conversations, result.data),
        state.onlineUsers,
        userId,
      ),
      isLoadingConversations: false,
    }));
    return result.data;
  },

  fetchMessages: async (conversationId, page = 1) => {
    set({ isLoadingMessages: true, error: null });
    const result = await chatService.getMessages(conversationId, page, 50);
    if (result.success) {
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]:
            page > 1
              ? [...result.data, ...(state.messages[conversationId] ?? [])]
              : result.data,
        },
        isLoadingMessages: false,
      }));
      if (page === 1 && get().activeConversationId === conversationId) {
        await get().markAsRead(conversationId);
      }
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

  sendMessage: async (content, file) => {
    const { activeConversationId, replyTo } = get();
    if (!activeConversationId) return;
    if (!content.trim() && !file) return;

    const userId = currentUserId();
    const tempId = generateId("temp");
    const trimmed = content.trim();
    const optimisticMessage: Message = {
      id: tempId,
      conversationId: activeConversationId,
      senderId: userId,
      content: trimmed || (file ? "📎 Media" : ""),
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

    const result = await chatService.sendMessage({
      conversationId: activeConversationId,
      content: trimmed || (file ? "📎 Media" : ""),
      replyTo: replyTo ?? undefined,
      file,
    });

    if (result.success) {
      set((state) => {
        const existing = state.messages[activeConversationId] ?? [];
        const alreadyPresent = existing.some((m) => m.id === result.data.id);
        const updatedMessages = alreadyPresent
          ? existing.filter((m) => m.tempId !== tempId)
          : existing.map((m) => (m.tempId === tempId ? result.data : m));

        return {
          messages: {
            ...state.messages,
            [activeConversationId]: updatedMessages,
          },
          conversations: state.conversations.map((c) =>
            c.id === activeConversationId
              ? {
                  ...c,
                  lastMessage: result.data.content,
                  lastMessageAt: result.data.createdAt,
                }
              : c,
          ),
          isSending: false,
        };
      });
    } else {
      set((state) => ({
        messages: {
          ...state.messages,
          [activeConversationId]: (
            state.messages[activeConversationId] ?? []
          ).map((m) =>
            m.tempId === tempId
              ? { ...m, status: "failed" as MessageStatus }
              : m,
          ),
        },
        error: result.error.message,
        isSending: false,
      }));
    }
  },

  editMessage: async (messageId, content) => {
    const { activeConversationId } = get();
    if (!activeConversationId) return;

    set((state) => ({
      messages: {
        ...state.messages,
        [activeConversationId]: (
          state.messages[activeConversationId] ?? []
        ).map((m) =>
          m.id === messageId
            ? { ...m, content, editedAt: new Date().toISOString() }
            : m,
        ),
      },
    }));

    const result = await chatService.editMessage(messageId, content);
    if (result.success) {
      get().handleMessageUpdated(result.data);
    }
  },

  deleteMessage: async (messageId) => {
    const { activeConversationId } = get();
    if (!activeConversationId) return;

    set((state) => ({
      messages: {
        ...state.messages,
        [activeConversationId]: (
          state.messages[activeConversationId] ?? []
        ).map((m) =>
          m.id === messageId
            ? { ...m, isDeleted: true, content: "This message was deleted" }
            : m,
        ),
      },
    }));

    await chatService.deleteMessage(messageId);
  },

  markAsRead: async (conversationId) => {
    const userId = currentUserId();
    const msgs = get().messages[conversationId] ?? [];
    const unreadIds = msgs
      .filter((m) => m.senderId !== userId && m.status !== "seen")
      .map((m) => m.id);

    if (socketClient.isConnected() && unreadIds.length > 0) {
      socketEmitter.markMessagesSeen({ conversationId, messageIds: unreadIds });
    }

    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c,
      ),
    }));
  },

  addReaction: async (messageId, emoji, userId) => {
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
              (r) => r.emoji === emoji && r.userId === userId,
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

    const result = await chatService.addReaction(messageId, emoji, userId);
    if (result.success) {
      get().handleMessageReaction(result.data);
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
    const result = await chatService.searchConversations(
      searchQuery,
      activeTab,
    );
    if (result.success) {
      const userId = currentUserId();
      set((state) => ({
        conversations: withOnlineFlags(result.data, state.onlineUsers, userId),
        isLoadingConversations: false,
      }));
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
    const userId = currentUserId();
    const isActive = get().activeConversationId === message.conversationId;
    const isOwn = message.senderId === userId;

    set((state) => {
      const existing = state.messages[message.conversationId] ?? [];
      if (existing.some((m) => m.id === message.id)) {
        return {
          conversations: state.conversations.map((c) =>
            c.id === message.conversationId
              ? {
                  ...c,
                  lastMessage: message.content,
                  lastMessageAt: message.createdAt,
                }
              : c,
          ),
        };
      }

      const replacedOptimistic = message.tempId
        ? existing.map((m) =>
            m.tempId === message.tempId || m.id === message.tempId
              ? message
              : m,
          )
        : null;

      const matchedOwnOptimistic =
        isOwn &&
        existing.find(
          (m) =>
            m.status === "sending" &&
            m.senderId === userId &&
            m.content === message.content,
        );

      let updated: Message[];
      if (replacedOptimistic) {
        updated = replacedOptimistic;
      } else if (matchedOwnOptimistic) {
        updated = existing.map((m) =>
          m.id === matchedOwnOptimistic.id ? message : m,
        );
      } else {
        updated = [...existing, message];
      }

      return {
        messages: { ...state.messages, [message.conversationId]: updated },
        conversations: state.conversations.map((c) =>
          c.id === message.conversationId
            ? {
                ...c,
                lastMessage: message.content,
                lastMessageAt: message.createdAt,
                unreadCount:
                  !isOwn && !isActive ? c.unreadCount + 1 : c.unreadCount,
              }
            : c,
        ),
      };
    });

    if (isActive && !isOwn) {
      get().markAsRead(message.conversationId);
    }
  },

  handleMessageUpdated: (message) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [message.conversationId]: (
          state.messages[message.conversationId] ?? []
        ).map((m) => (m.id === message.id ? message : m)),
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
            : m,
        ),
      },
    }));
  },

  handleMessageStatus: ({ messageId, conversationId, status }) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] ?? []).map((m) =>
          m.id === messageId ? { ...m, status } : m,
        ),
      },
    }));
  },

  handleMessageDelivered: ({ messageId, conversationId }) => {
    get().handleMessageStatus({
      messageId,
      conversationId,
      status: "delivered",
    });
  },

  handleMessageSeen: ({ conversationId, messageIds, userId }) => {
    const me = currentUserId();
    if (userId === me) return;

    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] ?? []).map((m) =>
          messageIds.includes(m.id) && m.senderId === me
            ? { ...m, status: "seen" as MessageStatus }
            : m,
        ),
      },
    }));
  },

  handleMessageReaction: (message) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [message.conversationId]: (
          state.messages[message.conversationId] ?? []
        ).map((m) => (m.id === message.id ? message : m)),
      },
    }));
  },

  handleConversationUpdated: (conversation) => {
    set((state) => ({
      conversations: upsertConversation(state.conversations, conversation),
    }));
  },

  removeConversation: (conversationId) => {
    set((state) => ({
      conversations: state.conversations.filter(
        (conversation) => conversation.id !== conversationId,
      ),
      activeConversationId:
        state.activeConversationId === conversationId
          ? null
          : state.activeConversationId,
    }));
  },

  handleTypingUpdate: (conversationId, userId, isTyping) => {
    set((state) => {
      const current = state.typingUsers[conversationId] ?? [];
      const updated = isTyping
        ? current.includes(userId)
          ? current
          : [...current, userId]
        : current.filter((id) => id !== userId);
      return {
        typingUsers: { ...state.typingUsers, [conversationId]: updated },
      };
    });
  },

  handleUserOnline: (userId) => {
    set((state) => {
      const onlineUsers = state.onlineUsers.includes(userId)
        ? state.onlineUsers
        : [...state.onlineUsers, userId];
      return {
        onlineUsers,
        conversations: withOnlineFlags(
          state.conversations,
          onlineUsers,
          currentUserId(),
        ),
      };
    });
  },

  handleUserOffline: (userId) => {
    set((state) => {
      const onlineUsers = state.onlineUsers.filter((id) => id !== userId);
      return {
        onlineUsers,
        conversations: withOnlineFlags(
          state.conversations,
          onlineUsers,
          currentUserId(),
        ),
      };
    });
  },
}));
