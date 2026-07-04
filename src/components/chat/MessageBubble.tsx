"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Check, CheckCheck } from "lucide-react";
import type { Message } from "@/types";
import { formatMessageTime } from "@/lib/date";
import MessageToolbar from "./MessageToolbar";
import ReplyPreview from "./ReplyPreview";
import ReactionBar from "./ReactionBar";

interface MessageBubbleProps {
  message: Message;
  own?: boolean;
  avatar?: string;
  sender?: string;
  onReact?: (emoji: string) => void;
  onReply?: () => void;
  onCopy?: () => void;
}

export default function MessageBubble({
  message,
  own = false,
  avatar,
  sender,
  onReact,
  onReply,
  onCopy,
}: MessageBubbleProps) {
  const [showToolbar, setShowToolbar] = useState(false);
  const [copied, setCopied] = useState(false);

  const reactions = message.reactions.map((r) => r.emoji);
  const uniqueReactions = [...new Set(reactions)];

  const handleCopy = () => {
    onCopy?.();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setShowToolbar(false);
  };

  const statusLabel =
    message.status === "seen"
      ? "Seen"
      : message.status === "delivered"
        ? "Delivered"
        : message.status === "sending"
          ? "Sending..."
          : message.status === "failed"
            ? "Failed"
            : "Sent";

  const isSeen = message.status === "seen";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      onMouseEnter={() => setShowToolbar(true)}
      onMouseLeave={() => setShowToolbar(false)}
      className={`group mb-5 md:mb-7 flex ${own ? "justify-end" : "justify-start"}`}
    >
      {!own && avatar && (
        <Image
          src={avatar}
          alt={sender || "avatar"}
          width={42}
          height={42}
          className="mr-2 md:mr-3 mt-auto rounded-full w-8 h-8 md:w-10 md:h-10 ring-2 ring-transparent transition group-hover:ring-indigo-500/30 object-cover"
        />
      )}

      <div className="relative max-w-[85%] md:max-w-[68%]">
        <MessageToolbar
          visible={showToolbar}
          own={own}
          onReply={onReply}
          onCopy={handleCopy}
          copied={copied}
        />

        <ReactionBar
          visible={showToolbar}
          own={own}
          onReact={(emoji) => {
            onReact?.(emoji);
            setShowToolbar(false);
          }}
        />

        {message.replyTo && (
          <ReplyPreview
            sender={message.replyTo.senderName}
            message={message.replyTo.content}
          />
        )}

        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.18 }}
          className={`relative overflow-hidden rounded-[20px] md:rounded-[26px] px-4 md:px-6 py-3 md:py-4 shadow-xl transition-all duration-300 ${
            own
              ? "rounded-br-md bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 text-white shadow-[0_20px_45px_rgba(79,70,229,.35)]"
              : "rounded-bl-md border border-[#26314A] bg-[#141D2F] text-white hover:border-indigo-500/30"
          }`}
        >
          {!own && sender && (
            <p className="mb-1 md:mb-2 text-xs md:text-sm font-semibold text-cyan-400">
              {sender}
            </p>
          )}

          <p className="whitespace-pre-wrap break-words text-sm md:text-[15px] leading-relaxed md:leading-7">
            {message.content}
          </p>
        </motion.div>

        {uniqueReactions.length > 0 && (
          <div className="mt-2 md:mt-3 flex flex-wrap gap-1.5 md:gap-2">
            {uniqueReactions.map((emoji, index) => (
              <motion.button
                key={index}
                layout
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.08 }}
                className="rounded-full border border-[#26314A] bg-[#101827] px-2.5 md:px-3 py-0.5 md:py-1 text-sm shadow-lg"
              >
                {emoji}
                {reactions.filter((r) => r === emoji).length > 1 && (
                  <span className="ml-1 text-xs text-slate-400">
                    {reactions.filter((r) => r === emoji).length}
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        )}

        <div
          className={`mt-1.5 md:mt-2 flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-slate-500 ${
            own ? "justify-end" : "justify-start"
          }`}
        >
          <span>{formatMessageTime(message.createdAt)}</span>

          {own && (
            <>
              {message.status === "sending" ? (
                <Check size={12} className="text-slate-500" />
              ) : (
                <CheckCheck
                  size={12}
                  className={isSeen ? "text-sky-400" : "text-slate-500"}
                />
              )}
              <span className={isSeen ? "text-sky-400" : "text-slate-500"}>
                {statusLabel}
              </span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
