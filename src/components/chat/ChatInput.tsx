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
  MicOff,
  SendHorizontal,
  X,
} from "lucide-react";
import { useMessages, useTypingIndicator } from "@/hooks";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  conversationId: string;
}

interface SelectedAttachment {
  file: File;
  previewUrl?: string;
}

export default function ChatInput({ conversationId }: ChatInputProps) {
  const [text, setText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<SelectedAttachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isSendingFiles, setIsSendingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentUrlsRef = useRef(new Map<File, string>());
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordingChunksRef = useRef<BlobPart[]>([]);
  const recordingCancelledRef = useRef(false);
  const sendLockRef = useRef(false);
  const { sendMessage, isSending, replyTo, setReplyTo, error } =
    useMessages(conversationId);
  const { handleTyping, stopTyping } = useTypingIndicator(conversationId);

  useEffect(() => {
    if (replyTo) inputRef.current?.focus();
  }, [replyTo]);

  useEffect(
    () => () => {
      attachmentUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  const addSelectedFiles = (files: File[]) => {
    const validFiles = files.filter((file) => file.size <= 10 * 1024 * 1024);
    if (validFiles.length !== files.length) {
      setRecordingError("Each attachment must be 10 MB or smaller.");
    } else {
      setRecordingError(null);
    }
    const attachments = validFiles.map((file) => {
      if (!file.type.startsWith("image/") && !file.type.startsWith("audio/")) {
        return { file };
      }
      const previewUrl = URL.createObjectURL(file);
      attachmentUrlsRef.current.set(file, previewUrl);
      return { file, previewUrl };
    });
    setSelectedFiles((current) => [...current, ...attachments]);
  };

  const removeSelectedFile = (file: File) => {
    const previewUrl = attachmentUrlsRef.current.get(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    attachmentUrlsRef.current.delete(file);
    setSelectedFiles((current) => current.filter((item) => item.file !== file));
  };

  const clearSelectedFiles = () => {
    attachmentUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    attachmentUrlsRef.current.clear();
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = async () => {
    if (
      (!text.trim() && selectedFiles.length === 0) ||
      isSending ||
      isSendingFiles ||
      sendLockRef.current ||
      isRecording
    )
      return;
    sendLockRef.current = true;
    setIsSendingFiles(true);
    const content = text.trim();
    stopTyping();
    if (selectedFiles.length === 0) {
      const sent = await sendMessage(content);
      if (sent) setText("");
      setIsSendingFiles(false);
      sendLockRef.current = false;
      return;
    }

    let contentSent = !content;
    const failedFiles: SelectedAttachment[] = [];
    const batchSize = selectedFiles.length;
    for (const [index, attachment] of selectedFiles.entries()) {
      const sent = await sendMessage(
        contentSent ? "" : content,
        attachment.file,
        (fileProgress) => {
          setUploadProgress(
            Math.round(((index + fileProgress / 100) / batchSize) * 100),
          );
        },
      );
      if (sent) {
        contentSent = true;
        const previewUrl = attachmentUrlsRef.current.get(attachment.file);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        attachmentUrlsRef.current.delete(attachment.file);
      } else {
        failedFiles.push(attachment);
      }
    }
    if (contentSent) setText("");
    setSelectedFiles(failedFiles);
    if (failedFiles.length === 0) {
      clearSelectedFiles();
    } else if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsSendingFiles(false);
    setUploadProgress(null);
    sendLockRef.current = false;
  };

  const startVoiceRecording = async () => {
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setRecordingError("Voice recording is not supported in this browser.");
      return;
    }
    try {
      setRecordingError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      recordingChunksRef.current = [];
      recordingCancelledRef.current = false;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordingChunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        recordingCancelledRef.current = true;
        recordingChunksRef.current = [];
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        setIsRecording(false);
        setRecordingError("Voice recording failed. Please try again.");
      };
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const extension = mimeType.includes("ogg")
          ? "ogg"
          : mimeType.includes("mp4")
            ? "m4a"
            : "webm";
        if (
          !recordingCancelledRef.current &&
          recordingChunksRef.current.length > 0
        ) {
          const voiceFile = new File(
            [new Blob(recordingChunksRef.current, { type: mimeType })],
            `voice-message-${Date.now()}.${extension}`,
            { type: mimeType },
          );
          addSelectedFiles([voiceFile]);
        }
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        setIsRecording(false);
      };
      recorder.start();
      setIsRecording(true);
    } catch {
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      setRecordingError("Microphone access was unavailable.");
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const cancelVoiceRecording = () => {
    recordingCancelledRef.current = true;
    stopVoiceRecording();
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
    const files = Array.from(e.target.files ?? []);
    if (files.length) addSelectedFiles(files);
    e.target.value = "";
  };

  const getFileMetadata = (file: File) => {
    const extension = file.name.includes(".")
      ? (file.name.split(".").pop()?.toUpperCase() ?? "FILE")
      : (file.type.split("/").pop()?.toUpperCase() ?? "FILE");
    const Icon = file.type.startsWith("video/")
      ? FileVideo
      : file.type.startsWith("audio/")
        ? FileAudio
        : /\.(zip|rar|7z|tar|gz)$/i.test(file.name)
          ? FileArchive
          : file.type.startsWith("text/") ||
              /\.(pdf|doc|docx|txt|rtf)$/i.test(file.name)
            ? FileText
            : file.type.startsWith("image/")
              ? FileImage
              : FileIcon;
    return { extension, Icon };
  };

  const sending = isSending || isSendingFiles;

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
            type="button"
            onClick={() => setReplyTo(null)}
            className="ml-3 shrink-0 rounded-lg p-1 text-slate-400 hover:bg-[#1E293B] hover:text-white"
            aria-label="Cancel reply"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {selectedFiles.map(({ file, previewUrl }) => {
            const { extension, Icon } = getFileMetadata(file);
            return (
              <div
                key={`${file.name}:${file.size}:${file.lastModified}`}
                className="flex min-w-0 max-w-full flex-1 basis-60 items-center gap-3 rounded-xl border border-[#222C43] bg-[#111827] p-2.5"
              >
                {previewUrl && file.type.startsWith("image/") ? (
                  <Image
                    src={previewUrl}
                    alt={`Preview of ${file.name}`}
                    width={56}
                    height={56}
                    unoptimized
                    className="h-14 w-14 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-[#1B2740] text-indigo-200">
                    <Icon size={22} />
                    <span className="mt-0.5 max-w-12 truncate text-[9px] font-semibold">
                      {extension}
                    </span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-200">
                    {file.name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {extension} · {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {previewUrl && file.type.startsWith("audio/") && (
                    <audio
                      controls
                      src={previewUrl}
                      className="mt-2 h-9 w-full max-w-56"
                      aria-label={`Preview ${file.name}`}
                    />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeSelectedFile(file)}
                  disabled={sending}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-[#1E293B] hover:text-white disabled:opacity-50"
                  aria-label={`Remove ${file.name}`}
                >
                  <X size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {isSendingFiles && uploadProgress !== null && (
        <div className="mb-2 px-1">
          <div className="mb-1 flex items-center justify-between text-[10px] text-slate-400">
            <span>Uploading attachments</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-[#1B2740]">
            <div
              className="h-full rounded-full bg-indigo-500 transition-[width]"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {(error || recordingError) && (
        <p role="alert" className="mb-2 px-1 text-xs text-red-400">
          {recordingError ?? error}
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
          placeholder={
            isRecording ? "Recording voice message..." : "Type your message..."
          }
          disabled={sending || isRecording}
          className="flex-1 bg-transparent text-sm md:text-base text-white placeholder:text-slate-500 outline-none disabled:opacity-50"
        />

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip"
          onChange={handleFileChange}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending || isRecording}
          className="text-slate-400 transition hover:text-indigo-400 disabled:opacity-50"
          aria-label="Attach files"
        >
          <Paperclip size={20} />
        </button>

        <button
          type="button"
          onClick={() =>
            isRecording ? stopVoiceRecording() : void startVoiceRecording()
          }
          disabled={sending}
          className={`text-slate-400 transition hover:text-indigo-400 disabled:opacity-50 ${isRecording ? "text-red-400 hover:text-red-300" : ""}`}
          aria-label={
            isRecording ? "Stop voice recording" : "Record voice message"
          }
        >
          {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
        {isRecording && (
          <button
            type="button"
            onClick={cancelVoiceRecording}
            className="text-xs text-slate-400 hover:text-white"
            aria-label="Cancel voice recording"
          >
            Cancel
          </button>
        )}

        <button
          type="button"
          onClick={handleSend}
          disabled={
            (!text.trim() && selectedFiles.length === 0) ||
            sending ||
            isRecording
          }
          className={cn(
            "flex h-9 w-9 md:h-10 md:w-10 2xl:h-12 2xl:w-12 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 transition",
            (text.trim() || selectedFiles.length > 0) && !sending
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
