import { create } from "zustand";

interface UIState {
  sidebarSection: "chats" | "people" | "requests";
  isSidebarOpen: boolean;
  isMobile: boolean;
  showChatOnMobile: boolean;

  setSidebarOpen: (open: boolean) => void;
  setMobile: (mobile: boolean) => void;
  openChat: () => void;
  openSidebar: () => void;
  toggleSidebar: () => void;
  setSidebarSection: (section: UIState["sidebarSection"]) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarSection: "chats",
  isSidebarOpen: true,
  isMobile: false,
  showChatOnMobile: false,

  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  setMobile: (mobile) =>
    set({ isMobile: mobile, showChatOnMobile: false, isSidebarOpen: !mobile }),
  openChat: () => set({ showChatOnMobile: true }),
  openSidebar: () => set({ showChatOnMobile: false }),
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  setSidebarSection: (sidebarSection) => set({ sidebarSection }),
}));
