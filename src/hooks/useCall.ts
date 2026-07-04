"use client";

import { useCallback, useRef, useEffect } from "react";
import { useAuthStore, useCallStore } from "@/stores";
import { socketEmitter } from "@/services/socket";
import type { CallType } from "@/types";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

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
    resetCall,
    initiateCall: createCall,
  } = useCallStore();

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    peerRef.current?.close();
    peerRef.current = null;
    resetCall();
  }, [resetCall]);

  const endCall = useCallback(() => {
    const callId = useCallStore.getState().activeCall?.id ?? useCallStore.getState().incomingCall?.id;
    if (callId) socketEmitter.endCall(callId);
    cleanup();
  }, [cleanup]);

  const createPeerConnection = useCallback(
    (callId: string, targetUserId: string) => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketEmitter.sendCallSignal({
            callId,
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
          durationIntervalRef.current = setInterval(() => {
            setCallDuration(useCallStore.getState().callDuration + 1);
          }, 1000);
        }
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          cleanup();
        }
      };

      peerRef.current = pc;
      return pc;
    },
    [setActiveCall, setRemoteStream, setCallDuration, cleanup]
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

        const pc = createPeerConnection(call.id, calleeId);
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socketEmitter.initiateCall({ conversationId, calleeId, type });
        socketEmitter.sendCallSignal({
          callId: call.id,
          signal: offer,
          targetUserId: calleeId,
        });
      } catch {
        cleanup();
      }
    },
    [user, createCall, getMediaStream, createPeerConnection, setLocalStream, cleanup]
  );

  const acceptCall = useCallback(async () => {
    const call = useCallStore.getState().incomingCall;
    if (!call || !user) return;

    try {
      const stream = await getMediaStream(call.type);
      setLocalStream(stream);

      const pc = createPeerConnection(call.id, call.callerId);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      socketEmitter.acceptCall(call.id);
      setActiveCall({ ...call, status: "connecting" });
      setIncomingCall(null);
    } catch {
      socketEmitter.rejectCall(call.id);
      setIncomingCall(null);
      cleanup();
    }
  }, [user, getMediaStream, createPeerConnection, setLocalStream, setActiveCall, setIncomingCall, cleanup]);

  const rejectCall = useCallback(() => {
    const call = useCallStore.getState().incomingCall;
    if (call) socketEmitter.rejectCall(call.id);
    setIncomingCall(null);
    cleanup();
  }, [setIncomingCall, cleanup]);

  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
      peerRef.current?.close();
    };
  }, []);

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
