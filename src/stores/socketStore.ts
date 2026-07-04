import { create } from "zustand";
import type { SocketConnectionStatus } from "@/types";

interface SocketState {
  status: SocketConnectionStatus;
  setStatus: (status: SocketConnectionStatus) => void;
}

export const useSocketStore = create<SocketState>((set) => ({
  status: "disconnected",
  setStatus: (status) => set({ status }),
}));
