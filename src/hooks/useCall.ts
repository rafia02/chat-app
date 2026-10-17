"use client";

import { useCallback } from "react";
import { useAuthStore, useCallStore, useUsersStore } from "@/stores";
import { socketEmitter } from "@/services/socket";
import type { CallSignalPayload, CallType } from "@/types";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

let peerConnection: RTCPeerConnection | null = null;
let pendingCallSignals: CallSignalPayload[] = [];
let pendingIceCandidates: RTCIceCandidateInit[] = [];
let callSignalQueue = Promise.resolve();
let durationInterval: ReturnType<typeof setInterval> | null = null;
let disconnectTimeout: ReturnType<typeof setTimeout> | null = null;

function currentCallId(): string | undefined {
  const state = useCallStore.getState();
  return state.activeCall?.id ?? state.incomingCall?.id;
}

function releasePeerConnection() {
  if (durationInterval) clearInterval(durationInterval);
  if (disconnectTimeout) clearTimeout(disconnectTimeout);
  durationInterval = null;
  disconnectTimeout = null;
  peerConnection?.close();
  peerConnection = null;
  pendingCallSignals = [];
  pendingIceCandidates = [];
}

async function flushPendingIceCandidates(pc: RTCPeerConnection) {
  if (!pc.remoteDescription || pendingIceCandidates.length === 0) return;
  const candidates = pendingIceCandidates;
  pendingIceCandidates = [];
  for (const candidate of candidates) await pc.addIceCandidate(candidate);
}

async function applyCallSignal(payload: CallSignalPayload) {
  const expectedCallId = currentCallId();
  if (payload.callId && payload.callId !== expectedCallId) return;
  if (!peerConnection) {
    pendingCallSignals.push(payload);
    return;
  }

  const signal = payload.signal as RTCSessionDescriptionInit &
    RTCIceCandidateInit;
  const pc = peerConnection;
  if (signal.type === "offer") {
    await pc.setRemoteDescription(signal as RTCSessionDescriptionInit);
    await flushPendingIceCandidates(pc);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    const call = useCallStore.getState().activeCall;
    if (call) {
      const result = await socketEmitter.sendCallSignal({
        callId: call.id,
        conversationId: call.conversationId,
        signal: answer,
      });
      if (!result.success)
        throw new Error(result.message ?? "Could not send call answer");
    }
  } else if (signal.type === "answer") {
    await pc.setRemoteDescription(signal as RTCSessionDescriptionInit);
    await flushPendingIceCandidates(pc);
  } else if (signal.candidate) {
    if (!pc.remoteDescription) {
      pendingIceCandidates.push(signal as RTCIceCandidateInit);
    } else {
      await pc.addIceCandidate(signal as RTCIceCandidateInit);
    }
  }
}

export function handleCallSignal(payload: CallSignalPayload) {
  callSignalQueue = callSignalQueue
    .then(() => applyCallSignal(payload))
    .catch((error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Call signaling failed";
      releasePeerConnection();
      useCallStore.getState().resetCall();
      useCallStore.getState().setError(message);
    });
}

async function applyPendingCallSignals() {
  const pending = pendingCallSignals;
  pendingCallSignals = [];
  for (const payload of pending) handleCallSignal(payload);
  await callSignalQueue;
}

export function handleRemoteCallEnded(payload?: { status?: string }) {
  releasePeerConnection();
  const store = useCallStore.getState();
  store.resetCall();
  if (payload?.status === "missed")
    store.setError("The call was not answered.");
}

export function handleCallSocketUnavailable() {
  const store = useCallStore.getState();
  if (!store.activeCall && !store.incomingCall) return;
  releasePeerConnection();
  store.resetCall();
  store.setError("The call ended because the signaling connection was lost.");
}

export function handleCallRejected() {
  releasePeerConnection();
  const store = useCallStore.getState();
  const isCaller =
    store.activeCall?.callerId === useAuthStore.getState().user?.id;
  store.resetCall();
  if (isCaller) store.setError("The call was declined.");
}

export function handleCallBusy(payload: { reason?: string }) {
  releasePeerConnection();
  const store = useCallStore.getState();
  store.resetCall();
  const message =
    payload.reason === "offline"
      ? "This person is offline."
      : payload.reason === "caller-busy" || payload.reason === "busy"
        ? "This person is on another call."
        : "The call could not be started.";
  store.setError(message);
}

