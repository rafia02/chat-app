"use client";

import { useCallback } from "react";
import { useAuthStore, useCallStore } from "@/stores";
import { socketEmitter } from "@/services/socket";
import type { CallSignalPayload, CallType } from "@/types";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

let peerConnection: RTCPeerConnection | null = null;
let pendingCallSignals: CallSignalPayload[] = [];
let callSignalQueue = Promise.resolve();
let durationInterval: ReturnType<typeof setInterval> | null = null;

async function applyCallSignal(payload: CallSignalPayload) {
  const pc = peerConnection;
  if (!pc) {
    pendingCallSignals.push(payload);
    return;
  }

  const signal = payload.signal as RTCSessionDescriptionInit &
    RTCIceCandidateInit;
  if (signal.type === "offer") {
    await pc.setRemoteDescription(signal as RTCSessionDescriptionInit);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    const call =
      useCallStore.getState().activeCall ??
      useCallStore.getState().incomingCall;
    if (call) {
      socketEmitter.sendCallSignal({
        conversationId: call.conversationId,
        callId: payload.callId,
        signal: answer,
        targetUserId: call.callerId,
      });
    }
  } else if (signal.type === "answer") {
    await pc.setRemoteDescription(signal as RTCSessionDescriptionInit);
  } else if (signal.candidate) {
    await pc.addIceCandidate(signal as RTCIceCandidateInit);
  }
}

export function handleCallSignal(payload: CallSignalPayload) {
  callSignalQueue = callSignalQueue
    .then(() => applyCallSignal(payload))
    .catch(() => undefined);
}

export function handleRemoteCallEnded() {
  if (durationInterval) clearInterval(durationInterval);
  durationInterval = null;
  peerConnection?.close();
  peerConnection = null;
  pendingCallSignals = [];
  useCallStore.getState().resetCall();
}

async function applyPendingCallSignals() {
  const pending = pendingCallSignals;
  pendingCallSignals = [];
  for (const payload of pending) handleCallSignal(payload);
  await callSignalQueue;
}

export function useCall() {
  const user = useAuthStore((s) => s.user);
  const {
    activeCall,
    incomingCall,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    callDuration,
    setIncomingCall,
    setActiveCall,
    setLocalStream,
    setRemoteStream,
    toggleMute,
    toggleVideo,
    setCallDuration,
    initiateCall: createCall,
  } = useCallStore();

  const cleanup = useCallback(() => {
    handleRemoteCallEnded();
  }, []);

  const endCall = useCallback(() => {
    const conversationId =
      useCallStore.getState().activeCall?.conversationId ??
      useCallStore.getState().incomingCall?.conversationId;
    if (conversationId) socketEmitter.endCall(conversationId);
    cleanup();
  }, [cleanup]);

  const createPeerConnection = useCallback(
    (conversationId: string, targetUserId: string) => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketEmitter.sendCallSignal({
            conversationId,
            signal: event.candidate.toJSON(),
            targetUserId,
          });
        }
      };

      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          const call = useCallStore.getState().activeCall;
          if (call) setActiveCall({ ...call, status: "connected" });
          if (durationInterval) clearInterval(durationInterval);
          durationInterval = setInterval(() => {
            setCallDuration(useCallStore.getState().callDuration + 1);
          }, 1000);
        }
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "disconnected"
        ) {
          cleanup();
        }
      };

      peerConnection = pc;
      return pc;
    },
    [setActiveCall, setRemoteStream, setCallDuration, cleanup],
  );

  const getMediaStream = useCallback(async (type: CallType) => {
    return navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === "video",
    });
  }, []);

  const startCall = useCallback(
    async (conversationId: string, calleeId: string, type: CallType) => {
      if (!user) return;

      const call = createCall({
        conversationId,
        calleeId,
        type,
        callerId: user.id,
        callerName: user.name,
        callerAvatar: user.avatar,
      });

      try {
        const stream = await getMediaStream(type);
        setLocalStream(stream);

        const pc = createPeerConnection(conversationId, calleeId);
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socketEmitter.startCall({ conversationId, type });
        socketEmitter.sendCallSignal({
          conversationId,
          callId: call.id,
          signal: offer,
          targetUserId: calleeId,
        });
      } catch {
        cleanup();
      }
    },
    [
      user,
      createCall,
      getMediaStream,
      createPeerConnection,
      setLocalStream,
      cleanup,
    ],
  );

  const acceptCall = useCallback(async () => {
    const call = useCallStore.getState().incomingCall;
    if (!call || !user) return;

    try {
      const stream = await getMediaStream(call.type);
      setLocalStream(stream);

      const pc = createPeerConnection(call.conversationId, call.callerId);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      socketEmitter.acceptCall(call.conversationId);
      setActiveCall({ ...call, status: "connecting" });
      setIncomingCall(null);
      await applyPendingCallSignals();
    } catch {
      socketEmitter.endCall(call.conversationId);
      setIncomingCall(null);
      cleanup();
    }
  }, [
    user,
    getMediaStream,
    createPeerConnection,
    setLocalStream,
    setActiveCall,
    setIncomingCall,
    cleanup,
  ]);

  const rejectCall = useCallback(() => {
    const call = useCallStore.getState().incomingCall;
    if (call) socketEmitter.endCall(call.conversationId);
    setIncomingCall(null);
    cleanup();
  }, [setIncomingCall, cleanup]);

  return {
    activeCall,
    incomingCall,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    callDuration,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
  };
}
