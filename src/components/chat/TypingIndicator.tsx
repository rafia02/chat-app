"use client";

import { motion } from "framer-motion";
import { getUserById } from "@/mocks/users";

interface TypingIndicatorProps {
  userIds: string[];
}

export default function TypingIndicator({ userIds }: TypingIndicatorProps) {
  if (userIds.length === 0) return null;

  const names = userIds
    .map((id) => getUserById(id)?.name?.split(" ")[0])
    .filter(Boolean);

  const text =
    names.length === 1
      ? `${names[0]} is typing`
      : names.length === 2
        ? `${names[0]} and ${names[1]} are typing`
        : "Several people are typing";

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className="flex items-center gap-2 px-1"
    >
      <div className="flex items-center gap-1 rounded-2xl bg-[#141D2F] border border-[#26314A]/50 px-4 py-2.5">
        <span className="text-xs text-slate-400 mr-1">{text}</span>
        <span className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-indigo-400"
              animate={{ y: [0, -4, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
        </span>
      </div>
    </motion.div>
  );
}
