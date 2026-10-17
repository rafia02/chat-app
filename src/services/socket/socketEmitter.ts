import { socketClient } from "./socketClient";
import { CLIENT_EVENTS } from "@/types";
import type {
  MessageSeenPayload,
  CallStartPayload,
  CallSignalPayload,
  CallAcknowledgement,
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
    return socketClient.emitWithAck<
      CallStartPayload,
      {
        success: boolean;
        data: { _id: string; conversationId: string; status: string } | null;
        message?: string;
      }
    >(CLIENT_EVENTS.CALL_INITIATE, payload);
  },

  acceptCall(callId: string) {
    return socketClient.emitWithAck<{ callId: string }, CallAcknowledgement>(
      CLIENT_EVENTS.CALL_ACCEPT,
      { callId },
    );
  },

  rejectCall(callId: string) {
    return socketClient.emitWithAck<{ callId: string }, CallAcknowledgement>(
      CLIENT_EVENTS.CALL_REJECT,
      { callId },
    );
  },

  endCall(callId: string) {
    return socketClient.emitWithAck<{ callId: string }, CallAcknowledgement>(
      CLIENT_EVENTS.CALL_END,
      { callId },
    );
  },

  sendCallSignal(payload: CallSignalPayload) {
    return socketClient.emitWithAck<CallSignalPayload, CallAcknowledgement>(
      CLIENT_EVENTS.CALL_SIGNAL,
      payload,
    );
  },
};
