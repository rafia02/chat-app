"use client";

import { useEffect } from "react";
import {
  useAuthStore,
  useChatStore,
  useSocketStore,
  useNotificationStore,
  useCallStore,
  useUsersStore,
  useSocialStore,
} from "@/stores";
import { socketClient, registerSocketListeners } from "@/services/socket";
import { getAuthSession } from "@/lib/storage";
import { avatarUrl } from "@/lib/mappers";
import { handleCallSignal, handleRemoteCallEnded } from "@/hooks/useCall";
import { SERVER_EVENTS } from "@/types";
import { mapFriendRequest } from "@/services/friend/friendService";

export function useSocket() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const setStatus = useSocketStore((s) => s.setStatus);

  useEffect(() => {
    return socketClient.onStatusChange(setStatus);
  }, [setStatus]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      socketClient.disconnect();
      return;
    }

    const session = getAuthSession();
    if (!session?.token) return;

    socketClient.connect(session.token);

    return () => socketClient.disconnect();
  }, [isAuthenticated, user?.id]);

  return {
    status: useSocketStore((s) => s.status),
    isConnected: socketClient.isConnected(),
  };
}

export function useChatSocket() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    const socialStore = useSocialStore.getState();
    if (isAuthenticated) {
      void socialStore.initialize();
    } else {
      socialStore.reset();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const unsub = registerSocketListeners({
      onMessageNew: (message) => {
        useChatStore.getState().handleIncomingMessage(message);
        useUsersStore.getState().ensureUser(message.senderId);

        const activeId = useChatStore.getState().activeConversationId;
        if (message.conversationId !== activeId) {
          const sender =
            useUsersStore.getState().getUser(message.senderId)?.name ??
            "Someone";
          useNotificationStore.getState().addNotification({
            conversationId: message.conversationId,
            message,
            senderName: sender,
          });
        }
      },
      onMessageUpdated: (message) => {
        useChatStore.getState().handleMessageUpdated(message);
      },
      onMessageDeleted: (payload) => {
        useChatStore.getState().handleMessageDeleted(payload);
      },
      onMessageReaction: (message) => {
        useChatStore.getState().handleMessageReaction(message);
      },
      onMessageDelivered: (payload) => {
        useChatStore.getState().handleMessageDelivered(payload);
      },
      onMessageSeen: (payload) => {
        useChatStore.getState().handleMessageSeen(payload);
      },
      onTypingUpdate: (payload) => {
        useChatStore
          .getState()
          .handleTypingUpdate(
            payload.conversationId,
            payload.userId,
            payload.isTyping,
          );
      },
      onUserOnline: (payload) => {
        useChatStore.getState().handleUserOnline(payload.userId);
        useUsersStore.getState().setUserStatus(payload.userId, "online");
        useSocialStore
          .getState()
          .handleFriendPresence(payload.userId, "online");
      },
      onUserOffline: (payload) => {
        useChatStore.getState().handleUserOffline(payload.userId);
        useUsersStore.getState().setUserStatus(payload.userId, "offline");
        useSocialStore
          .getState()
          .handleFriendPresence(payload.userId, "offline");
      },
      onCallIncoming: async (payload) => {
        const caller = await useUsersStore.getState().ensureUser(payload.from);
        const conversations = useChatStore.getState().conversations;
        const conversation =
          conversations.find(
            (c) => c.type === "dm" && c.participantIds.includes(payload.from),
          ) ?? conversations.find((c) => c.id === payload.conversationId);

        const name = caller?.name ?? "Unknown";
        useCallStore.getState().setIncomingCall({
          id: `call-${Date.now()}`,
          type: payload.type,
          status: "ringing",
          callerId: payload.from,
          calleeId: useAuthStore.getState().user?.id ?? "",
          conversationId: conversation?.id ?? payload.conversationId ?? "",
          callerName: name,
          callerAvatar: caller?.avatar ?? avatarUrl(name),
          startedAt: new Date().toISOString(),
        });
      },
      onCallAccepted: () => {
        const call =
          useCallStore.getState().activeCall ??
          useCallStore.getState().incomingCall;
        if (call) {
          useCallStore.getState().setActiveCall({
            ...call,
            status: "connecting",
          });
        }
        useCallStore.getState().setIncomingCall(null);
      },
      onCallEnded: handleRemoteCallEnded,
      onCallSignal: handleCallSignal,
    });

    const eventUnsubs = [
      socketClient.on(SERVER_EVENTS.FRIEND_REQUEST_NEW, () => {
        useSocialStore.getState().handleFriendRequestEvent();
      }),
      socketClient.on(SERVER_EVENTS.FRIEND_REQUEST_ACCEPTED, () => {
        useSocialStore.getState().handleFriendAccepted();
      }),
      socketClient.on(
        SERVER_EVENTS.FRIEND_REQUEST_REJECTED,
        (payload: unknown) => {
          useSocialStore
            .getState()
            .handleFriendRejected(mapFriendRequest(payload));
        },
      ),
      socketClient.on(
        SERVER_EVENTS.FRIEND_REMOVED,
        (payload: { userId: string; friendId: string }) => {
          const currentUserId = useAuthStore.getState().user?.id;
          const removedId =
            payload.friendId === currentUserId
              ? payload.userId
              : payload.friendId;
          useSocialStore.getState().handleFriendRemovedEvent(removedId);
        },
      ),
      socketClient.on(SERVER_EVENTS.MESSAGE_REQUEST_NEW, () => {
        useSocialStore.getState().handleMessageRequestEvent();
      }),
      socketClient.on(
        SERVER_EVENTS.MESSAGE_REQUEST_ACCEPTED,
        (payload: { _id?: string; id?: string }) => {
          useSocialStore
            .getState()
            .handleMessageRequestAccepted(
              String(payload._id ?? payload.id ?? ""),
            );
        },
      ),
      socketClient.on(
        SERVER_EVENTS.MESSAGE_REQUEST_REJECTED,
        (payload: { _id?: string; id?: string }) => {
          useSocialStore
            .getState()
            .handleMessageRequestRejected(
              String(payload._id ?? payload.id ?? ""),
            );
        },
      ),
    ];

    return () => {
      unsub();
      eventUnsubs.forEach((unsubscribe) => unsubscribe());
    };
  }, []);
}
