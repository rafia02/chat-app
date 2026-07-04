"use client";

import Image from "next/image";
import { Conversation } from "@/types";
import { motion } from "framer-motion";
import { useUIStore } from "@/stores";

interface Props {
  conversation: Conversation;
  active?: boolean;
  displayTime?: string;
  onClick?: () => void;
}

export default function ConversationItem({
  conversation,
  active = false,
  displayTime,
  onClick,
}: Props) {
  const openChat = useUIStore((s) => s.openChat);

  const handleClick = () => {
    onClick?.();
    openChat();
  };

  return (
    <motion.div
      transition={{ duration: 0.2 }}
      onClick={handleClick}
      className={`mb-3 md:mb-4 cursor-pointer rounded-lg border py-2.5 md:py-3 px-3 md:px-4 2xl:py-4 transition-all ${
        active
          ? "border-indigo-500 bg-gradient-to-r from-indigo-700/40 to-violet-700/20"
          : "border-transparent hover:border-[#29344E] hover:bg-[#151D31]"
      }`}
    >
      <div className="flex items-center gap-3 2xl:gap-4">
        <div className="relative shrink-0">
          <Image
            src={conversation.avatar}
            alt={conversation.name}
            width={56}
            height={56}
            className="rounded-full object-cover w-10 h-10 2xl:w-14 2xl:h-14"
          />

          {conversation.isOnline && (
            <span className="absolute bottom-0.5 right-0.5 h-3 w-3 md:h-3.5 md:w-3.5 rounded-full border-2 border-[#111827] bg-green-500" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-sm md:text-[15px] 2xl:text-base font-semibold text-white">
              {conversation.name}
            </h3>

            <span className="shrink-0 text-[10px] md:text-xs text-slate-400">
              {displayTime ?? conversation.lastMessageAt}
            </span>
          </div>

          <div className="mt-0.5 2xl:mt-2 flex items-center justify-between gap-2">
            <p className="truncate text-xs md:text-sm text-slate-400">
              {conversation.lastMessage}
            </p>

            {conversation.unreadCount > 0 && (
              <span className="shrink-0 flex h-5 w-5 2xl:h-7 2xl:w-7 items-center justify-center rounded-full bg-indigo-600 text-[10px] 2xl:text-xs font-bold text-white">
                {conversation.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
