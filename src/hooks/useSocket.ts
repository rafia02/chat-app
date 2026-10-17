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
import {
  socketClient,
  socketEmitter,
  registerSocketListeners,
} from "@/services/socket";
import { getAuthSession } from "@/lib/storage";
import {
  avatarUrl,
  extractParticipantUsers,
  mapConversation,
} from "@/lib/mappers";
import {
  handleCallBusy,
  handleCallRejected,
  handleCallSignal,
  handleCallSocketUnavailable,
  handleRemoteCallEnded,
} from "@/hooks/useCall";
import { SERVER_EVENTS } from "@/types";
import { mapFriendRequest } from "@/services/friend/friendService";

export function useSocket() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const setStatus = useSocketStore((s) => s.setStatus);
  const status = useSocketStore((s) => s.status);

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

  useEffect(() => {
    if (status !== "connected") {
      if (
        status === "reconnecting" ||
        status === "error" ||
        status === "disconnected"
      ) {
        handleCallSocketUnavailable();
      }
      return;
    }
    const conversationId = useChatStore.getState().activeConversationId;
    if (conversationId) socketEmitter.joinConversation(conversationId);
  }, [status]);

  return {
    status,
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
        const callerId = payload.callerId || payload.from;
        const caller = await useUsersStore.getState().ensureUser(callerId);
        const conversations = useChatStore.getState().conversations;
        const conversation =
          conversations.find(
            (c) => c.type === "dm" && c.participantIds.includes(callerId),
          ) ?? conversations.find((c) => c.id === payload.conversationId);

        const name = caller?.name ?? "Unknown";
        useCallStore.getState().setIncomingCall({
          id: payload.callId,
          type: payload.type === "video" ? "video" : "voice",
          status: "ringing",
          callerId,
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
      onCallRejected: handleCallRejected,
      onCallEnded: handleRemoteCallEnded,
      onCallBusy: handleCallBusy,
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
      socketClient.on(SERVER_EVENTS.GROUP_CREATED, (payload: unknown) => {
        useUsersStore.getState().upsertUsers(extractParticipantUsers(payload));
        const conversation = mapConversation(
          payload,
          useAuthStore.getState().user?.id,
        );
        useChatStore.getState().handleConversationUpdated(conversation);
        if (conversation.id) {
          void useChatStore.getState().refreshConversation(conversation.id);
        }
      }),
      socketClient.on(
        SERVER_EVENTS.GROUP_UPDATED,
        (payload: { _id?: string; id?: string }) => {
          const id = String(payload._id ?? payload.id ?? "");
          if (id) void useChatStore.getState().refreshConversation(id);
        },
      ),
      socketClient.on(
        SERVER_EVENTS.GROUP_MEMBER_ADDED,
        (payload: { conversation?: { _id?: string; id?: string } }) => {
          const id = String(
            payload.conversation?._id ?? payload.conversation?.id ?? "",
          );
          if (id) void useChatStore.getState().refreshConversation(id);
        },
      ),
      socketClient.on(
        SERVER_EVENTS.GROUP_MEMBER_REMOVED,
        (payload: {
          conversation?: { _id?: string; id?: string };
          memberId?: string;
        }) => {
          const currentUserId = useAuthStore.getState().user?.id;
          const id = String(
            payload.conversation?._id ?? payload.conversation?.id ?? "",
          );
          if (id && payload.memberId === currentUserId) {
            useChatStore.getState().removeConversation(id);
          } else if (id) {
            void useChatStore.getState().refreshConversation(id);
          }
        },
      ),
    ];

    return () => {
      unsub();
      eventUnsubs.forEach((unsubscribe) => unsubscribe());
    };
  }, []);
}
