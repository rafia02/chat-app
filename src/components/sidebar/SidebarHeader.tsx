import { ArrowLeft } from "lucide-react";

export default function SidebarHeader() {
  return (
    <div className="flex items-center justify-between border-b border-[#1B2233] px-6 py-6">
      <div>
        <h2 className="text-3xl font-bold text-white">Nova Chat</h2>

        <p className="mt-1 text-sm text-slate-400">Stay connected</p>
      </div>

      <button className="rounded-xl p-3 transition hover:bg-[#151D31]">
        <ArrowLeft className="text-slate-300" />
      </button>
    </div>
  );
}
