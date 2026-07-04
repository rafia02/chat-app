"use client";

import { motion, AnimatePresence } from "framer-motion";

const emojis = ["👍", "❤️", "😂", "😮", "😢", "🔥", "🎉"];

interface ReactionBarProps {
  visible: boolean;
  onReact?: (emoji: string) => void;
}

export default function ReactionBar({ visible, onReact }: ReactionBarProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{
            opacity: 0,
            y: 10,
            scale: 0.95,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            y: 10,
            scale: 0.95,
          }}
          transition={{
            duration: 0.18,
          }}
          className="
            absolute
            -top-16
            left-0
            z-50
            flex
            items-center
            gap-2
            rounded-full
            border
            border-[#29344E]
            bg-[#111827]/95
            px-3
            py-2
            shadow-2xl
            backdrop-blur-xl
          "
        >
          {emojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onReact?.(emoji)}
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-full
                text-xl
                transition-all
                duration-200
                hover:scale-125
                hover:bg-[#1E293B]
              "
            >
              {emoji}
            </button>
          ))}

          <button
            className="
              ml-1
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              text-lg
              text-slate-400
              hover:bg-[#1E293B]
            "
          >
            +
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
