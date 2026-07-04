"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import ChatArea from "./ChatArea";
import Sidebar from "../sidebar/Sidebar";
import NotificationToast from "./NotificationToast";
import CallOverlay from "../call/CallOverlay";
import IncomingCallModal from "../call/IncomingCallModal";
import { useResponsiveLayout } from "@/hooks";
import { cn } from "@/lib/utils";

interface ChatLayoutProps {
  conversationId?: string;
}

export default function ChatLayout({ conversationId }: ChatLayoutProps) {
  const { isMobile, showChatOnMobile } = useResponsiveLayout();

  return (
    <AuthGuard>
      <main className="h-screen bg-[#070B14] p-0 md:p-2 lg:p-3">
        <NotificationToast />
        <CallOverlay />
        <IncomingCallModal />

        <div className="flex h-full overflow-hidden md:rounded-[32px] border border-[#1B2233] bg-[#0B1120] shadow-2xl shadow-black/40">
          <div
            className={cn(
              "h-full shrink-0 transition-all duration-300",
              isMobile
                ? showChatOnMobile
                  ? "hidden"
                  : "w-full"
                : "w-auto"
            )}
          >
            <Sidebar />
          </div>

          <div
            className={cn(
              "flex flex-1 flex-col min-w-0",
              isMobile && !showChatOnMobile && "hidden"
            )}
          >
            <ChatArea conversationId={conversationId} />
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
