import SidebarHeader from "./SidebarHeader";
import SidebarSearch from "./SidebarSearch";
import SidebarTabs from "./SidebarTabs";
import ConversationList from "./ConversationList";
import SidebarFooter from "./SidebarFooter";
import SocketStatus from "../chat/SocketStatus";
import SocialPanel from "./SocialPanel";
import { useSocialStore, useUIStore } from "@/stores";
import { Bell, MessageCircle, Users } from "lucide-react";

export default function SidebarContent() {
  const section = useUIStore((state) => state.sidebarSection);
  const setSection = useUIStore((state) => state.setSidebarSection);
  const friendRequests = useSocialStore(
    (state) => state.receivedFriendRequests.length,
  );
  const messageRequests = useSocialStore(
    (state) => state.receivedMessageRequests.length,
  );
  const sections = [
    { id: "chats" as const, label: "Chats", Icon: MessageCircle, count: 0 },
    { id: "people" as const, label: "People", Icon: Users, count: 0 },
    {
      id: "requests" as const,
      label: "Requests",
      Icon: Bell,
      count: friendRequests + messageRequests,
    },
  ];

  return (
    <div className="flex h-full flex-1 flex-col min-h-0">
      <SidebarHeader />
      <SocketStatus />

      <div className="grid grid-cols-3 gap-1 px-3 pt-3 md:hidden">
        {sections.map(({ id, label, Icon, count }) => (
          <button
            type="button"
            key={id}
            onClick={() => setSection(id)}
            className={`relative flex items-center justify-center gap-1 rounded-lg py-2 text-xs ${section === id ? "bg-[#1B2740] text-white" : "text-slate-400"}`}
            aria-pressed={section === id}
          >
            <Icon size={15} />
            {label}
            {count > 0 && (
              <span className="absolute right-2 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[9px] text-white">
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {section === "chats" ? (
        <>
          <div className="px-3 md:px-4 2xl:px-5 pt-0 2xl:pt-6">
            <SidebarSearch />
          </div>
          <div className="px-3 md:px-4 2xl:px-5 pt-4 2xl:pt-6">
            <SidebarTabs />
          </div>
          <ConversationList />
          <SidebarFooter />
        </>
      ) : (
        <SocialPanel view={section} />
      )}
    </div>
  );
}
