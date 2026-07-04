"use client";

import Image from "next/image";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/hooks";

export default function SidebarFooter() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (!user) return null;

  const statusColors = {
    online: "text-green-400",
    offline: "text-slate-400",
    away: "text-yellow-400",
    busy: "text-red-400",
  };

  return (
    <div className="relative border-t border-[#222C43] bg-[#111827] px-3 md:px-4 py-3 2xl:p-5 shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <Image
            src={user.avatar}
            alt={user.name}
            width={52}
            height={52}
            className="rounded-full w-9 h-9 md:w-10 md:h-10 2xl:w-14 2xl:h-14 object-cover shrink-0"
          />

          <div className="min-w-0">
            <h3 className="truncate font-semibold text-sm md:text-base text-white">
              {user.name}
            </h3>
            <p className={`text-xs md:text-sm capitalize ${statusColors[user.status]}`}>
              {user.status}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="rounded-xl p-2 hover:bg-[#151D31]"
            aria-label="User menu"
          >
            <ChevronDown
              size={18}
              className={`text-slate-400 transition ${showMenu ? "rotate-180" : ""}`}
            />
          </button>

          <button className="hidden md:block rounded-xl p-2 hover:bg-[#151D31]">
            <Settings size={18} className="text-slate-400" />
          </button>
        </div>
      </div>

      {showMenu && (
        <div className="absolute bottom-full left-3 right-3 mb-2 rounded-xl border border-[#222C43] bg-[#0F172A] py-1 shadow-xl">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-[#151D31] transition"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
