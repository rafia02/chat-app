"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks";
import { LoadingState } from "@/components/ui";

export default function GuestGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.replace("/chat");
    }
  }, [isAuthenticated, isInitialized, router]);

  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#070B14]">
        <LoadingState />
      </div>
    );
  }

  if (isAuthenticated) return null;

  return <>{children}</>;
}
