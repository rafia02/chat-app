import { socketClient } from "./socketClient";
import { CLIENT_EVENTS } from "@/types";
import type {
  MessageSeenPayload,
  CallStartPayload,
  CallSignalPayload,
} from "@/types";

export const socketEmitter = {
  markMessagesSeen(payload: MessageSeenPayload) {
    socketClient.emit(CLIENT_EVENTS.MESSAGE_SEEN, payload);
  },

  startTyping(conversationId: string) {
    socketClient.emit(CLIENT_EVENTS.TYPING_START, conversationId);
  },

  stopTyping(conversationId: string) {
    socketClient.emit(CLIENT_EVENTS.TYPING_STOP, conversationId);
  },

  joinConversation(conversationId: string) {
    socketClient.joinConversation(conversationId);
  },

  leaveConversation(conversationId: string) {
    socketClient.leaveConversation(conversationId);
  },

  startCall(payload: CallStartPayload) {
    socketClient.emit(CLIENT_EVENTS.CALL_START, payload);
  },

  acceptCall(conversationId: string) {
    socketClient.emit(CLIENT_EVENTS.CALL_ACCEPT, { conversationId });
  },

  endCall(conversationId: string) {
    socketClient.emit(CLIENT_EVENTS.CALL_END, { conversationId });
  },

  sendCallSignal(payload: CallSignalPayload) {
    socketClient.emit(CLIENT_EVENTS.CALL_SIGNAL, payload);
  },
};
