"use client";

import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useChatStore } from "@/stores";

export default function SidebarSearch() {
  const [localQuery, setLocalQuery] = useState("");
  const setSearchQuery = useChatStore((s) => s.setSearchQuery);
  const storeQuery = useChatStore((s) => s.searchQuery);

  useEffect(() => {
    setLocalQuery(storeQuery);
  }, [storeQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localQuery !== storeQuery) {
        setSearchQuery(localQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localQuery, storeQuery, setSearchQuery]);

  return (
    <div className="relative">
      <Search
        className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-slate-500"
        size={18}
      />

      <input
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        placeholder="Search conversations..."
        className="h-11 md:h-[50px] 2xl:h-14 w-full rounded-lg border border-[#222C43] bg-[#111827] pl-11 md:pl-14 pr-10 text-sm md:text-base text-white outline-none transition focus:border-indigo-500"
      />

      {localQuery && (
        <button
          onClick={() => {
            setLocalQuery("");
            setSearchQuery("");
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-white"
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
