"use client";

import { memo, useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Check, CheckCheck, X } from "lucide-react";
import type { Message } from "@/types";
import { formatMessageTime } from "@/lib/date";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks";
import { useLongPress } from "@/hooks/useLongPress";
import ReactionPicker from "./ReactionPicker";
import MessageContextMenu from "./MessageContextMenu";
import ReplyPreview from "./ReplyPreview";

interface MessageBubbleProps {
  message: Message;
  own?: boolean;
  avatar?: string;
  sender?: string;
  currentUserId?: string;
  onReact?: (emoji: string) => void;
  onReply?: () => void;
  onCopy?: () => void;
  onEdit?: (content: string) => void;
  onDelete?: () => void;
}

function MessageBubble({
  message,
  own = false,
  avatar,
  sender,
  currentUserId,
  onReact,
  onReply,
  onCopy,
  onEdit,
  onDelete,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const closeAll = useCallback(() => {
    setShowActions(false);
    setShowReactionPicker(false);
  }, []);

  const handleMouseEnter = () => {
    if (isMobile || message.isDeleted) return;
    hoverTimeoutRef.current = setTimeout(() => setShowActions(true), 200);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (!showReactionPicker) setShowActions(false);
  };

  const longPressHandlers = useLongPress({
    onLongPress: () => {
      if (!message.isDeleted) {
        setShowActions(true);
        setShowReactionPicker(true);
      }
    },
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeAll();
      }
    };
    if (showActions || showReactionPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showActions, showReactionPicker, closeAll]);

  const handleCopy = () => {
    onCopy?.();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    closeAll();
  };

  const handleReact = (emoji: string) => {
    onReact?.(emoji);
    closeAll();
  };

  const handleEditSave = () => {
    if (editText.trim() && editText !== message.content) {
      onEdit?.(editText.trim());
    }
    setIsEditing(false);
    closeAll();
  };

  const handleEditCancel = () => {
    setEditText(message.content);
    setIsEditing(false);
  };

  const reactionGroups = message.reactions.reduce<
    Record<string, { count: number; userIds: string[] }>
  >((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = { count: 0, userIds: [] };
    acc[r.emoji].count++;
    acc[r.emoji].userIds.push(r.userId);
    return acc;
  }, {});

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

  if (message.isDeleted) {
    return (
      <div className={`mb-5 md:mb-7 flex ${own ? "justify-end" : "justify-start"}`}>
        <div className="max-w-[85%] md:max-w-[68%] rounded-2xl border border-dashed border-[#26314A] bg-[#0f1520]/50 px-5 py-3">
          <p className="text-sm italic text-slate-500">This message was deleted</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      ref={containerRef}
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...(isMobile ? longPressHandlers : {})}
      className={cn(
        "group relative mb-5 md:mb-7 flex",
        own ? "justify-end" : "justify-start"
      )}
    >
      {!own && avatar && (
        <Image
          src={avatar}
          alt={sender || "avatar"}
          width={42}
          height={42}
          className="mr-2 md:mr-3 mt-auto rounded-full w-8 h-8 md:w-10 md:h-10 object-cover ring-2 ring-transparent transition-all duration-300 group-hover:ring-indigo-500/20"
        />
      )}

      <div className="relative max-w-[85%] md:max-w-[68%]">
        <ReactionPicker
          visible={showReactionPicker || (showActions && !isMobile)}
          own={own}
          onReact={handleReact}
        />

        <MessageContextMenu
          visible={showActions && !showReactionPicker}
          own={own}
          copied={copied}
          onReact={() => setShowReactionPicker(true)}
          onReply={() => { onReply?.(); closeAll(); }}
          onCopy={handleCopy}
          onEdit={own ? () => { setIsEditing(true); closeAll(); } : undefined}
          onDelete={own ? () => { onDelete?.(); closeAll(); } : undefined}
        />

        {message.replyTo && (
          <ReplyPreview
            sender={message.replyTo.senderName}
            message={message.replyTo.content}
          />
        )}

        <motion.div
          whileHover={!isMobile ? { y: -1 } : undefined}
          transition={{ duration: 0.15 }}
          className={cn(
            "relative overflow-hidden rounded-[20px] md:rounded-[22px] px-4 md:px-5 py-3 md:py-3.5 shadow-lg transition-all duration-200",
            own
              ? "rounded-br-sm bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 text-white shadow-indigo-500/20"
              : "rounded-bl-sm border border-[#26314A]/80 bg-[#141D2F] text-white hover:border-indigo-500/20",
            (showActions || showReactionPicker) && "ring-1 ring-white/10"
          )}
        >
          {!own && sender && (
            <p className="mb-1 text-xs md:text-sm font-semibold text-cyan-400/90">
              {sender}
            </p>
          )}

          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full resize-none bg-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-white/30"
                rows={2}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleEditCancel}
                  className="rounded-lg px-3 py-1 text-xs text-white/70 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSave}
                  className="rounded-lg bg-white/20 px-3 py-1 text-xs font-medium text-white hover:bg-white/30"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap break-words text-sm md:text-[15px] leading-relaxed">
              {message.content}
            </p>
          )}

          {message.editedAt && !isEditing && (
            <span className="mt-1 block text-[10px] text-white/40">edited</span>
          )}
        </motion.div>

        <AnimatePresence>
          {Object.keys(reactionGroups).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "absolute -bottom-3 flex flex-wrap gap-1",
                own ? "right-2" : "left-2"
              )}
            >
              {Object.entries(reactionGroups).map(([emoji, { count, userIds }]) => {
                const hasOwn = currentUserId && userIds.includes(currentUserId);
                return (
                  <motion.button
                    key={emoji}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onReact?.(emoji)}
                    className={cn(
                      "flex items-center gap-1 rounded-full border px-2 py-0.5 text-sm shadow-md backdrop-blur-sm transition-colors",
                      hasOwn
                        ? "border-indigo-500/50 bg-indigo-500/20"
                        : "border-[#26314A] bg-[#101827]/90 hover:bg-[#1a2540]"
                    )}
                  >
                    <span>{emoji}</span>
                    {count > 1 && (
                      <span className="text-[10px] text-slate-400">{count}</span>
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className={cn(
            "mt-2 md:mt-3 flex items-center gap-1.5 text-[10px] md:text-xs text-slate-500",
            own ? "justify-end" : "justify-start",
            Object.keys(reactionGroups).length > 0 && "mt-4"
          )}
        >
          <span>{formatMessageTime(message.createdAt)}</span>
          {own && (
            <>
              {message.status === "sending" ? (
                <Check size={12} className="text-slate-500 animate-pulse" />
              ) : (
                <CheckCheck
                  size={12}
                  className={cn("transition-colors", isSeen ? "text-sky-400" : "text-slate-500")}
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

export default memo(MessageBubble);
