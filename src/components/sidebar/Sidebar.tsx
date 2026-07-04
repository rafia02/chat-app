"use client";

import LeftRail from "./LeftRail";
import SidebarContent from "./SidebarContent";
import { useIsMobile } from "@/hooks";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const isMobile = useIsMobile();

  return (
    <aside
      className={cn(
        "flex h-full border-r border-[#1B2233] bg-[#0D1322]",
        isMobile ? "w-full" : "w-[320px] lg:w-[380px] xl:w-[430px]"
      )}
    >
      {!isMobile && <LeftRail />}
      <SidebarContent />
    </aside>
  );
}
