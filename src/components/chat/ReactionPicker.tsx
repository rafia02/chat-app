"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "🎉", "👏"];

interface ReactionPickerProps {
  visible: boolean;
  own?: boolean;
  onReact: (emoji: string) => void;
  onClose?: () => void;
  className?: string;
}

function ReactionPicker({
  visible,
  own = false,
  onReact,
  className,
}: ReactionPickerProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: own ? 8 : 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 8 }}
          transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.8 }}
          className={cn(
            "absolute z-50 flex items-center gap-0.5 rounded-2xl border border-white/10 bg-[#1a2332]/95 px-1.5 py-1 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl",
            own ? "right-0 -top-12" : "left-0 -top-12",
            className
          )}
        >
          {QUICK_REACTIONS.map((emoji, i) => (
            <motion.button
              key={emoji}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.03, type: "spring", stiffness: 400, damping: 20 }}
              whileHover={{ scale: 1.35, y: -4 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onReact(emoji);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-xl transition-colors hover:bg-white/10"
            >
              {emoji}
            </motion.button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default memo(ReactionPicker);
