"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks";
import { LoadingState } from "@/components/ui";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isInitialized, router]);

  if (!isInitialized || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#070B14]">
        <LoadingState message="Checking authentication..." />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
