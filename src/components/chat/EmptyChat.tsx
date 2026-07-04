import { MessageCircleMore } from "lucide-react";

export default function EmptyChat() {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="rounded-[30px] border border-[#1E293B] bg-gradient-to-br from-[#111827] to-[#151D31] p-12 shadow-2xl shadow-black/40">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-violet-600">
          <MessageCircleMore size={42} className="text-white" />
        </div>

        <h1 className="mt-8 text-center text-4xl font-bold text-white">
          Welcome to Nova Chat
        </h1>

        <p className="mx-auto mt-4 max-w-md text-center text-slate-400">
          Select a conversation from the sidebar and start messaging instantly
          with your friends.
        </p>

        <div className="mt-10 flex justify-center">
          <button className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-4 font-medium text-white transition-all hover:scale-105">
            Start Conversation
          </button>
        </div>
      </div>
    </div>
  );
}
