import type { Conversation, User } from "@/types";

export type FriendshipStatus = "none" | "sent" | "received" | "friends";

export interface FriendRequest {
  id: string;
  senderId: string;
  recipientId: string;
  sender?: User;
  recipient?: User;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  createdAt: string;
}

export interface MessageRequest {
  id: string;
  conversation: Conversation;
  requestedBy: string;
  createdAt: string;
}

export interface FriendshipStatusResponse {
  status: FriendshipStatus;
  areFriends: boolean;
}
