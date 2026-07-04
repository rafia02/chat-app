import { create } from "zustand";
import type { NotificationPayload } from "@/types";

interface Notification {
  id: string;
  conversationId: string;
  senderName: string;
  content: string;
  createdAt: string;
  read: boolean;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (payload: NotificationPayload) => void;
  markAllRead: () => void;
  clearNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (payload) => {
    const notification: Notification = {
      id: `notif-${Date.now()}`,
      conversationId: payload.conversationId,
      senderName: payload.senderName,
      content: payload.message.content,
      createdAt: payload.message.createdAt,
      read: false,
    };

    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 50),
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAllRead: () => set({ unreadCount: 0, notifications: get().notifications.map((n) => ({ ...n, read: true })) }),

  clearNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
}));
