"use client";

import { MessageCircleMore } from "lucide-react";
import { useConversations } from "@/hooks";

export default function EmptyChat() {
  const { conversations, selectConversation } = useConversations();

  const handleStart = () => {
    if (conversations.length > 0) {
      selectConversation(conversations[0].id);
    }
  };

  return (
    <div className="flex h-full flex-col items-center justify-center p-6">
      <div className="rounded-xl border border-[#1E293B] bg-gradient-to-br from-[#111827] to-[#151D31] px-6 py-8 shadow-xl shadow-black/40 max-w-md w-full">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-violet-600">
          <MessageCircleMore size={30} className="text-white" />
        </div>

        <h1 className="mt-5 text-center text-2xl md:text-3xl font-bold text-white">
          Welcome to Nova Chat
        </h1>

        <p className="mx-auto mt-4 max-w-md text-center text-sm md:text-base text-slate-400">
          Select a conversation from the sidebar and start messaging instantly
          with your friends.
        </p>

        {conversations.length > 0 && (
          <div className="mt-7 flex justify-center">
            <button
              onClick={handleStart}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 font-medium text-white transition-all hover:scale-105"
            >
              Start Conversation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
