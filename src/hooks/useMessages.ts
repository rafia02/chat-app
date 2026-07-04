"use client";

import { useEffect, useRef, useCallback } from "react";
import { useChatStore } from "@/stores";
import { useAuthStore } from "@/stores";

export function useMessages(conversationId: string | null) {
  const {
    messages,
    isLoadingMessages,
    isSending,
    error,
    replyTo,
    fetchMessages,
    sendMessage,
    setReplyTo,
    addReaction,
    setActiveConversation,
  } = useChatStore();

  const user = useAuthStore((s) => s.user);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversationId) {
      setActiveConversation(conversationId);
    }
  }, [conversationId, setActiveConversation]);

  useEffect(() => {
    if (conversationId && !messages[conversationId] && !isLoadingMessages) {
      fetchMessages(conversationId);
    }
  }, [conversationId, messages, isLoadingMessages, fetchMessages]);

  const activeMessages = conversationId ? (messages[conversationId] ?? []) : [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages.length]);

  const handleSend = useCallback(
    async (content: string) => {
      await sendMessage(content);
    },
    [sendMessage]
  );

  const handleReply = useCallback(
    (reply: import("@/types").ReplyTo) => {
      setReplyTo(reply);
    },
    [setReplyTo]
  );

  const handleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (user) {
        await addReaction(messageId, emoji, user.id);
      }
    },
    [addReaction, user]
  );

  return {
    messages: activeMessages,
    isLoading: isLoadingMessages,
    isSending,
    error,
    replyTo,
    bottomRef,
    sendMessage: handleSend,
    setReplyTo,
    addReaction: handleReaction,
    currentUserId: user?.id ?? "",
  };
}
