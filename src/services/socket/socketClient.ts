import { io, Socket } from "socket.io-client";
import type { SocketConnectionStatus } from "@/types";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:5000";

type StatusListener = (status: SocketConnectionStatus) => void;

class SocketClient {
  private socket: Socket | null = null;
  private status: SocketConnectionStatus = "disconnected";
  private statusListeners = new Set<StatusListener>();
  private eventListeners = new Map<string, Set<(data: unknown) => void>>();
  private token: string | null = null;

  getSocket(): Socket | null {
    return this.socket;
  }

  getStatus(): SocketConnectionStatus {
    return this.status;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  private setStatus(status: SocketConnectionStatus) {
    this.status = status;
    this.statusListeners.forEach((l) => l(status));
  }

  connect(token: string): void {
    if (this.socket?.connected && this.token === token) return;

    this.disconnect();
    this.token = token;
    this.setStatus("connecting");

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this.eventListeners.forEach((handlers, event) => {
      handlers.forEach((handler) => this.socket?.on(event, handler));
    });

    this.socket.on("connect", () => {
      this.setStatus("connected");
    });

    this.socket.on("disconnect", (reason) => {
      this.setStatus(
        reason === "io server disconnect" ? "disconnected" : "reconnecting",
      );
    });

    this.socket.on("connect_error", () => {
      this.setStatus("error");
    });

    this.socket.io.on("reconnect", () => {
      this.setStatus("connected");
    });

    this.socket.io.on("reconnect_attempt", () => {
      this.setStatus("reconnecting");
    });

    this.socket.io.on("reconnect_failed", () => {
      this.setStatus("error");
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.token = null;
    this.setStatus("disconnected");
  }

  emit<T>(event: string, data?: T): void {
    if (data === undefined) {
      this.socket?.emit(event);
      return;
    }
    this.socket?.emit(event, data);
  }

  on<T>(event: string, handler: (data: T) => void): () => void {
    const handlers = this.eventListeners.get(event) ?? new Set();
    const listener = handler as (data: unknown) => void;
    handlers.add(listener);
    this.eventListeners.set(event, handlers);
    this.socket?.on(event, listener);
    return () => {
      this.socket?.off(event, listener);
      handlers.delete(listener);
      if (handlers.size === 0) this.eventListeners.delete(event);
    };
  }

  joinConversation(conversationId: string): void {
    this.emit(CLIENT_JOIN, conversationId);
  }

  leaveConversation(conversationId: string): void {
    this.emit(CLIENT_LEAVE, conversationId);
  }
}

const CLIENT_JOIN = "conversation:join";
const CLIENT_LEAVE = "conversation:leave";

export const socketClient = new SocketClient();
