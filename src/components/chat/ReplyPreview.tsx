"use client";

interface ReplyPreviewProps {
  sender: string;
  message: string;
}

export default function ReplyPreview({ sender, message }: ReplyPreviewProps) {
  return (
    <div className="mb-2 rounded-2xl border-l-4 border-indigo-500 bg-[#172033] px-4 py-3">
      <p className="text-xs font-semibold text-indigo-400">{sender}</p>

      <p className="mt-1 line-clamp-1 text-sm text-slate-400">{message}</p>
    </div>
  );
}
