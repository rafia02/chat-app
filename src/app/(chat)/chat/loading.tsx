import { LoadingState } from "@/components/ui";

export default function ChatLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-[#070B14]">
      <LoadingState message="Loading chat..." />
    </div>
  );
}
