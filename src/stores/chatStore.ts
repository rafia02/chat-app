import { create } from "zustand";
import type {
  Conversation,
  ConversationTab,
  Message,
  ReplyTo,
} from "@/types";
import { chatService } from "@/services";

interface ChatState {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  activeConversationId: string | null;
  searchQuery: string;
  activeTab: ConversationTab;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;
  error: string | null;
  replyTo: ReplyTo | null;

  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  setActiveConversation: (id: string | null) => void;
  sendMessage: (content: string) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string, userId: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setActiveTab: (tab: ConversationTab) => void;
  setReplyTo: (reply: ReplyTo | null) => void;
  searchConversations: () => Promise<void>;
  clearError: () => void;
  getActiveConversation: () => Conversation | null;
  getActiveMessages: () => Message[];
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  messages: {},
  activeConversationId: null,
  searchQuery: "",
  activeTab: "all",
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
    set({ activeConversationId: id, replyTo: null });
    if (id) {
      get().markAsRead(id);
      if (!get().messages[id]) {
        get().fetchMessages(id);
      }
    }
  },

  sendMessage: async (content) => {
    const { activeConversationId, replyTo } = get();
    if (!activeConversationId || !content.trim()) return;

    set({ isSending: true, error: null });
    const result = await chatService.sendMessage({
      conversationId: activeConversationId,
      content: content.trim(),
      replyTo: replyTo ?? undefined,
    });

    if (result.success) {
      const msg = result.data;
      set((state) => ({
        messages: {
          ...state.messages,
          [activeConversationId]: [
            ...(state.messages[activeConversationId] ?? []),
            msg,
          ],
        },
        conversations: state.conversations.map((c) =>
          c.id === activeConversationId
            ? {
                ...c,
                lastMessage: content.trim(),
                lastMessageAt: msg.createdAt,
              }
            : c
        ),
        isSending: false,
        replyTo: null,
      }));

      // Poll for status updates from mock service
      const pollStatus = () => {
        chatService.getMessages(activeConversationId).then((res) => {
          if (res.success) {
            set((state) => ({
              messages: { ...state.messages, [activeConversationId]: res.data },
            }));
          }
        });
      };
      setTimeout(pollStatus, 900);
      setTimeout(pollStatus, 2100);
    } else {
      set({ error: result.error.message, isSending: false });
    }
  },

  markAsRead: async (conversationId) => {
    await chatService.markAsRead(conversationId);
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      ),
    }));
  },

  addReaction: async (messageId, emoji, userId) => {
    const result = await chatService.addReaction(messageId, emoji, userId);
    if (result.success) {
      const updated = result.data;
      set((state) => {
        const convId = updated.conversationId;
        const msgs = state.messages[convId] ?? [];
        return {
          messages: {
            ...state.messages,
            [convId]: msgs.map((m) => (m.id === messageId ? updated : m)),
          },
        };
      });
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
}));
