import type {
  Conversation,
  ConversationTab,
  Message,
  ServiceResult,
} from "@/types";
import type { IChatService, SendMessagePayload } from "./chatService.interface";
import { MOCK_CONVERSATIONS } from "@/mocks/conversations";
import { MOCK_MESSAGES } from "@/mocks/messages";
import { getUserById } from "@/mocks/users";
import { delay, generateId } from "@/lib/api";
import { formatConversationTime } from "@/lib/date";

// In-memory mutable state simulating a backend database
let conversations = [...MOCK_CONVERSATIONS];
let messages = JSON.parse(JSON.stringify(MOCK_MESSAGES)) as Record<string, Message[]>;

function filterByTab(items: Conversation[], tab: ConversationTab): Conversation[] {
  switch (tab) {
    case "unread":
      return items.filter((c) => c.unreadCount > 0);
    case "groups":
      return items.filter((c) => c.type === "group");
    case "dm":
      return items.filter((c) => c.type === "dm");
    default:
      return items;
  }
}

class MockChatService implements IChatService {
  async getConversations(): Promise<ServiceResult<Conversation[]>> {
    await delay();
    const sorted = [...conversations].sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
    return { success: true, data: sorted };
  }

  async getConversation(id: string): Promise<ServiceResult<Conversation>> {
    await delay(300);
    const conversation = conversations.find((c) => c.id === id);
    if (!conversation) {
      return {
        success: false,
        error: { message: "Conversation not found", code: "NOT_FOUND", status: 404 },
      };
    }
    return { success: true, data: conversation };
  }

  async getMessages(conversationId: string): Promise<ServiceResult<Message[]>> {
    await delay(400);
    const msgs = messages[conversationId] ?? [];
    return { success: true, data: [...msgs] };
  }

  async sendMessage(payload: SendMessagePayload): Promise<ServiceResult<Message>> {
    await delay(300);

    const newMessage: Message = {
      id: generateId("msg"),
      conversationId: payload.conversationId,
      senderId: "user-1",
      content: payload.content,
      createdAt: new Date().toISOString(),
      status: "sending",
      reactions: [],
      replyTo: payload.replyTo,
    };

    if (!messages[payload.conversationId]) {
      messages[payload.conversationId] = [];
    }
    messages[payload.conversationId].push(newMessage);

    // Update conversation preview
    conversations = conversations.map((c) =>
      c.id === payload.conversationId
        ? {
            ...c,
            lastMessage: payload.content,
            lastMessageAt: newMessage.createdAt,
          }
        : c
    );

    // Simulate delivery status updates
    setTimeout(() => {
      const msg = messages[payload.conversationId]?.find((m) => m.id === newMessage.id);
      if (msg) msg.status = "delivered";
    }, 800);

    setTimeout(() => {
      const msg = messages[payload.conversationId]?.find((m) => m.id === newMessage.id);
      if (msg) msg.status = "seen";
    }, 2000);

    return { success: true, data: newMessage };
  }

  async markAsRead(conversationId: string): Promise<ServiceResult<void>> {
    await delay(200);
    conversations = conversations.map((c) =>
      c.id === conversationId ? { ...c, unreadCount: 0 } : c
    );
    return { success: true, data: undefined };
  }

  async addReaction(
    messageId: string,
    emoji: string,
    userId: string
  ): Promise<ServiceResult<Message>> {
    await delay(200);

    for (const convId of Object.keys(messages)) {
      const msg = messages[convId].find((m) => m.id === messageId);
      if (msg) {
        const existing = msg.reactions.find(
          (r) => r.emoji === emoji && r.userId === userId
        );
        if (!existing) {
          msg.reactions.push({ emoji, userId });
        }
        return { success: true, data: { ...msg } };
      }
    }

    return {
      success: false,
      error: { message: "Message not found", code: "NOT_FOUND", status: 404 },
    };
  }

  async searchConversations(
    query: string,
    tab: ConversationTab
  ): Promise<ServiceResult<Conversation[]>> {
    await delay(300);
    let filtered = filterByTab(conversations, tab);

    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.lastMessage.toLowerCase().includes(q)
      );
    }

    const sorted = [...filtered].sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );

    return { success: true, data: sorted };
  }

  async simulateIncomingMessage(
    conversationId: string,
    senderId: string,
    content: string
  ): Promise<ServiceResult<Message>> {
    await delay(500);

    const sender = getUserById(senderId);
    const newMessage: Message = {
      id: generateId("msg"),
      conversationId,
      senderId,
      content,
      createdAt: new Date().toISOString(),
      status: "delivered",
      reactions: [],
    };

    if (!messages[conversationId]) {
      messages[conversationId] = [];
    }
    messages[conversationId].push(newMessage);

    conversations = conversations.map((c) =>
      c.id === conversationId
        ? {
            ...c,
            lastMessage: content,
            lastMessageAt: newMessage.createdAt,
            unreadCount: c.unreadCount + 1,
          }
        : c
    );

    return { success: true, data: newMessage };
  }
}

export const chatService: IChatService = new MockChatService();

// Export for store to sync display times
export function getConversationDisplayTime(dateString: string): string {
  return formatConversationTime(dateString);
}
