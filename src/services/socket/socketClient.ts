import { io, Socket } from "socket.io-client";
import type { SocketConnectionStatus } from "@/types";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3001";

type StatusListener = (status: SocketConnectionStatus) => void;

class SocketClient {
  private socket: Socket | null = null;
  private status: SocketConnectionStatus = "disconnected";
  private statusListeners = new Set<StatusListener>();
  private userId: string | null = null;
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

  connect(userId: string, token: string): void {
    if (this.socket?.connected && this.userId === userId) return;

    this.disconnect();
    this.userId = userId;
    this.token = token;
    this.setStatus("connecting");

    this.socket = io(SOCKET_URL, {
      auth: { userId, token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this.socket.on("connect", () => {
      this.setStatus("connected");
    });

    this.socket.on("disconnect", (reason) => {
      this.setStatus(reason === "io server disconnect" ? "disconnected" : "reconnecting");
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
    this.userId = null;
    this.token = null;
    this.setStatus("disconnected");
  }

  emit<T>(event: string, data: T): void {
    this.socket?.emit(event, data);
  }

  emitWithAck<T, R>(event: string, data: T): Promise<R> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error("Socket not connected"));
        return;
      }
      this.socket.emit(event, data, (response: R) => resolve(response));
    });
  }

  on<T>(event: string, handler: (data: T) => void): () => void {
    this.socket?.on(event, handler);
    return () => {
      this.socket?.off(event, handler);
    };
  }

  joinConversation(conversationId: string): void {
    this.emit("conversation:join", conversationId);
  }

  leaveConversation(conversationId: string): void {
    this.emit("conversation:leave", conversationId);
  }
}

export const socketClient = new SocketClient();
