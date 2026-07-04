import { create } from "zustand";
import type { CallSession, CallType } from "@/types";

interface CallState {
  activeCall: CallSession | null;
  incomingCall: CallSession | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  callDuration: number;

  setIncomingCall: (call: CallSession | null) => void;
  setActiveCall: (call: CallSession | null) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  setCallDuration: (duration: number) => void;
  resetCall: () => void;
  initiateCall: (params: {
    conversationId: string;
    calleeId: string;
    type: CallType;
    callerName: string;
    callerAvatar: string;
    callerId: string;
  }) => CallSession;
}

export const useCallStore = create<CallState>((set, get) => ({
  activeCall: null,
  incomingCall: null,
  localStream: null,
  remoteStream: null,
  isMuted: false,
  isVideoOff: false,
  callDuration: 0,

  setIncomingCall: (call) => set({ incomingCall: call }),

  setActiveCall: (call) => set({ activeCall: call }),

  setLocalStream: (stream) => set({ localStream: stream }),

  setRemoteStream: (stream) => set({ remoteStream: stream }),

  toggleMute: () => {
    const { localStream, isMuted } = get();
    localStream?.getAudioTracks().forEach((t) => (t.enabled = isMuted));
    set({ isMuted: !isMuted });
  },

  toggleVideo: () => {
    const { localStream, isVideoOff } = get();
    localStream?.getVideoTracks().forEach((t) => (t.enabled = isVideoOff));
    set({ isVideoOff: !isVideoOff });
  },

  setCallDuration: (duration) => set({ callDuration: duration }),

  resetCall: () => {
    const { localStream, remoteStream } = get();
    localStream?.getTracks().forEach((t) => t.stop());
    remoteStream?.getTracks().forEach((t) => t.stop());
    set({
      activeCall: null,
      incomingCall: null,
      localStream: null,
      remoteStream: null,
      isMuted: false,
      isVideoOff: false,
      callDuration: 0,
    });
  },

  initiateCall: (params) => {
    const call: CallSession = {
      id: `call-${Date.now()}`,
      type: params.type,
      status: "ringing",
      callerId: params.callerId,
      calleeId: params.calleeId,
      conversationId: params.conversationId,
      callerName: params.callerName,
      callerAvatar: params.callerAvatar,
      startedAt: new Date().toISOString(),
    };
    set({ activeCall: call });
    return call;
  },
}));
