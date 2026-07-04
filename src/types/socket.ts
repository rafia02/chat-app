import type { Conversation, Message, MessageStatus, ReplyTo, UserStatus } from "./index";

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
  userId: string;
  token: string;
}

export interface MessageSendPayload {
  conversationId: string;
  content: string;
  replyTo?: ReplyTo;
  tempId?: string;
}

export interface MessageEditPayload {
  messageId: string;
  conversationId: string;
  content: string;
}

export interface MessageDeletePayload {
  messageId: string;
  conversationId: string;
}

export interface MessageReactPayload {
  messageId: string;
  conversationId: string;
  emoji: string;
}

export interface MessageReadPayload {
  conversationId: string;
  messageIds: string[];
}

export interface TypingPayload {
  conversationId: string;
  isTyping: boolean;
}

export interface CallInitiatePayload {
  conversationId: string;
  calleeId: string;
  type: CallType;
}

export interface CallSignalPayload {
  callId: string;
  signal: RTCSessionDescriptionInit | RTCIceCandidateInit;
}

export interface MessageStatusPayload {
  messageId: string;
  conversationId: string;
  status: MessageStatus;
}

export interface PresencePayload {
  userId: string;
  status: UserStatus;
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

export type SocketConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error";

// Client -> Server events
export const CLIENT_EVENTS = {
  MESSAGE_SEND: "message:send",
  MESSAGE_EDIT: "message:edit",
  MESSAGE_DELETE: "message:delete",
  MESSAGE_REACT: "message:react",
  MESSAGE_READ: "message:read",
  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",
  CONVERSATION_JOIN: "conversation:join",
  CONVERSATION_LEAVE: "conversation:leave",
  CALL_INITIATE: "call:initiate",
  CALL_ACCEPT: "call:accept",
  CALL_REJECT: "call:reject",
  CALL_END: "call:end",
  CALL_SIGNAL: "call:signal",
  PRESENCE_UPDATE: "presence:update",
} as const;

// Server -> Client events
export const SERVER_EVENTS = {
  MESSAGE_NEW: "message:new",
  MESSAGE_UPDATED: "message:updated",
  MESSAGE_DELETED: "message:deleted",
  MESSAGE_STATUS: "message:status",
  MESSAGE_REACTION: "message:reaction",
  CONVERSATION_UPDATED: "conversation:updated",
  TYPING_UPDATE: "typing:update",
  PRESENCE_UPDATE: "presence:update",
  NOTIFICATION_NEW: "notification:new",
  CALL_INCOMING: "call:incoming",
  CALL_ACCEPTED: "call:accepted",
  CALL_REJECTED: "call:rejected",
  CALL_ENDED: "call:ended",
  CALL_SIGNAL: "call:signal",
  ONLINE_USERS: "presence:online-users",
} as const;

export type ConversationUpdatedPayload = Conversation;
