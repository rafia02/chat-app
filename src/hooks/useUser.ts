"use client";

import { useEffect, useMemo } from "react";
import { useUsersStore } from "@/stores";
import type { User } from "@/types";

export function useUser(userId: string | undefined | null): User | undefined {
  const user = useUsersStore((s) => (userId ? s.usersById[userId] : undefined));
  const ensureUser = useUsersStore((s) => s.ensureUser);

  useEffect(() => {
    if (userId && !user) {
      void ensureUser(userId);
    }
  }, [userId, user, ensureUser]);

  return user;
}

export function useUserNames(userIds: string[]): string[] {
  const usersById = useUsersStore((s) => s.usersById);
  const ensureUser = useUsersStore((s) => s.ensureUser);
  const idsKey = userIds.join(",");

  useEffect(() => {
    const ids = idsKey ? idsKey.split(",") : [];
    ids.forEach((id) => {
      if (id && !useUsersStore.getState().usersById[id]) {
        void ensureUser(id);
      }
    });
  }, [idsKey, ensureUser]);

  return useMemo(
    () =>
      userIds
        .map((id) => usersById[id]?.name?.split(" ")[0])
        .filter(Boolean) as string[],
    [userIds, usersById]
  );
}
