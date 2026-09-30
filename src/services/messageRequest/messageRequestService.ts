import type { Conversation, ServiceResult } from "@/types";
import type { MessageRequest } from "@/types/social";
import { getAuthSession } from "@/lib/storage";
import { mapConversation } from "@/lib/mappers";
import { http, toApiError } from "@/lib/http";

function mapMessageRequest(raw: unknown): MessageRequest {
  const data = (raw ?? {}) as Record<string, unknown>;
  const conversation = mapConversation(data, getAuthSession()?.user.id);
  return {
    id: conversation.id,
    conversation,
    requestedBy: String(data.requestedBy ?? ""),
    createdAt: String(data.createdAt ?? data.updatedAt ?? ""),
  };
}

class MessageRequestService {
  private async request(
    path: string,
    method: "get" | "patch" = "get",
  ): Promise<ServiceResult<unknown>> {
    try {
      const { data } = await http.request<{
        success: boolean;
        data: unknown;
        message?: string;
      }>({ method, url: path });
      if (!data.success) {
        return {
          success: false,
          error: {
            message: data.message ?? "Message request failed",
            status: 400,
          },
        };
      }
      return { success: true, data: data.data };
    } catch (error) {
      return { success: false, error: toApiError(error) };
    }
  }

  async getRequests(
    direction: "received" | "sent",
  ): Promise<ServiceResult<MessageRequest[]>> {
    const result = await this.request(
      direction === "sent" ? "/message-requests/sent" : "/message-requests",
    );
    if (!result.success) return result;
    return {
      success: true,
      data: Array.isArray(result.data)
        ? result.data.map(mapMessageRequest)
        : [],
    };
  }

  async accept(conversationId: string): Promise<ServiceResult<Conversation>> {
    const result = await this.request(
      `/message-requests/${encodeURIComponent(conversationId)}/accept`,
      "patch",
    );
    return result.success
      ? {
          success: true,
          data: mapConversation(result.data, getAuthSession()?.user.id),
        }
      : result;
  }

  async reject(conversationId: string): Promise<ServiceResult<Conversation>> {
    const result = await this.request(
      `/message-requests/${encodeURIComponent(conversationId)}/reject`,
      "patch",
    );
    return result.success
      ? {
          success: true,
          data: mapConversation(result.data, getAuthSession()?.user.id),
        }
      : result;
  }
}

export const messageRequestService = new MessageRequestService();
