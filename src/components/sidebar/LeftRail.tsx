"use client";

import { MessageCircle, Users, Bell, CircleHelp } from "lucide-react";
import { useSocialStore, useUIStore } from "@/stores";

const menus = [
  { Icon: MessageCircle, section: "chats" as const, label: "Chats" },
  { Icon: Users, section: "people" as const, label: "Friends" },
  { Icon: Bell, section: "requests" as const, label: "Requests" },
];

export default function LeftRail() {
  const section = useUIStore((state) => state.sidebarSection);
  const setSection = useUIStore((state) => state.setSidebarSection);
  const requestCount = useSocialStore(
    (state) =>
      state.receivedFriendRequests.length +
      state.receivedMessageRequests.length,
  );

  return (
    <div className="flex flex-col items-center justify-between border-r border-[#1B2233] bg-[#0A0F1C] py-6 px-2 2xl:px-4">
      <div className="space-y-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
          <MessageCircle className="text-white" />
        </div>

        {menus.map(({ Icon, section: itemSection, label }) => (
          <button
            key={itemSection}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={section === itemSection}
            onClick={() => setSection(itemSection)}
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-[#151D31] hover:text-white ${section === itemSection ? "bg-[#151D31] text-white" : "text-slate-400"}`}
          >
            <span className="relative">
              <Icon size={22} />
              {itemSection === "requests" && requestCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[9px] font-semibold text-white">
                  {requestCount}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      <button className="flex h-12 w-12 items-center justify-center rounded-xl text-slate-400 transition hover:bg-[#151D31] hover:text-white">
        <CircleHelp size={22} />
      </button>
    </div>
  );
}
