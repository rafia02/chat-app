"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Phone, PhoneOff, Video } from "lucide-react";
import { useCall } from "@/hooks";

export default function IncomingCallModal() {
  const { incomingCall, acceptCall, rejectCall } = useCall();

  if (!incomingCall) return null;

  const isVideo = incomingCall.type === "video";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="w-full max-w-sm rounded-3xl border border-white/10 bg-gradient-to-b from-[#1a2332] to-[#0f1520] p-8 shadow-2xl text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mx-auto mb-6"
          >
            <Image
              src={incomingCall.callerAvatar}
              alt={incomingCall.callerName}
              width={100}
              height={100}
              className="mx-auto rounded-full h-24 w-24 object-cover ring-4 ring-indigo-500/40"
            />
          </motion.div>

          <h2 className="text-xl font-semibold text-white">
            {incomingCall.callerName}
          </h2>
          <p className="mt-2 text-slate-400">
            Incoming {isVideo ? "video" : "voice"} call...
          </p>

          <div className="mt-8 flex items-center justify-center gap-6">
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={rejectCall}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 shadow-lg shadow-red-500/30"
            >
              <PhoneOff size={24} className="text-white" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={acceptCall}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 shadow-lg shadow-green-500/30"
            >
              {isVideo ? (
                <Video size={24} className="text-white" />
              ) : (
                <Phone size={24} className="text-white" />
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
