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
}