export function useCall() {
  const user = useAuthStore((state) => state.user);
  const {
    activeCall,
    incomingCall,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    callDuration,
    error,
    setError,
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

  const cleanup = useCallback(() => {
    releasePeerConnection();
    resetCall();
  }, [resetCall]);

  const getMediaStream = useCallback(async (type: CallType) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Calling is not supported in this browser.");
    }
    return navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === "video",
    });
  }, []);

  const createPeerConnection = useCallback(
    (conversationId: string, callId: string, targetUserId: string) => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      pc.onicecandidate = (event) => {
        if (!event.candidate) return;
        void socketEmitter
          .sendCallSignal({
            callId,
            conversationId,
            signal: event.candidate.toJSON(),
            targetUserId,
          })
          .then((result) => {
            if (!result.success) {
              handleRemoteCallEnded();
              useCallStore
                .getState()
                .setError(
                  result.message ?? "Could not send a call network candidate.",
                );
            }
          })
          .catch((error: unknown) => {
            handleRemoteCallEnded();
            useCallStore
              .getState()
              .setError(
                error instanceof Error
                  ? error.message
                  : "Call signaling failed.",
              );
          });
      };

      pc.ontrack = (event) => {
        if (event.streams[0]) setRemoteStream(event.streams[0]);
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          if (disconnectTimeout) clearTimeout(disconnectTimeout);
          disconnectTimeout = null;
          const call = useCallStore.getState().activeCall;
          if (call && call.status !== "connected") {
            setActiveCall({ ...call, status: "connected" });
          }
          if (durationInterval) clearInterval(durationInterval);
          durationInterval = setInterval(() => {
            setCallDuration(useCallStore.getState().callDuration + 1);
          }, 1000);
        } else if (pc.connectionState === "disconnected") {
          if (disconnectTimeout) clearTimeout(disconnectTimeout);
          disconnectTimeout = setTimeout(() => {
            if (peerConnection?.connectionState === "disconnected") {
              handleRemoteCallEnded();
              useCallStore.getState().setError("The call connection was lost.");
            }
          }, 5000);
        } else if (pc.connectionState === "failed") {
          handleRemoteCallEnded();
          useCallStore.getState().setError("The call connection failed.");
        }
      };

      peerConnection = pc;
      return pc;
    },
    [setActiveCall, setRemoteStream, setCallDuration],
  );

  const startCall = useCallback(
    async (conversationId: string, calleeId: string, type: CallType) => {
      if (!user || useCallStore.getState().activeCall) return;
      setError(null);
      let callId: string | undefined;

      try {
        const recipient = await useUsersStore.getState().ensureUser(calleeId);
        const stream = await getMediaStream(type);
        setLocalStream(stream);

        const call = createCall({
          conversationId,
          calleeId,
          type,
          callerId: user.id,
          callerName: recipient?.name ?? user.name,
          callerAvatar: recipient?.avatar ?? user.avatar,
        });

        const response = await socketEmitter.startCall({
          conversationId,
          type: type === "video" ? "video" : "audio",
        });
        if (!response.success || !response.data?._id) {
          throw new Error(response.message ?? "Call could not be started.");
        }
        callId = String(response.data._id);
        const activeCall = { ...call, id: callId, status: "ringing" as const };
        setActiveCall(activeCall);

        const pc = createPeerConnection(conversationId, callId, calleeId);
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        const signalResult = await socketEmitter.sendCallSignal({
          callId,
          conversationId,
          signal: offer,
          targetUserId: calleeId,
        });
        if (!signalResult.success) {
          throw new Error(signalResult.message ?? "Could not send call offer.");
        }
      } catch (error) {
        if (callId) void socketEmitter.endCall(callId).catch(() => undefined);
        cleanup();
        setError(
          error instanceof Error ? error.message : "Could not start the call.",
        );
      }
    },
    [
      user,
      setError,
      getMediaStream,
      setLocalStream,
      createCall,
      setActiveCall,
      createPeerConnection,
      cleanup,
    ],
  );

  const acceptCall = useCallback(async () => {
    const call = useCallStore.getState().incomingCall;
    if (!call || !user) return;

    try {
      setError(null);
      const stream = await getMediaStream(call.type);
      setLocalStream(stream);
      const pc = createPeerConnection(
        call.conversationId,
        call.id,
        call.callerId,
      );
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      setActiveCall({ ...call, status: "connecting" });
      setIncomingCall(null);
      const result = await socketEmitter.acceptCall(call.id);
      if (!result.success) {
        throw new Error(result.message ?? "Could not accept the call.");
      }
      await applyPendingCallSignals();
    } catch (error) {
      const callId = call.id;
      void socketEmitter.rejectCall(callId).catch(() => undefined);
      cleanup();
      setError(
        error instanceof Error ? error.message : "Could not accept the call.",
      );
    }
  }, [
    user,
    setError,
    getMediaStream,
    setLocalStream,
    createPeerConnection,
    setActiveCall,
    setIncomingCall,
    cleanup,
  ]);

  const rejectCall = useCallback(async () => {
    const call = useCallStore.getState().incomingCall;
    if (!call) return;
    cleanup();
    try {
      const result = await socketEmitter.rejectCall(call.id);
      if (!result.success)
        setError(result.message ?? "Could not reject the call.");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not reject the call.",
      );
    }
  }, [cleanup, setError]);

  const endCall = useCallback(async () => {
    const call = useCallStore.getState().activeCall;
    cleanup();
    if (call) {
      try {
        const result = await socketEmitter.endCall(call.id);
        if (!result.success)
          setError(result.message ?? "Could not end the call.");
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Could not end the call.",
        );
      }
    }
  }, [cleanup, setError]);

  return {
    activeCall,
    incomingCall,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    callDuration,
    error,
    setError,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
  };
}
