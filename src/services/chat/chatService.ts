import type {
  Conversation,
  ConversationTab,
  Message,
  ReplyTo,
  ServiceResult,
} from "@/types";
import type { IChatService, SendMessagePayload } from "./chatService.interface";
import { http, toApiError } from "@/lib/http";
import {
  extractParticipantUsers,
  mapConversation,
  mapConversations,
  mapMessage,
  mapMessages,
} from "@/lib/mappers";
import { getAuthSession } from "@/lib/storage";
import { useUsersStore } from "@/stores/usersStore";

function currentUserId(): string | null {
  return getAuthSession()?.user.id ?? null;
}

function cacheParticipants(rawConversations: unknown) {
  if (!Array.isArray(rawConversations)) return;
  const users = rawConversations.flatMap((c) => extractParticipantUsers(c));
  if (users.length > 0) {
    useUsersStore.getState().upsertUsers(users);
  }
}

function filterByTab(
  items: Conversation[],
  tab: ConversationTab,
): Conversation[] {
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

class ChatService implements IChatService {
  async getConversations(): Promise<ServiceResult<Conversation[]>> {
    try {
      const { data } = await http.get<{ success: boolean; data: unknown }>(
        "/conversations",
      );

      if (!data.success) {
        return {
          success: false,
          error: { message: "Failed to load conversations", status: 400 },
        };
      }

      cacheParticipants(data.data);
      const conversations = mapConversations(data.data, currentUserId());
      return {
        success: true,
        data: conversations.filter(
          (conversation) => conversation.requestStatus !== "pending",
        ),
      };
    } catch (error) {
      return { success: false, error: toApiError(error) };
    }
  }

  async getConversation(id: string): Promise<ServiceResult<Conversation>> {
    try {
      const { data } = await http.get<{ success: boolean; data: unknown }>(
        `/conversations/${id}`,
      );

      if (!data.success || !data.data) {
        return {
          success: false,
          error: {
            message: "Conversation not found",
            code: "NOT_FOUND",
            status: 404,
          },
        };
      }

      cacheParticipants([data.data]);
      return {
        success: true,
        data: mapConversation(data.data, currentUserId()),
      };
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.status !== 404) {
        return { success: false, error: apiError };
      }

      const list = await this.getConversations();
      if (!list.success) return list;

      const conversation = list.data.find((c) => c.id === id);
      if (!conversation) {
        return {
          success: false,
          error: {
            message: "Conversation not found",
            code: "NOT_FOUND",
            status: 404,
          },
        };
      }

      return { success: true, data: conversation };
    }
  }

  async getMessages(
    conversationId: string,
    page = 1,
    limit = 50,
  ): Promise<ServiceResult<Message[]>> {
    try {
      const { data } = await http.get<{ success: boolean; data: unknown }>(
        "/messages",
        { params: { conversationId, page, limit } },
      );

      return { success: true, data: mapMessages(data.data) };
    } catch (error) {
      return { success: false, error: toApiError(error) };
    }
  }

  async sendMessage(
    payload: SendMessagePayload,
  ): Promise<ServiceResult<Message>> {
    try {
      let response;

      if (payload.file) {
        const formData = new FormData();
        formData.append("conversationId", payload.conversationId);
        formData.append("content", payload.content || "📎 Media");
        if (payload.replyTo) {
          formData.append("replyTo", JSON.stringify(payload.replyTo));
        }
        formData.append("file", payload.file);

        response = await http.post<{ success: boolean; data: unknown }>(
          "/messages/send",
          formData,
        );
      } else {
        response = await http.post<{ success: boolean; data: unknown }>(
          "/messages/send",
          {
            conversationId: payload.conversationId,
            content: payload.content,
            replyTo: payload.replyTo
              ? {
                  messageId: payload.replyTo.messageId,
                  content: payload.replyTo.content,
                  senderId: payload.replyTo.senderId,
                }
              : undefined,
          },
        );
      }

      return { success: true, data: mapMessage(response.data.data) };
    } catch (error) {
      return { success: false, error: toApiError(error) };
    }
  }

  async editMessage(
    messageId: string,
    content: string,
  ): Promise<ServiceResult<Message>> {
    try {
      const { data } = await http.put<{ success: boolean; data: unknown }>(
        "/messages/edit",
        { messageId, content },
      );
      return { success: true, data: mapMessage(data.data) };
    } catch (error) {
      return { success: false, error: toApiError(error) };
    }
  }

  async deleteMessage(messageId: string): Promise<ServiceResult<Message>> {
    try {
      const { data } = await http.delete<{ success: boolean; data: unknown }>(
        "/messages/delete",
        { data: { messageId } },
      );
      return { success: true, data: mapMessage(data.data) };
    } catch (error) {
      return { success: false, error: toApiError(error) };
    }
  }

  async markAsRead(_conversationId: string): Promise<ServiceResult<void>> {
    return { success: true, data: undefined };
  }

  async addReaction(
    messageId: string,
    emoji: string,
    _userId: string,
  ): Promise<ServiceResult<Message>> {
    try {
      const { data } = await http.post<{ success: boolean; data: unknown }>(
        "/messages/react",
        { messageId, emoji },
      );
      return { success: true, data: mapMessage(data.data) };
    } catch (error) {
      return { success: false, error: toApiError(error) };
    }
  }

  async createDM(otherUserId: string): Promise<ServiceResult<Conversation>> {
    try {
      const { data } = await http.post<{ success: boolean; data: unknown }>(
        "/conversations/dm",
        { otherUserId },
      );

      if (!data.success || !data.data) {
        return {
          success: false,
          error: { message: "Failed to create conversation", status: 400 },
        };
      }

      cacheParticipants([data.data]);
      const conversation = mapConversation(data.data, currentUserId());
      const otherUser = await useUsersStore.getState().ensureUser(otherUserId);
      if (otherUser && conversation.type === "dm") {
        conversation.name = otherUser.name;
        conversation.avatar = otherUser.avatar;
        conversation.isOnline = otherUser.status === "online";
      }
      return { success: true, data: conversation };
    } catch (error) {
      return { success: false, error: toApiError(error) };
    }
  }

  async createGroup(
    name: string,
    members: string[],
  ): Promise<ServiceResult<Conversation>> {
    try {
      const { data } = await http.post<{ success: boolean; data: unknown }>(
        "/conversations/group",
        { name, members },
      );

      if (!data.success || !data.data) {
        return {
          success: false,
          error: { message: "Failed to create group", status: 400 },
        };
      }

      cacheParticipants([data.data]);
      return {
        success: true,
        data: mapConversation(data.data, currentUserId()),
      };
    } catch (error) {
      return { success: false, error: toApiError(error) };
    }
  }

  async searchConversations(
    query: string,
    tab: ConversationTab,
  ): Promise<ServiceResult<Conversation[]>> {
    try {
      const result = await this.getConversations();
      if (!result.success) return result;

      let filtered = filterByTab(result.data, tab);

      if (query.trim()) {
        const q = query.toLowerCase();
        filtered = filtered.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.lastMessage.toLowerCase().includes(q),
        );
      }

      return {
        success: true,
        data: filtered.sort(
          (a, b) =>
            new Date(b.lastMessageAt).getTime() -
            new Date(a.lastMessageAt).getTime(),
        ),
      };
    } catch (error) {
      return { success: false, error: toApiError(error) };
    }
  }
}

export const chatService: IChatService = new ChatService();

export type { ReplyTo };
