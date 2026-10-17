import type { User } from "./user";

export type ConversationType = "dm" | "group";

export type ConversationTab = "all" | "unread" | "groups" | "dm";

export interface Conversation {
  id: string;
  name: string;
  avatar: string;
  type: ConversationType;
  participantIds: string[];
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  isOnline?: boolean;
  typingUserIds?: string[];
  participants?: User[];
  adminIds?: string[];
  createdBy?: string | null;
  requestStatus?: "normal" | "pending" | "rejected";
  requestedBy?: string | null;
}
