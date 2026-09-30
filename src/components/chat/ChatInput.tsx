"use client";

import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from "react";
import Image from "next/image";
import {
  File as FileIcon,
  FileArchive,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  Smile,
  Paperclip,
  Mic,
  SendHorizontal,
  X,
} from "lucide-react";
import { useMessages, useTypingIndicator } from "@/hooks";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  conversationId: string;
}

export default function ChatInput({ conversationId }: ChatInputProps) {
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const { sendMessage, isSending, replyTo, setReplyTo, error } =
    useMessages(conversationId);
  const { handleTyping, stopTyping } = useTypingIndicator(conversationId);

  useEffect(() => {
    if (replyTo) inputRef.current?.focus();
  }, [replyTo]);

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
  }, []);

  const clearSelectedFile = () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setFilePreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const selectFile = (file: File | null) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const previewUrl = file?.type.startsWith("image/")
      ? URL.createObjectURL(file)
      : null;
    previewUrlRef.current = previewUrl;
    setFilePreviewUrl(previewUrl);
    setSelectedFile(file);
  };

  const handleSend = async () => {
    if ((!text.trim() && !selectedFile) || isSending) return;
    const content = text.trim();
    const file = selectedFile ?? undefined;
    stopTyping();
    const sent = await sendMessage(content, file);
    if (sent) {
      setText("");
      clearSelectedFile();
    }
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

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) selectFile(file);
    e.target.value = "";
  };

  const extension = selectedFile?.name.includes(".")
    ? selectedFile.name.split(".").pop()?.toUpperCase() ?? "FILE"
    : selectedFile?.type.split("/").pop()?.toUpperCase() ?? "FILE";
  const PreviewIcon = selectedFile?.type.startsWith("video/")
    ? FileVideo
    : selectedFile?.type.startsWith("audio/")
      ? FileAudio
      : /\.(zip|rar|7z|tar|gz)$/i.test(selectedFile?.name ?? "")
        ? FileArchive
        : selectedFile?.type.startsWith("text/") ||
            /\.(pdf|doc|docx|txt|rtf)$/i.test(selectedFile?.name ?? "")
          ? FileText
          : selectedFile?.type.startsWith("image/")
            ? FileImage
            : FileIcon;

  return (
    <div className="border border-[#222C43] p-3 2xl:p-4 mx-2 md:mx-4 shrink-0 rounded-2xl">
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

      {selectedFile && (
        <div className="mb-2 flex min-w-0 items-center gap-3 rounded-xl border border-[#222C43] bg-[#111827] p-2.5">
          {filePreviewUrl ? (
            <Image
              src={filePreviewUrl}
              alt={`Preview of ${selectedFile.name}`}
              width={56}
              height={56}
              unoptimized
              className="h-14 w-14 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-[#1B2740] text-indigo-200">
              <PreviewIcon size={22} />
              <span className="mt-0.5 max-w-12 truncate text-[9px] font-semibold">
                {extension}
              </span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-200">
              {selectedFile.name}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {extension} · {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <button
            type="button"
            onClick={clearSelectedFile}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-[#1E293B] hover:text-white"
            aria-label={`Remove ${selectedFile.name}`}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="mb-2 px-1 text-xs text-red-400">
          {error}
        </p>
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

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip"
          onChange={handleFileChange}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending}
          className="text-slate-400 transition hover:text-indigo-400 disabled:opacity-50"
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
          disabled={(!text.trim() && !selectedFile) || isSending}
          className={cn(
            "flex h-9 w-9 md:h-10 md:w-10 2xl:h-12 2xl:w-12 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 transition",
            (text.trim() || selectedFile) && !isSending
              ? "hover:scale-105"
              : "opacity-50 cursor-not-allowed",
          )}
          aria-label="Send message"
        >
          <SendHorizontal size={18} className="text-white" />
        </button>
      </div>
    </div>
  );
}
