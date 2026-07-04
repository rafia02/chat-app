"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useNotificationStore } from "@/stores";

export default function NotificationToast() {
  const notifications = useNotificationStore((s) => s.notifications);
  const clearNotification = useNotificationStore((s) => s.clearNotification);
  const router = useRouter();

  const latest = notifications.find((n) => !n.read);

  useEffect(() => {
    if (!latest) return;
    const timer = setTimeout(() => clearNotification(latest.id), 5000);
    return () => clearTimeout(timer);
  }, [latest, clearNotification]);

  const handleClick = () => {
    if (latest) {
      router.push(`/chat/${latest.conversationId}`);
      clearNotification(latest.id);
    }
  };

  return (
    <AnimatePresence>
      {latest && (
        <motion.button
          initial={{ opacity: 0, y: -20, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: -20, x: "-50%" }}
          onClick={handleClick}
          className="fixed top-4 left-1/2 z-[90] flex w-[calc(100%-2rem)] max-w-sm items-center gap-3 rounded-2xl border border-white/10 bg-[#1a2332]/95 px-4 py-3 shadow-2xl backdrop-blur-xl text-left transition hover:bg-[#1f2a3d]"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
            {latest.senderName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {latest.senderName}
            </p>
            <p className="truncate text-xs text-slate-400">{latest.content}</p>
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
