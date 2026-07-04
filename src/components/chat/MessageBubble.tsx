"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { CheckCheck } from "lucide-react";

import MessageToolbar from "./MessageToolbar";
import ReplyPreview from "./ReplyPreview";
import ReactionBar from "./ReactionBar";

interface MessageBubbleProps {
  own?: boolean;

  avatar?: string;

  sender?: string;

  message: string;

  time: string;

  seen?: boolean;

  reactions?: string[];

  replyTo?: {
    sender: string;
    message: string;
  };
}

export default function MessageBubble({
  own = false,
  avatar,
  sender,
  message,
  time,
  seen = false,
  reactions = [],
  replyTo,
}: MessageBubbleProps) {
  const [showToolbar, setShowToolbar] = useState(false);

  const [messageReactions, setMessageReactions] = useState<string[]>(reactions);

  const handleReaction = (emoji: string) => {
    if (!messageReactions.includes(emoji)) {
      setMessageReactions((prev) => [...prev, emoji]);
    }

    setShowToolbar(false);
  };

  return (
    <motion.div
      layout
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.25,
      }}
      onMouseEnter={() => setShowToolbar(true)}
      onMouseLeave={() => setShowToolbar(false)}
      className={`group mb-7 flex ${own ? "justify-end" : "justify-start"}`}
    >
      {!own && avatar && (
        <Image
          src={avatar}
          alt={sender || "avatar"}
          width={42}
          height={42}
          className="mr-3 mt-auto rounded-full ring-2 ring-transparent transition group-hover:ring-indigo-500/30"
        />
      )}

      <div className="relative max-w-[68%]">
        {/* Hover Toolbar */}

        <MessageToolbar visible={showToolbar} own={own} />

        {/* Emoji Picker */}

        <ReactionBar visible={showToolbar} onReact={handleReaction} />

        {/* Reply */}

        {replyTo && (
          <ReplyPreview sender={replyTo.sender} message={replyTo.message} />
        )}

        {/* Bubble */}

        <motion.div
          whileHover={{
            y: -2,
          }}
          transition={{
            duration: 0.18,
          }}
          className={`relative overflow-hidden rounded-[26px] px-6 py-4 shadow-xl transition-all duration-300

          ${
            own
              ? `
              rounded-br-md
              bg-gradient-to-br
              from-indigo-600
              via-indigo-500
              to-violet-600
              text-white
              shadow-[0_20px_45px_rgba(79,70,229,.35)]
              `
              : `
              rounded-bl-md
              border
              border-[#26314A]
              bg-[#141D2F]
              text-white
              hover:border-indigo-500/30
              `
          }`}
        >
          {!own && sender && (
            <p className="mb-2 text-sm font-semibold text-cyan-400">{sender}</p>
          )}

          <p className="whitespace-pre-wrap break-words text-[15px] leading-7">
            {message}
          </p>
        </motion.div>

        {/* Emoji Reactions */}

        {messageReactions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {messageReactions.map((emoji, index) => (
              <motion.button
                key={index}
                layout
                initial={{
                  scale: 0,
                  opacity: 0,
                }}
                animate={{
                  scale: 1,
                  opacity: 1,
                }}
                whileHover={{
                  scale: 1.08,
                }}
                className="
                  rounded-full
                  border
                  border-[#26314A]
                  bg-[#101827]
                  px-3
                  py-1
                  text-sm
                  shadow-lg
                "
              >
                {emoji}
              </motion.button>
            ))}
          </div>
        )}

        {/* Footer */}

        <div
          className={`mt-2 flex items-center gap-2 text-xs text-slate-500

          ${own ? "justify-end" : "justify-start"}
        `}
        >
          <span>{time}</span>

          {own && (
            <>
              <CheckCheck
                size={14}
                className={seen ? "text-sky-400" : "text-slate-500"}
              />

              <span className={seen ? "text-sky-400" : "text-slate-500"}>
                {seen ? "Seen" : "Delivered"}
              </span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
