import { Smile, Paperclip, Mic, SendHorizontal } from "lucide-react";

export default function ChatInput() {
  return (
    <div className="border border-[#222C43] p-2.5 mx-4 rounded-2xl">
      <div className="flex items-center gap-4 rounded-xl border border-[#1E293B] bg-[#111827] px-6 py-2 2xl:py-3">
        <button className="text-slate-400 transition hover:text-indigo-400">
          <Smile size={24} />
        </button>

        <input
          placeholder="Type your message..."
          className="flex-1 bg-transparent text-white placeholder:text-slate-500 outline-none"
        />

        <button className="text-slate-400 transition hover:text-indigo-400">
          <Paperclip size={22} />
        </button>

        <button className="text-slate-400 transition hover:text-indigo-400">
          <Mic size={22} />
        </button>

        <button className="flex h-10 w-10 2xl:h-12 2xl:w-12 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 transition hover:scale-105">
          <SendHorizontal size={20} className="text-white" />
        </button>
      </div>
    </div>
  );
}
