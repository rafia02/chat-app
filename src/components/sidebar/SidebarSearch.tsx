import { Search } from "lucide-react";

export default function SidebarSearch() {
  return (
    <div className="relative">
      <Search
        className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500"
        size={18}
      />

      <input
        placeholder="Search conversations..."
        className="h-[50px] 2xl:h-14 w-full rounded-lg border border-[#222C43] bg-[#111827] pl-14 pr-5 text-white outline-none transition focus:border-indigo-500"
      />
    </div>
  );
}
