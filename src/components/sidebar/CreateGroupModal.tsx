"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Search, Users, X } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import {
  useAuthStore,
  useChatStore,
  useUIStore,
  useUsersStore,
} from "@/stores";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CreateGroupModal({ open, onClose }: Props) {
  const router = useRouter();
  const users = useUsersStore((state) => state.directoryUsers);
  const loadingUsers = useUsersStore((state) => state.isLoading);
  const usersError = useUsersStore((state) => state.error);
  const fetchUsers = useUsersStore((state) => state.fetchUsers);
  const currentUserId = useAuthStore((state) => state.user?.id ?? "");
  const createGroup = useChatStore((state) => state.createGroup);
  const isLoading = useChatStore((state) => state.isLoadingConversations);
  const error = useChatStore((state) => state.error);
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [avatar, setAvatar] = useState<File | undefined>();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarPreviewRef = useRef<string | null>(null);

  useEffect(() => {
    if (open) void fetchUsers();
  }, [open, fetchUsers]);

  useEffect(
    () => () => {
      if (avatarPreviewRef.current)
        URL.revokeObjectURL(avatarPreviewRef.current);
    },
    [],
  );

  const handleAvatarChange = (file?: File) => {
    if (avatarPreviewRef.current) URL.revokeObjectURL(avatarPreviewRef.current);
    const preview = file ? URL.createObjectURL(file) : null;
    avatarPreviewRef.current = preview;
    setAvatarPreview(preview);
    setAvatar(file);
  };

  const filteredUsers = useMemo(() => {
    const term = query.trim().toLowerCase();
    return users
      .filter((user) => user.id !== currentUserId)
      .filter(
        (user) =>
          !term ||
          user.name.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term),
      );
  }, [users, query, currentUserId]);

  if (!open) return null;

  const selectedUsers = selectedIds
    .map((id) => users.find((user) => user.id === id))
    .filter((user) => user !== undefined);
  const canCreate =
    name.trim().length > 0 &&
    name.trim().length <= 80 &&
    selectedIds.length > 0 &&
    selectedIds.length <= 49 &&
    !isLoading;

  const toggleMember = (userId: string) => {
    setSelectedIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : current.length < 49
          ? [...current, userId]
          : current,
    );
  };

  const closeModal = () => {
    handleAvatarChange(undefined);
    setName("");
    setQuery("");
    setSelectedIds([]);
    onClose();
  };

  const handleCreate = async () => {
    if (!canCreate) return;
    const conversation = await createGroup(name.trim(), selectedIds, avatar);
    if (!conversation) return;
    closeModal();
    useUIStore.getState().openChat();
    router.push(`/chat/${conversation.id}`);
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm md:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isLoading) closeModal();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-group-title"
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#222C43] bg-[#0D1322] shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-[#222C43] px-5 py-4">
          <div>
            <h2
              id="create-group-title"
              className="text-lg font-semibold text-white"
            >
              Create group
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Add people to start a group conversation.
            </p>
          </div>
          <button
            type="button"
            onClick={closeModal}
            disabled={isLoading}
            aria-label="Close create group"
            className="rounded-lg p-2 text-slate-400 hover:bg-[#151D31] hover:text-white disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </header>

        <div className="min-h-0 space-y-4 overflow-y-auto p-5">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-300">
              Group name
            </span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value.slice(0, 80))}
              maxLength={80}
              placeholder="Name your group"
              className="h-10 w-full rounded-lg border border-[#222C43] bg-[#111827] px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-500"
            />
            <span className="mt-1 block text-right text-[10px] text-slate-500">
              {name.length}/80
            </span>
          </label>

          <div className="flex items-center gap-3">
            <Avatar
              name={name || "Group"}
              src={avatarPreview}
              className="h-12 w-12 text-sm"
            />
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#29344E] px-3 py-2 text-xs text-slate-300 hover:bg-[#151D31]">
              <ImagePlus size={16} /> Choose group image
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) =>
                  handleAvatarChange(event.target.files?.[0])
                }
              />
            </label>
            {avatar && (
              <button
                type="button"
                onClick={() => handleAvatarChange(undefined)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Remove
              </button>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">
                Members
              </span>
              <span className="text-[10px] text-slate-500">
                {selectedIds.length + 1}/50 including you
              </span>
            </div>
            {selectedUsers.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => toggleMember(user.id)}
                    className="flex max-w-full items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 py-1 pl-1 pr-2 text-xs text-indigo-100"
                  >
                    <Avatar
                      name={user.name}
                      src={user.avatar}
                      className="h-6 w-6 text-[9px]"
                    />
                    <span className="max-w-28 truncate">{user.name}</span>
                    <X size={13} />
                  </button>
                ))}
              </div>
            )}
            <div className="relative mb-2">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search people"
                className="h-9 w-full rounded-lg border border-[#222C43] bg-[#111827] pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-500"
              />
            </div>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-[#222C43] bg-[#0A0F1C]">
              {loadingUsers && users.length === 0 ? (
                <p className="p-4 text-center text-xs text-slate-400">
                  Loading people...
                </p>
              ) : usersError ? (
                <div className="p-4 text-center text-xs text-red-300">
                  <p>{usersError}</p>
                  <button
                    type="button"
                    onClick={() => void fetchUsers()}
                    className="mt-2 underline"
                  >
                    Retry
                  </button>
                </div>
              ) : filteredUsers.length === 0 ? (
                <p className="p-4 text-center text-xs text-slate-400">
                  No people found
                </p>
              ) : (
                filteredUsers.map((user) => {
                  const checked = selectedIds.includes(user.id);
                  return (
                    <label
                      key={user.id}
                      className="flex cursor-pointer items-center gap-3 border-b border-[#1B2233] px-3 py-2.5 last:border-b-0 hover:bg-[#111827]"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMember(user.id)}
                        disabled={!checked && selectedIds.length >= 49}
                        className="h-4 w-4 accent-indigo-500"
                      />
                      <Avatar
                        name={user.name}
                        src={user.avatar}
                        className="h-9 w-9 text-[10px]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-white">
                          {user.name}
                        </span>
                        <span className="block truncate text-[10px] text-slate-500">
                          {user.status}
                        </span>
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {error && (
            <p role="alert" className="text-xs text-red-400">
              {error}
            </p>
          )}
        </div>

        <footer className="flex items-center justify-between border-t border-[#222C43] px-5 py-4">
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <Users size={15} />
            {selectedIds.length} selected
          </span>
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={!canCreate}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Creating..." : "Create Group"}
          </button>
        </footer>
      </section>
    </div>
  );
}
