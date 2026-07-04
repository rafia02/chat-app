"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Maximize2,
} from "lucide-react";
import { useCall } from "@/hooks";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function CallOverlay() {
  const {
    activeCall,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    callDuration,
    endCall,
    toggleMute,
    toggleVideo,
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (!activeCall) return null;

  const isVideo = activeCall.type === "video";
  const isConnected = activeCall.status === "connected";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      >
        <div className="relative h-full w-full max-w-4xl flex flex-col">
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            {isVideo && remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Image
                    src={activeCall.callerAvatar}
                    alt={activeCall.callerName}
                    width={120}
                    height={120}
                    className="rounded-full h-28 w-28 object-cover ring-4 ring-indigo-500/30"
                  />
                  {!isConnected && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-indigo-500"
                      animate={{ scale: [1, 1.15, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </div>
                <h2 className="text-2xl font-semibold text-white">
                  {activeCall.callerName}
                </h2>
                <p className="text-slate-400">
                  {isConnected
                    ? formatDuration(callDuration)
                    : activeCall.status === "ringing"
                      ? "Calling..."
                      : "Connecting..."}
                </p>
              </div>
            )}
          </div>

          {isVideo && localStream && (
            <div className="absolute top-6 right-6 h-36 w-28 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover [transform:scaleX(-1)]"
              />
            </div>
          )}

          <div className="shrink-0 flex items-center justify-center gap-4 pb-10 pt-6">
            <CallButton
              icon={isMuted ? <MicOff size={22} /> : <Mic size={22} />}
              label={isMuted ? "Unmute" : "Mute"}
              active={isMuted}
              onClick={toggleMute}
            />
            {isVideo && (
              <CallButton
                icon={isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
                label={isVideoOff ? "Camera on" : "Camera off"}
                active={isVideoOff}
                onClick={toggleVideo}
              />
            )}
            <CallButton
              icon={<PhoneOff size={22} />}
              label="End"
              danger
              onClick={endCall}
            />
            <CallButton
              icon={<Maximize2 size={20} />}
              label="Expand"
              onClick={() => {}}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function CallButton({
  icon,
  label,
  onClick,
  active,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex h-14 w-14 items-center justify-center rounded-full transition-all duration-200 ${
        danger
          ? "bg-red-500 hover:bg-red-600 text-white"
          : active
            ? "bg-white/20 text-white"
            : "bg-white/10 text-white hover:bg-white/20"
      }`}
    >
      {icon}
    </button>
  );
}
