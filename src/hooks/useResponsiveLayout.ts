"use client";

import { useEffect } from "react";
import { useIsMobile } from "./useMediaQuery";
import { useUIStore } from "@/stores";

export function useResponsiveLayout() {
  const isMobile = useIsMobile();
  const { setMobile, showChatOnMobile, openChat, openSidebar } = useUIStore();

  useEffect(() => {
    setMobile(isMobile);
  }, [isMobile, setMobile]);

  return { isMobile, showChatOnMobile, openChat, openSidebar };
}
