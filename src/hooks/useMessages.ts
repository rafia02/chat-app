"use client";

import { useEffect, useRef, useCallback } from "react";
import { useChatStore } from "@/stores";
import { useAuthStore } from "@/stores";
import { EMPTY_MESSAGES } from "@/lib/store-utils";

export function useMessages(conversationId: string | null) {
  const messages = useChatStore((s) =>
    conversationId
      ? (s.messages[conversationId] ?? EMPTY_MESSAGES)
      : EMPTY_MESSAGES
  );
  const isLoadingMessages = useChatStore((s) => s.isLoadingMessages);
  const isSending = useChatStore((s) => s.isSending);
  const error = useChatStore((s) => s.error);
  const replyTo = useChatStore((s) => s.replyTo);
  const fetchMessages = useChatStore((s) => s.fetchMessages);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const editMessage = useChatStore((s) => s.editMessage);
  const deleteMessage = useChatStore((s) => s.deleteMessage);
  const setReplyTo = useChatStore((s) => s.setReplyTo);
  const addReaction = useChatStore((s) => s.addReaction);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const user = useAuthStore((s) => s.user);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversationId) {
      setActiveConversation(conversationId);
    }
  }, [conversationId, setActiveConversation]);

  useEffect(() => {
    if (conversationId && messages.length === 0 && !isLoadingMessages) {
      const stored = useChatStore.getState().messages[conversationId];
      if (!stored) fetchMessages(conversationId);
    }
  }, [conversationId, messages.length, isLoadingMessages, fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = useCallback(
    async (content: string) => {
      await sendMessage(content);
    },
    [sendMessage]
  );

  const handleReaction = useCallback(
    (messageId: string, emoji: string) => {
      if (user) addReaction(messageId, emoji, user.id);
    },
    [addReaction, user]
  );

  const handleEdit = useCallback(
    (messageId: string, content: string) => {
      editMessage(messageId, content);
    },
    [editMessage]
  );

  const handleDelete = useCallback(
    (messageId: string) => {
      deleteMessage(messageId);
    },
    [deleteMessage]
  );

  return {
    messages,
    isLoading: isLoadingMessages,
    isSending,
    error,
    replyTo,
    bottomRef,
    sendMessage: handleSend,
    setReplyTo,
    addReaction: handleReaction,
    editMessage: handleEdit,
    deleteMessage: handleDelete,
    currentUserId: user?.id ?? "",
  };
}
