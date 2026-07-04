"use client";

import { useSocket, useChatSocket } from "@/hooks";

export function SocketProvider({ children }: { children: React.ReactNode }) {
  useSocket();
  useChatSocket();
  return <>{children}</>;
}
