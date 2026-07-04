"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import { useChatStore } from "@/stores";
import { socketEmitter } from "@/services/socket";
import { EMPTY_STRING_ARRAY } from "@/lib/store-utils";

export function useTypingIndicator(conversationId: string) {
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const stopTyping = useCallback(() => {
    if (isTypingRef.current) {
      socketEmitter.stopTyping({ conversationId, isTyping: false });
      isTypingRef.current = false;
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [conversationId]);

  const handleTyping = useCallback(() => {
    if (!isTypingRef.current) {
      socketEmitter.startTyping({ conversationId, isTyping: true });
      isTypingRef.current = true;
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(stopTyping, 2000);
  }, [conversationId, stopTyping]);

  useEffect(() => () => stopTyping(), [stopTyping]);

  return { handleTyping, stopTyping };
}

export function useTypingDisplay(conversationId: string, currentUserId: string) {
  const typingUsers = useChatStore(
    (s) => s.typingUsers[conversationId] ?? EMPTY_STRING_ARRAY
  );

  return useMemo(
    () => typingUsers.filter((id) => id !== currentUserId),
    [typingUsers, currentUserId]
  );
}
