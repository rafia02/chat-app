import type { ServiceResult, User } from "@/types";
import type { FriendRequest, FriendshipStatusResponse } from "@/types/social";
import { http, toApiError } from "@/lib/http";
import { mapUser } from "@/lib/mappers";

function idOf(value: unknown): string {
  if (typeof value === "string" || typeof value === "number")
    return String(value);
  if (value && typeof value === "object") {
    const data = value as Record<string, unknown>;
    if (data._id != null) return String(data._id);
    if (data.id != null) return String(data.id);
  }
  return "";
}

export function mapFriendRequest(raw: unknown): FriendRequest {
  const data = (raw ?? {}) as Record<string, unknown>;
  const senderRaw = data.senderId;
  const recipientRaw = data.recipientId;
  const sender =
    senderRaw && typeof senderRaw === "object" ? mapUser(senderRaw) : undefined;
  const recipient =
    recipientRaw && typeof recipientRaw === "object"
      ? mapUser(recipientRaw)
      : undefined;
  const status = data.status;

  return {
    id: idOf(data._id ?? data.id),
    senderId: idOf(senderRaw),
    recipientId: idOf(recipientRaw),
    sender,
    recipient,
    status:
      status === "accepted" || status === "rejected" || status === "cancelled"
        ? status
        : "pending",
    createdAt: String(data.createdAt ?? ""),
  };
}

function mapRequests(raw: unknown): FriendRequest[] {
  return Array.isArray(raw) ? raw.map(mapFriendRequest) : [];
}

class FriendService {
  private async request<T>(
    method: "get" | "post" | "patch" | "delete",
    path: string,
  ) {
    try {
      const response = await http.request<{
        success: boolean;
        data: T;
        message?: string;
      }>({
        method,
        url: path,
      });
      if (!response.data.success) {
        return {
          success: false as const,
          error: {
            message: response.data.message ?? "Friend request failed",
            status: 400,
          },
        };
      }
      return { success: true as const, data: response.data.data };
    } catch (error) {
      return { success: false as const, error: toApiError(error) };
    }
  }

  async getFriends(): Promise<ServiceResult<User[]>> {
    const result = await this.request<unknown[]>("get", "/friends");
    if (!result.success) return result;
    return {
      success: true,
      data: Array.isArray(result.data) ? result.data.map(mapUser) : [],
    };
  }

  async getRequests(
    direction: "received" | "sent",
  ): Promise<ServiceResult<FriendRequest[]>> {
    const result = await this.request<unknown[]>(
      "get",
      `/friend-requests/${direction}`,
    );
    if (!result.success) return result;
    return { success: true, data: mapRequests(result.data) };
  }

  async sendRequest(userId: string): Promise<ServiceResult<FriendRequest>> {
    const result = await this.request<unknown>(
      "post",
      `/friend-requests/${encodeURIComponent(userId)}`,
    );
    return result.success
      ? { success: true, data: mapFriendRequest(result.data) }
      : result;
  }

  async acceptRequest(
    requestId: string,
  ): Promise<ServiceResult<FriendRequest>> {
    const result = await this.request<unknown>(
      "patch",
      `/friend-requests/${encodeURIComponent(requestId)}/accept`,
    );
    return result.success
      ? { success: true, data: mapFriendRequest(result.data) }
      : result;
  }

  async rejectRequest(
    requestId: string,
  ): Promise<ServiceResult<FriendRequest>> {
    const result = await this.request<unknown>(
      "patch",
      `/friend-requests/${encodeURIComponent(requestId)}/reject`,
    );
    return result.success
      ? { success: true, data: mapFriendRequest(result.data) }
      : result;
  }

  async cancelRequest(
    requestId: string,
  ): Promise<ServiceResult<FriendRequest>> {
    const result = await this.request<unknown>(
      "delete",
      `/friend-requests/${encodeURIComponent(requestId)}`,
    );
    return result.success
      ? { success: true, data: mapFriendRequest(result.data) }
      : result;
  }

  async removeFriend(
    userId: string,
  ): Promise<ServiceResult<{ userId: string; friendId: string }>> {
    return this.request("delete", `/friends/${encodeURIComponent(userId)}`);
  }

  async getStatus(
    userId: string,
  ): Promise<ServiceResult<FriendshipStatusResponse>> {
    return this.request("get", `/friends/${encodeURIComponent(userId)}/status`);
  }
}

export const friendService = new FriendService();
