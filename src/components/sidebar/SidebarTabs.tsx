"use client";

import type { ConversationTab } from "@/types";
import { useConversations } from "@/hooks";

const tabs: { label: string; value: ConversationTab }[] = [
  { label: "All", value: "all" },
  { label: "Unread", value: "unread" },
  { label: "Groups", value: "groups" },
  { label: "DM", value: "dm" },
];

export default function SidebarTabs() {
  const { activeTab, setActiveTab } = useConversations();

  return (
    <div className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-none">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => setActiveTab(tab.value)}
          className={`shrink-0 rounded-3xl px-3 md:px-4 py-1 text-xs md:text-sm transition ${
            activeTab === tab.value
              ? "bg-indigo-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-[#151D31]"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
