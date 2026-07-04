import { create } from "zustand";

interface UIState {
  isSidebarOpen: boolean;
  isMobile: boolean;
  showChatOnMobile: boolean;

  setSidebarOpen: (open: boolean) => void;
  setMobile: (mobile: boolean) => void;
  openChat: () => void;
  openSidebar: () => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  isMobile: false,
  showChatOnMobile: false,

  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  setMobile: (mobile) =>
    set({ isMobile: mobile, showChatOnMobile: false, isSidebarOpen: !mobile }),
  openChat: () => set({ showChatOnMobile: true }),
  openSidebar: () => set({ showChatOnMobile: false }),
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
}));
