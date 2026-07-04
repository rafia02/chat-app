"use client";

import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import ChatMessages from "./ChatMessages";
import EmptyChat from "./EmptyChat";
import { useChatStore } from "@/stores";

interface ChatAreaProps {
  conversationId?: string;
}

export default function ChatArea({ conversationId }: ChatAreaProps) {
  const activeConversation = useChatStore((s) =>
    conversationId
      ? s.conversations.find((c) => c.id === conversationId) ?? null
      : s.getActiveConversation()
  );

  const hasConversation = !!conversationId && !!activeConversation;

  return (
    <section className="flex flex-1 flex-col bg-[#0B1120] min-h-0">
      {hasConversation ? (
        <>
          <ChatHeader conversation={activeConversation} />
          <div className="flex-1 overflow-hidden min-h-0">
            <ChatMessages conversationId={conversationId!} />
          </div>
          <ChatInput conversationId={conversationId!} />
        </>
      ) : (
        <EmptyChat />
      )}
    </section>
  );
}
