import { socketClient } from "./socketClient";
import { SERVER_EVENTS } from "@/types";
import type {
  Message,
  MessageStatus,
  Conversation,
  TypingUpdatePayload,
  PresencePayload,
  NotificationPayload,
  CallSession,
} from "@/types";

export interface SocketEventHandlers {
  onMessageNew: (message: Message) => void;
  onMessageUpdated: (message: Message) => void;
  onMessageDeleted: (payload: { messageId: string; conversationId: string }) => void;
  onMessageStatus: (payload: { messageId: string; conversationId: string; status: MessageStatus }) => void;
  onMessageReaction: (message: Message) => void;
  onConversationUpdated: (conversation: Conversation) => void;
  onTypingUpdate: (payload: TypingUpdatePayload) => void;
  onPresenceUpdate: (payload: PresencePayload) => void;
  onOnlineUsers: (userIds: string[]) => void;
  onNotification: (payload: NotificationPayload) => void;
  onCallIncoming: (call: CallSession) => void;
  onCallAccepted: (payload: { callId: string; conversationId: string }) => void;
  onCallRejected: (payload: { callId: string }) => void;
  onCallEnded: (payload: { callId: string }) => void;
  onCallSignal: (payload: { callId: string; signal: RTCSessionDescriptionInit | RTCIceCandidateInit; fromUserId: string }) => void;
}

export function registerSocketListeners(handlers: SocketEventHandlers): () => void {
  const unsubs: (() => void)[] = [];

  unsubs.push(socketClient.on(SERVER_EVENTS.MESSAGE_NEW, handlers.onMessageNew));
  unsubs.push(socketClient.on(SERVER_EVENTS.MESSAGE_UPDATED, handlers.onMessageUpdated));
  unsubs.push(socketClient.on(SERVER_EVENTS.MESSAGE_DELETED, handlers.onMessageDeleted));
  unsubs.push(socketClient.on(SERVER_EVENTS.MESSAGE_STATUS, handlers.onMessageStatus));
  unsubs.push(socketClient.on(SERVER_EVENTS.MESSAGE_REACTION, handlers.onMessageReaction));
  unsubs.push(socketClient.on(SERVER_EVENTS.CONVERSATION_UPDATED, handlers.onConversationUpdated));
  unsubs.push(socketClient.on(SERVER_EVENTS.TYPING_UPDATE, handlers.onTypingUpdate));
  unsubs.push(socketClient.on(SERVER_EVENTS.PRESENCE_UPDATE, handlers.onPresenceUpdate));
  unsubs.push(socketClient.on(SERVER_EVENTS.ONLINE_USERS, handlers.onOnlineUsers));
  unsubs.push(socketClient.on(SERVER_EVENTS.NOTIFICATION_NEW, handlers.onNotification));
  unsubs.push(socketClient.on(SERVER_EVENTS.CALL_INCOMING, handlers.onCallIncoming));
  unsubs.push(socketClient.on(SERVER_EVENTS.CALL_ACCEPTED, handlers.onCallAccepted));
  unsubs.push(socketClient.on(SERVER_EVENTS.CALL_REJECTED, handlers.onCallRejected));
  unsubs.push(socketClient.on(SERVER_EVENTS.CALL_ENDED, handlers.onCallEnded));
  unsubs.push(socketClient.on(SERVER_EVENTS.CALL_SIGNAL, handlers.onCallSignal));

  return () => unsubs.forEach((unsub) => unsub());
}
