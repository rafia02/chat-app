"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks";
import { LoadingState } from "@/components/ui";

export default function HomePage() {
  const { isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized) {
      router.replace(isAuthenticated ? "/chat" : "/login");
    }
  }, [isAuthenticated, isInitialized, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-[#070B14]">
      <LoadingState message="Loading Nova Chat..." />
    </div>
  );
}
