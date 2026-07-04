"use client";

import { useSocketStore } from "@/stores";
import { cn } from "@/lib/utils";

export default function SocketStatus() {
  const status = useSocketStore((s) => s.status);

  const config = {
    connected: { color: "bg-green-500", label: "Connected" },
    connecting: { color: "bg-yellow-500 animate-pulse", label: "Connecting..." },
    reconnecting: { color: "bg-yellow-500 animate-pulse", label: "Reconnecting..." },
    disconnected: { color: "bg-slate-500", label: "Offline" },
    error: { color: "bg-red-500", label: "Connection error" },
  }[status];

  return (
    <div className="flex items-center gap-2 px-4 py-1.5" title={config.label}>
      <span className={cn("h-2 w-2 rounded-full", config.color)} />
      <span className="text-[10px] text-slate-500">{config.label}</span>
    </div>
  );
}
