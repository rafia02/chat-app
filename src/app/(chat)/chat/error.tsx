"use client";

import { ErrorState } from "@/components/ui";

export default function ChatError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-screen items-center justify-center bg-[#070B14]">
      <ErrorState
        title="Failed to load chat"
        message="Something went wrong while loading the chat application."
        onRetry={reset}
      />
    </div>
  );
}
