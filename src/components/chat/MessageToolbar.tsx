"use client";

import { Copy, Reply, SmilePlus, MoreHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MessageToolbarProps {
  visible: boolean;
  own?: boolean;
}

export default function MessageToolbar({
  visible,
  own = false,
}: MessageToolbarProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.18 }}
          className={`absolute -top-14 ${own ? "right-0" : "left-0"} z-50`}
        >
          <div className="flex items-center gap-1 rounded-2xl border border-slate-700/70 bg-[#0F172A]/95 p-1.5 shadow-2xl backdrop-blur-xl">
            {[
              <SmilePlus key="emoji" size={18} />,
              <Reply key="reply" size={18} />,
              <Copy key="copy" size={18} />,
              <MoreHorizontal key="more" size={18} />,
            ].map((icon, index) => (
              <button
                key={index}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-300 transition-all duration-200 hover:bg-slate-800 hover:text-white"
              >
                {icon}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
