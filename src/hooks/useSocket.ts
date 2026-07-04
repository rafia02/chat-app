"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAuthStore, useChatStore, useSocketStore, useNotificationStore, useCallStore } from "@/stores";
import { socketClient, registerSocketListeners } from "@/services/socket";
import { getAuthSession } from "@/lib/storage";

export function useSocket() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const setStatus = useSocketStore((s) => s.setStatus);

  useEffect(() => {
    return socketClient.onStatusChange(setStatus);
  }, [setStatus]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      socketClient.disconnect();
      return;
    }

    const session = getAuthSession();
    socketClient.connect(user.id, session?.token ?? "mock-token");

    return () => socketClient.disconnect();
  }, [isAuthenticated, user?.id]);

  return {
    status: useSocketStore((s) => s.status),
    isConnected: socketClient.isConnected(),
  };
}

export function useChatSocket() {
  useEffect(() => {
    const unsub = registerSocketListeners({
      onMessageNew: (message) => {
        useChatStore.getState().handleIncomingMessage(message);
      },
      onMessageUpdated: (message) => {
        useChatStore.getState().handleMessageUpdated(message);
      },
      onMessageDeleted: (payload) => {
        useChatStore.getState().handleMessageDeleted(payload);
      },
      onMessageStatus: (payload) => {
        useChatStore.getState().handleMessageStatus(payload);
      },
      onMessageReaction: (message) => {
        useChatStore.getState().handleMessageReaction(message);
      },
      onConversationUpdated: (conversation) => {
        useChatStore.getState().handleConversationUpdated(conversation);
      },
      onTypingUpdate: (payload) => {
        useChatStore.getState().handleTypingUpdate(
          payload.conversationId,
          payload.userId,
          payload.isTyping
        );
      },
      onPresenceUpdate: (payload) => {
        useChatStore.getState().handlePresenceUpdate(payload.userId, payload.status);
      },
      onOnlineUsers: (userIds) => {
        useChatStore.getState().handleOnlineUsers(userIds);
      },
      onNotification: (payload) => {
        const activeId = useChatStore.getState().activeConversationId;
        if (payload.conversationId !== activeId) {
          useNotificationStore.getState().addNotification(payload);
        }
      },
      onCallIncoming: (call) => {
        useCallStore.getState().setIncomingCall(call);
      },
      onCallAccepted: (payload) => {
        const call = useCallStore.getState().activeCall ?? useCallStore.getState().incomingCall;
        if (call) {
          useCallStore.getState().setActiveCall({ ...call, status: "connected", id: payload.callId });
        }
        useCallStore.getState().setIncomingCall(null);
      },
      onCallRejected: () => useCallStore.getState().resetCall(),
      onCallEnded: () => useCallStore.getState().resetCall(),
      onCallSignal: () => {},
    });

    return unsub;
  }, []);
}
