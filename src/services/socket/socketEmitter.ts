import { socketClient } from "./socketClient";
import { CLIENT_EVENTS } from "@/types";
import type {
  MessageSendPayload,
  MessageEditPayload,
  MessageDeletePayload,
  MessageReactPayload,
  MessageReadPayload,
  TypingPayload,
  CallInitiatePayload,
  CallSignalPayload,
  UserStatus,
} from "@/types";

export const socketEmitter = {
  sendMessage(payload: MessageSendPayload) {
    socketClient.emit(CLIENT_EVENTS.MESSAGE_SEND, payload);
  },

  editMessage(payload: MessageEditPayload) {
    socketClient.emit(CLIENT_EVENTS.MESSAGE_EDIT, payload);
  },

  deleteMessage(payload: MessageDeletePayload) {
    socketClient.emit(CLIENT_EVENTS.MESSAGE_DELETE, payload);
  },

  reactToMessage(payload: MessageReactPayload) {
    socketClient.emit(CLIENT_EVENTS.MESSAGE_REACT, payload);
  },

  markMessagesRead(payload: MessageReadPayload) {
    socketClient.emit(CLIENT_EVENTS.MESSAGE_READ, payload);
  },

  startTyping(payload: TypingPayload) {
    socketClient.emit(CLIENT_EVENTS.TYPING_START, payload);
  },

  stopTyping(payload: TypingPayload) {
    socketClient.emit(CLIENT_EVENTS.TYPING_STOP, payload);
  },

  joinConversation(conversationId: string) {
    socketClient.joinConversation(conversationId);
  },

  leaveConversation(conversationId: string) {
    socketClient.leaveConversation(conversationId);
  },

  initiateCall(payload: CallInitiatePayload) {
    socketClient.emit(CLIENT_EVENTS.CALL_INITIATE, payload);
  },

  acceptCall(callId: string) {
    socketClient.emit(CLIENT_EVENTS.CALL_ACCEPT, { callId });
  },

  rejectCall(callId: string) {
    socketClient.emit(CLIENT_EVENTS.CALL_REJECT, { callId });
  },

  endCall(callId: string) {
    socketClient.emit(CLIENT_EVENTS.CALL_END, { callId });
  },

  sendCallSignal(payload: CallSignalPayload & { targetUserId: string }) {
    socketClient.emit(CLIENT_EVENTS.CALL_SIGNAL, payload);
  },

  updatePresence(status: UserStatus) {
    socketClient.emit(CLIENT_EVENTS.PRESENCE_UPDATE, { status });
  },
};
