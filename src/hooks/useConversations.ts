"use client";

import { useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useChatStore } from "@/stores";

export function useConversations() {
  const conversations = useChatStore((s) => s.conversations);
  const isLoading = useChatStore((s) => s.isLoadingConversations);
  const error = useChatStore((s) => s.error);
  const searchQuery = useChatStore((s) => s.searchQuery);
  const activeTab = useChatStore((s) => s.activeTab);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const fetchConversations = useChatStore((s) => s.fetchConversations);
  const setSearchQuery = useChatStore((s) => s.setSearchQuery);
  const setActiveTab = useChatStore((s) => s.setActiveTab);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);

  const router = useRouter();
  const params = useParams();
  const conversationIdFromUrl = params?.conversationId as string | undefined;

  useEffect(() => {
    if (conversations.length === 0 && !isLoading) {
      fetchConversations();
    }
  }, [conversations.length, isLoading, fetchConversations]);

  useEffect(() => {
    if (conversationIdFromUrl && conversationIdFromUrl !== activeConversationId) {
      setActiveConversation(conversationIdFromUrl);
    }
  }, [conversationIdFromUrl, activeConversationId, setActiveConversation]);

  const selectConversation = useCallback(
    (id: string) => {
      setActiveConversation(id);
      router.push(`/chat/${id}`);
    },
    [setActiveConversation, router]
  );

  return {
    conversations,
    isLoading,
    error,
    searchQuery,
    activeTab,
    activeConversationId: activeConversationId ?? conversationIdFromUrl ?? null,
    setSearchQuery,
    setActiveTab,
    selectConversation,
    refresh: fetchConversations,
  };
}
