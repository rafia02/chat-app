import { MessageCircle } from "lucide-react";

export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600">
        <MessageCircle size={20} />
      </div>

      <div>
        <h2 className="font-bold text-lg">Nova Chat</h2>
        <p className="text-xs text-slate-400">Realtime Messaging</p>
      </div>
    </div>
  );
}
