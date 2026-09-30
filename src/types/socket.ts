import type {
  Conversation,
  Message,
  MessageStatus,
  ReplyTo,
  UserStatus,
} from "./index";

export type CallType = "voice" | "video";
export type CallStatus =
  | "idle"
  | "ringing"
  | "connecting"
  | "connected"
  | "ended"
  | "missed"
  | "rejected";

export interface CallSession {
  id: string;
  type: CallType;
  status: CallStatus;
  callerId: string;
  calleeId: string;
  conversationId: string;
  callerName: string;
  callerAvatar: string;
  startedAt?: string;
}

export interface SocketAuthPayload {
  token: string;
}

export interface MessageSeenPayload {
  conversationId: string;
  messageIds: string[];
}

export interface CallStartPayload {
  conversationId: string;
  type: CallType;
}

export interface CallSignalPayload {
  conversationId: string;
  callId?: string;
  signal: RTCSessionDescriptionInit | RTCIceCandidateInit;
  targetUserId?: string;
  fromUserId?: string;
}

export interface MessageDeliveredPayload {
  messageId: string;
  conversationId: string;
}

export interface MessageSeenUpdatePayload {
  conversationId: string;
  messageIds: string[];
  userId: string;
}

export interface PresencePayload {
  userId: string;
  status?: UserStatus;
}

export interface TypingUpdatePayload {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export interface NotificationPayload {
  conversationId: string;
  message: Message;
  senderName: string;
}

export interface CallIncomingPayload {
  from: string;
  type: CallType;
  conversationId?: string;
}

export type SocketConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error";

// Client -> Server events (match nova-chat-backend)
export const CLIENT_EVENTS = {
  CONVERSATION_JOIN: "conversation:join",
  CONVERSATION_LEAVE: "conversation:leave",
  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",
  MESSAGE_SEEN: "message:seen",
  CALL_START: "call:start",
  CALL_ACCEPT: "call:accept",
  CALL_END: "call:end",
  CALL_SIGNAL: "call:signal",
} as const;

// Server -> Client events
export const SERVER_EVENTS = {
  FRIEND_REQUEST_NEW: "friend-request:new",
  FRIEND_REQUEST_ACCEPTED: "friend-request:accepted",
  FRIEND_REQUEST_REJECTED: "friend-request:rejected",
  FRIEND_REMOVED: "friend:removed",
  MESSAGE_REQUEST_NEW: "message-request:new",
  MESSAGE_REQUEST_ACCEPTED: "message-request:accepted",
  MESSAGE_REQUEST_REJECTED: "message-request:rejected",
  MESSAGE_NEW: "message:new",
  MESSAGE_UPDATED: "message:updated",
  MESSAGE_DELETED: "message:deleted",
  MESSAGE_REACTION: "message:reaction",
  MESSAGE_DELIVERED: "message:delivered",
  MESSAGE_SEEN: "message:seen",
  TYPING_UPDATE: "typing:update",
  USER_ONLINE: "user:online",
  USER_OFFLINE: "user:offline",
  CALL_INCOMING: "call:incoming",
  CALL_ACCEPTED: "call:accepted",
  CALL_ENDED: "call:ended",
  CALL_SIGNAL: "call:signal",
} as const;

export type ConversationUpdatedPayload = Conversation;
export type MessageStatusPayload = {
  messageId: string;
  conversationId: string;
  status: MessageStatus;
};

/** @deprecated kept for transitional typing — prefer MessageSeenPayload */
export type MessageReadPayload = MessageSeenPayload;
export type ReplyToPayload = ReplyTo;
