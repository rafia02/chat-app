"use client";

import Image from "next/image";
import { Conversation } from "@/types/conversation";
import { motion } from "framer-motion";

interface Props {
  conversation: Conversation;
  active?: boolean;
}

export default function ConversationItem({
  conversation,
  active = false,
}: Props) {
  return (
    <motion.div
      // whileHover={{ x: 6 }}
      transition={{ duration: 0.2 }}
      className={`mb-4 cursor-pointer rounded-lg border py-3 px-4  2xl:py-4 transition-all ${
        active
          ? "border-indigo-500 bg-gradient-to-r from-indigo-700/40 to-violet-700/20"
          : "border-transparent hover:border-[#29344E] hover:bg-[#151D31]"
      }`}
    >
      <div className="flex items-center gap-3 2xl:gap-4">
        <div className="relative">
          <Image
            src={conversation.avatar}
            alt={conversation.name}
            width={56}
            height={56}
            className="rounded-full object-cover w-10 h-10 2xl:w-14 2xl:h-14"
          />

          {conversation.online && (
            <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-[#111827] bg-green-500" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="truncate text-base font-semibold text-white">
              {conversation.name}
            </h3>

            <span className="text-xs text-slate-400">{conversation.time}</span>
          </div>

          <div className="mt-0.5 2xl:mt-2 flex items-center justify-between">
            <p className="truncate text-sm text-slate-400">
              {conversation.lastMessage}
            </p>

            {conversation.unread > 0 && (
              <span className="ml-3 flex h-5 w-5 2xl:h-7 2xl:w-7 items-center justify-center rounded-full bg-indigo-600 text-[10px] 2xl:text-xs font-bold text-white">
                {conversation.unread}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
