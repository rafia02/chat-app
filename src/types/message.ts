export type MessageStatus = "sending" | "sent" | "delivered" | "seen" | "failed";

export type MessageMediaType = "image" | "video" | "audio" | "file";

export interface MessageMedia {
  url: string;
  type: MessageMediaType;
  name?: string;
}

export interface MessageReaction {
  emoji: string;
  userId: string;
}

export interface ReplyTo {
  messageId: string;
  senderId: string;
  senderName: string;
  content: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  status: MessageStatus;
  reactions: MessageReaction[];
  replyTo?: ReplyTo;
  editedAt?: string;
  isDeleted?: boolean;
  tempId?: string;
  media?: MessageMedia;
}
