"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Reply,
  Copy,
  Pencil,
  Trash2,
  SmilePlus,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageContextMenuProps {
  visible: boolean;
  own?: boolean;
  copied?: boolean;
  onReact: () => void;
  onReply?: () => void;
  onCopy?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

function MessageContextMenu({
  visible,
  own = false,
  copied = false,
  onReact,
  onReply,
  onCopy,
  onEdit,
  onDelete,
}: MessageContextMenuProps) {
  const actions = [
    {
      icon: <SmilePlus size={16} />,
      label: "React",
      onClick: onReact,
      show: true,
    },
    {
      icon: <Reply size={16} />,
      label: "Reply",
      onClick: onReply,
      show: !!onReply,
    },
    {
      icon: <Copy size={16} />,
      label: copied ? "Copied!" : "Copy",
      onClick: onCopy,
      show: !!onCopy,
    },
    {
      icon: <Pencil size={16} />,
      label: "Edit",
      onClick: onEdit,
      show: own && !!onEdit,
    },
    {
      icon: <Trash2 size={16} />,
      label: "Delete",
      onClick: onDelete,
      show: own && !!onDelete,
      danger: true,
    },
  ].filter((a) => a.show);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, x: own ? 8 : -8 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.9, x: own ? 8 : -8 }}
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
          className={cn(
            "absolute z-40 top-1/2 -translate-y-1/2",
            own ? "-left-2 -translate-x-full" : "-right-2 translate-x-full"
          )}
        >
          <div className="flex items-center gap-0.5 rounded-xl border border-white/10 bg-[#1a2332]/95 p-1 shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            {actions.slice(0, 4).map((action, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.92 }}
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick?.();
                }}
                title={action.label}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-white/10 hover:text-white",
                  action.danger && "hover:text-red-400 hover:bg-red-500/10"
                )}
              >
                {action.icon}
              </motion.button>
            ))}

            {actions.length > 4 && (
              <div className="relative group/more">
                <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white">
                  <MoreHorizontal size={16} />
                </button>
                <div className="invisible group-hover/more:visible absolute top-full mt-1 right-0 min-w-[140px] rounded-xl border border-white/10 bg-[#1a2332]/95 py-1 shadow-xl backdrop-blur-xl">
                  {actions.slice(4).map((action, i) => (
                    <button
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        action.onClick?.();
                      }}
                      className={cn(
                        "flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white",
                        action.danger && "text-red-400 hover:bg-red-500/10"
                      )}
                    >
                      {action.icon}
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default memo(MessageContextMenu);
