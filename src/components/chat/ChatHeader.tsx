"use client";

import Image from "next/image";
import { Phone, Video, Search, MoreVertical, ArrowLeft } from "lucide-react";
import type { Conversation } from "@/types";
import { useResponsiveLayout, useCall, useTypingDisplay } from "@/hooks";
import { useAuthStore } from "@/stores";
import { getUserById } from "@/mocks/users";

interface ChatHeaderProps {
  conversation: Conversation;
}

export default function ChatHeader({ conversation }: ChatHeaderProps) {
  const { isMobile, openSidebar } = useResponsiveLayout();
  const { startCall } = useCall();
  const currentUserId = useAuthStore((s) => s.user?.id ?? "");
  const typingUserIds = useTypingDisplay(conversation.id, currentUserId);

  const otherParticipantId = conversation.participantIds.find(
    (id) => id !== currentUserId,
  );

  const typingNames = typingUserIds
    .map((id) => getUserById(id)?.name?.split(" ")[0])
    .filter(Boolean);

  const statusText =
    typingNames.length > 0
      ? typingNames.length === 1
        ? `${typingNames[0]} is typing...`
        : "Several people are typing..."
      : conversation.isOnline
        ? "Online"
        : conversation.type === "group"
          ? `${conversation.participantIds.length} members`
          : "Offline";

  const statusColor =
    typingNames.length > 0
      ? "text-indigo-400"
      : conversation.isOnline
        ? "text-green-400"
        : "text-slate-400";

  const handleVoiceCall = () => {
    if (otherParticipantId) {
      startCall(conversation.id, otherParticipantId, "voice");
    }
  };

  const handleVideoCall = () => {
    if (otherParticipantId) {
      startCall(conversation.id, otherParticipantId, "video");
    }
  };

  return (
    <header className="flex h-[72px] md:h-[86px] 2xl:h-24 items-center justify-between border-b border-[#222C43] bg-[#111827] px-4 2xl:px-8 backdrop-blur-xl shrink-0">
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
          <p
            className={`text-xs 2xl:text-sm truncate transition-colors ${statusColor}`}
          >
            {statusText}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        <button
          onClick={handleVoiceCall}
          className="flex h-9 w-9 md:h-10 md:w-10 2xl:h-12 2xl:w-12 items-center justify-center rounded-xl border border-[#222C43] bg-[#111827] text-slate-300 transition-all duration-300 hover:border-indigo-500 hover:bg-indigo-600 hover:text-white"
          aria-label="Voice call"
        >
          <Phone size={18} />
        </button>
        <button
          onClick={handleVideoCall}
          className="flex h-9 w-9 md:h-10 md:w-10 2xl:h-12 2xl:w-12 items-center justify-center rounded-xl border border-[#222C43] bg-[#111827] text-slate-300 transition-all duration-300 hover:border-indigo-500 hover:bg-indigo-600 hover:text-white"
          aria-label="Video call"
        >
          <Video size={18} />
        </button>
        {[Search, MoreVertical].map((Icon, index) => (
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
