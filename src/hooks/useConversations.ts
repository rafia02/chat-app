"use client";

import { useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useChatStore } from "@/stores";

export function useConversations() {
  const store = useChatStore();
  const router = useRouter();
  const params = useParams();
  const conversationIdFromUrl = params?.conversationId as string | undefined;

  useEffect(() => {
    if (store.conversations.length === 0 && !store.isLoadingConversations) {
      store.fetchConversations();
    }
  }, [store.conversations.length, store.isLoadingConversations, store.fetchConversations]);

  useEffect(() => {
    if (conversationIdFromUrl && conversationIdFromUrl !== store.activeConversationId) {
      store.setActiveConversation(conversationIdFromUrl);
    }
  }, [conversationIdFromUrl, store.activeConversationId, store.setActiveConversation]);

  const selectConversation = useCallback(
    (id: string) => {
      store.setActiveConversation(id);
      router.push(`/chat/${id}`);
    },
    [store, router]
  );

  return {
    conversations: store.conversations,
    isLoading: store.isLoadingConversations,
    error: store.error,
    searchQuery: store.searchQuery,
    activeTab: store.activeTab,
    activeConversationId: store.activeConversationId ?? conversationIdFromUrl ?? null,
    setSearchQuery: store.setSearchQuery,
    setActiveTab: store.setActiveTab,
    selectConversation,
    refresh: store.fetchConversations,
  };
}
