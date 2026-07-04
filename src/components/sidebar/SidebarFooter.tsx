import Image from "next/image";
import { ChevronDown, Moon, Settings } from "lucide-react";

export default function SidebarFooter() {
  return (
    <div className="border-t border-[#222C43] bg-[#111827] px-4 py-3 2xl:p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="https://i.pravatar.cc/150?img=20"
            alt="profile"
            width={52}
            height={52}
            className="rounded-full w-10 h-10 2xl:w-14 2xl:h-14"
          />

          <div>
            <h3 className="font-semibold text-white">Rafia Islam</h3>

            <p className="text-sm text-green-400">Online</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="rounded-xl p-2 hover:bg-[#151D31]">
            <ChevronDown size={18} className="text-slate-400" />
          </button>

          <button className="rounded-xl p-2 hover:bg-[#151D31]">
            <Moon size={18} className="text-slate-400" />
          </button>

          <button className="rounded-xl p-2 hover:bg-[#151D31]">
            <Settings size={18} className="text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
