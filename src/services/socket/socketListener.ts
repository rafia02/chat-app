import { socketClient } from "./socketClient";
import { SERVER_EVENTS } from "@/types";
import type {
  Message,
  TypingUpdatePayload,
  PresencePayload,
  MessageDeliveredPayload,
  MessageSeenUpdatePayload,
  CallIncomingPayload,
  CallSignalPayload,
} from "@/types";
import { mapMessage } from "@/lib/mappers";

export interface SocketEventHandlers {
  onMessageNew: (message: Message) => void;
  onMessageUpdated: (message: Message) => void;
  onMessageDeleted: (payload: { messageId: string; conversationId: string }) => void;
  onMessageReaction: (message: Message) => void;
  onMessageDelivered: (payload: MessageDeliveredPayload) => void;
  onMessageSeen: (payload: MessageSeenUpdatePayload) => void;
  onTypingUpdate: (payload: TypingUpdatePayload) => void;
  onUserOnline: (payload: PresencePayload) => void;
  onUserOffline: (payload: PresencePayload) => void;
  onCallIncoming: (payload: CallIncomingPayload) => void;
  onCallAccepted: (payload: { userId: string }) => void;
  onCallEnded: (payload: { userId: string }) => void;
  onCallSignal: (payload: CallSignalPayload) => void;
}

function asMessage(data: unknown): Message {
  return mapMessage(data);
}

export function registerSocketListeners(handlers: SocketEventHandlers): () => void {
  const unsubs: (() => void)[] = [];

  unsubs.push(
    socketClient.on(SERVER_EVENTS.MESSAGE_NEW, (data: unknown) => {
      handlers.onMessageNew(asMessage(data));
    })
  );
  unsubs.push(
    socketClient.on(SERVER_EVENTS.MESSAGE_UPDATED, (data: unknown) => {
      handlers.onMessageUpdated(asMessage(data));
    })
  );
  unsubs.push(
    socketClient.on(
      SERVER_EVENTS.MESSAGE_DELETED,
      (payload: { messageId: string; conversationId: string }) => {
        handlers.onMessageDeleted({
          messageId: String(payload.messageId),
          conversationId: String(payload.conversationId),
        });
      }
    )
  );
  unsubs.push(
    socketClient.on(SERVER_EVENTS.MESSAGE_REACTION, (data: unknown) => {
      handlers.onMessageReaction(asMessage(data));
    })
  );
  unsubs.push(
    socketClient.on(
      SERVER_EVENTS.MESSAGE_DELIVERED,
      (payload: MessageDeliveredPayload) => {
        handlers.onMessageDelivered({
          messageId: String(payload.messageId),
          conversationId: String(payload.conversationId),
        });
      }
    )
  );
  unsubs.push(
    socketClient.on(
      SERVER_EVENTS.MESSAGE_SEEN,
      (payload: MessageSeenUpdatePayload) => {
        handlers.onMessageSeen({
          conversationId: String(payload.conversationId),
          messageIds: (payload.messageIds ?? []).map(String),
          userId: String(payload.userId),
        });
      }
    )
  );
  unsubs.push(
    socketClient.on(SERVER_EVENTS.TYPING_UPDATE, handlers.onTypingUpdate)
  );
  unsubs.push(
    socketClient.on(SERVER_EVENTS.USER_ONLINE, (payload: { userId: string }) => {
      handlers.onUserOnline({ userId: String(payload.userId), status: "online" });
    })
  );
  unsubs.push(
    socketClient.on(SERVER_EVENTS.USER_OFFLINE, (payload: { userId: string }) => {
      handlers.onUserOffline({ userId: String(payload.userId), status: "offline" });
    })
  );
  unsubs.push(
    socketClient.on(SERVER_EVENTS.CALL_INCOMING, handlers.onCallIncoming)
  );
  unsubs.push(
    socketClient.on(SERVER_EVENTS.CALL_ACCEPTED, handlers.onCallAccepted)
  );
  unsubs.push(
    socketClient.on(SERVER_EVENTS.CALL_ENDED, handlers.onCallEnded)
  );
  unsubs.push(
    socketClient.on(SERVER_EVENTS.CALL_SIGNAL, handlers.onCallSignal)
  );

  return () => unsubs.forEach((unsub) => unsub());
}
