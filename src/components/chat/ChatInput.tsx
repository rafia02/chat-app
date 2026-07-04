"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Smile, Paperclip, Mic, SendHorizontal, X } from "lucide-react";
import { useMessages, useTypingIndicator } from "@/hooks";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  conversationId: string;
}

export default function ChatInput({ conversationId }: ChatInputProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { sendMessage, isSending, replyTo, setReplyTo } =
    useMessages(conversationId);
  const { handleTyping, stopTyping } = useTypingIndicator(conversationId);

  useEffect(() => {
    if (replyTo) inputRef.current?.focus();
  }, [replyTo]);

  const handleSend = async () => {
    if (!text.trim() || isSending) return;
    const content = text;
    setText("");
    stopTyping();
    await sendMessage(content);
  };

  const handleChange = (value: string) => {
    setText(value);
    if (value.trim()) handleTyping();
    else stopTyping();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-[#222C43] p-2.5 mx-2 md:mx-4 shrink-0">
      {replyTo && (
        <div className="mb-2 flex items-center justify-between rounded-xl border border-[#222C43] bg-[#111827] px-4 py-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-indigo-400">
              Replying to {replyTo.senderName}
            </p>
            <p className="truncate text-sm text-slate-400">{replyTo.content}</p>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            className="ml-3 shrink-0 rounded-lg p-1 text-slate-400 hover:bg-[#1E293B] hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 md:gap-4 rounded-xl border border-[#1E293B] bg-[#111827] px-3 md:px-6 py-2 2xl:py-3">
        <button
          type="button"
          className="hidden sm:block text-slate-400 transition hover:text-indigo-400"
          aria-label="Add emoji"
        >
          <Smile size={22} />
        </button>

        <input
          ref={inputRef}
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={stopTyping}
          placeholder="Type your message..."
          disabled={isSending}
          className="flex-1 bg-transparent text-sm md:text-base text-white placeholder:text-slate-500 outline-none disabled:opacity-50"
        />

        <button
          type="button"
          className="hidden md:block text-slate-400 transition hover:text-indigo-400"
          aria-label="Attach file"
        >
          <Paperclip size={20} />
        </button>

        <button
          type="button"
          className="hidden md:block text-slate-400 transition hover:text-indigo-400"
          aria-label="Voice message"
        >
          <Mic size={20} />
        </button>

        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() || isSending}
          className={cn(
            "flex h-9 w-9 md:h-10 md:w-10 2xl:h-12 2xl:w-12 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 transition",
            text.trim() && !isSending
              ? "hover:scale-105"
              : "opacity-50 cursor-not-allowed"
          )}
          aria-label="Send message"
        >
          <SendHorizontal size={18} className="text-white" />
        </button>
      </div>
    </div>
  );
}
