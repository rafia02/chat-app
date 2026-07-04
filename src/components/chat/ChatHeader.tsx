"use client";

import Image from "next/image";
import { Phone, Video, Search, MoreVertical, ArrowLeft } from "lucide-react";
import type { Conversation } from "@/types";
import { useResponsiveLayout } from "@/hooks";

interface ChatHeaderProps {
  conversation: Conversation;
}

export default function ChatHeader({ conversation }: ChatHeaderProps) {
  const { isMobile, openSidebar } = useResponsiveLayout();

  const statusText = conversation.isOnline
    ? "Online"
    : conversation.type === "group"
      ? `${conversation.participantIds.length} members`
      : "Offline";

  const statusColor = conversation.isOnline ? "text-green-400" : "text-slate-400";

  return (
    <header className="flex h-[72px] md:h-[86px] 2xl:h-24 items-center justify-between border-b border-[#222C43] bg-[#111827] px-4 md:px-8 backdrop-blur-xl shrink-0">
      <div className="flex items-center gap-3 md:gap-4 min-w-0">
        {isMobile && (
          <button
            onClick={openSidebar}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#222C43] text-slate-300 transition hover:border-indigo-500 hover:text-white"
            aria-label="Back to conversations"
          >
            <ArrowLeft size={20} />
          </button>
        )}

        <div className="relative shrink-0">
          <Image
            src={conversation.avatar}
            alt={conversation.name}
            width={56}
            height={56}
            className="rounded-full h-10 w-10 md:h-12 md:w-12 2xl:h-14 2xl:w-14 object-cover"
          />
          {conversation.isOnline && (
            <span className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-[#0F172A] bg-green-500" />
          )}
        </div>

        <div className="min-w-0">
          <h2 className="truncate text-base md:text-lg 2xl:text-xl font-semibold text-white">
            {conversation.name}
          </h2>
          <p className={`text-xs 2xl:text-sm ${statusColor}`}>{statusText}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {[Phone, Video, Search, MoreVertical].map((Icon, index) => (
          <button
            key={index}
            className="flex h-9 w-9 md:h-10 md:w-10 2xl:h-12 2xl:w-12 items-center justify-center rounded-xl border border-[#222C43] bg-[#111827] text-slate-300 transition-all duration-300 hover:border-indigo-500 hover:bg-indigo-600 hover:text-white"
          >
            <Icon size={18} />
          </button>
        ))}
      </div>
    </header>
  );
}
