"use client";

import { useConversations } from "@/hooks";
import { LoadingState, ErrorState } from "@/components/ui";
import { formatConversationTime } from "@/lib/date";
import ConversationItem from "./ConversationItem";

export default function ConversationList() {
  const {
    conversations,
    isLoading,
    error,
    activeConversationId,
    selectConversation,
    refresh,
  } = useConversations();

  return (
    <div className="mt-4 md:mt-6 2xl:mt-8 flex-1 overflow-y-auto px-3 md:px-4 2xl:px-5 pb-5 min-h-0">
      <div className="mb-4 md:mb-5 flex items-center justify-between">
        <h4 className="text-xs md:text-sm font-semibold uppercase tracking-wider text-slate-500">
          Conversations
        </h4>

        <button
          className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-xl bg-[#151D31] text-lg text-white transition hover:bg-indigo-600"
          aria-label="New conversation"
        >
          +
        </button>
      </div>

      {isLoading && conversations.length === 0 ? (
        <LoadingState message="Loading conversations..." />
      ) : error && conversations.length === 0 ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : conversations.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-400">
          No conversations found
        </div>
      ) : (
        conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            active={conversation.id === activeConversationId}
            displayTime={formatConversationTime(conversation.lastMessageAt)}
            onClick={() => selectConversation(conversation.id)}
          />
        ))
      )}
    </div>
  );
}
