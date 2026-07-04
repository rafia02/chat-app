"use client";

import { Copy, Reply, SmilePlus, MoreHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MessageToolbarProps {
  visible: boolean;
  own?: boolean;
  onReply?: () => void;
  onCopy?: () => void;
  copied?: boolean;
}

export default function MessageToolbar({
  visible,
  own = false,
  onReply,
  onCopy,
  copied = false,
}: MessageToolbarProps) {
  const actions = [
    { icon: <SmilePlus size={18} />, label: "React", onClick: undefined },
    { icon: <Reply size={18} />, label: "Reply", onClick: onReply },
    {
      icon: <Copy size={18} />,
      label: copied ? "Copied!" : "Copy",
      onClick: onCopy,
    },
    { icon: <MoreHorizontal size={18} />, label: "More", onClick: undefined },
  ];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.18 }}
          className={`absolute -top-12 md:-top-14 ${own ? "right-0" : "left-0"} z-50`}
        >
          <div className="flex items-center gap-1 rounded-2xl border border-slate-700/70 bg-[#0F172A]/95 p-1.5 shadow-2xl backdrop-blur-xl">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                title={action.label}
                className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-xl text-slate-300 transition-all duration-200 hover:bg-slate-800 hover:text-white"
              >
                {action.icon}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
