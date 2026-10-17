"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Search, Shield, UserMinus, Users, X } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { useAuthStore, useChatStore, useUsersStore } from "@/stores";

interface Props {
  conversationId: string;
  onClose: () => void;
  onLeft: () => void;
}

const EMPTY_PARTICIPANTS: string[] = [];

export default function GroupDetailsModal({
  conversationId,
  onClose,
  onLeft,
}: Props) {
  const userId = useAuthStore((state) => state.user?.id ?? "");
  const conversation = useChatStore((state) =>
    state.conversations.find((item) => item.id === conversationId),
  );
  const refreshConversation = useChatStore(
    (state) => state.refreshConversation,
  );
  const updateGroup = useChatStore((state) => state.updateGroup);
  const addGroupMembers = useChatStore((state) => state.addGroupMembers);
  const removeGroupMember = useChatStore((state) => state.removeGroupMember);
  const leaveGroup = useChatStore((state) => state.leaveGroup);
  const error = useChatStore((state) => state.error);
  const usersById = useUsersStore((state) => state.usersById);
  const directoryUsers = useUsersStore((state) => state.directoryUsers);
  const fetchUsers = useUsersStore((state) => state.fetchUsers);
  const ensureUser = useUsersStore((state) => state.ensureUser);
  const [name, setName] = useState(conversation?.name ?? "");
  const [avatar, setAvatar] = useState<File>();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarPreviewRef = useRef<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void refreshConversation(conversationId);
    void fetchUsers();
  }, [conversationId, refreshConversation, fetchUsers]);

  useEffect(() => {
    conversation?.participantIds.forEach((id) => {
      if (!usersById[id]) void ensureUser(id);
    });
  }, [conversation?.participantIds, usersById, ensureUser]);

  useEffect(
    () => () => {
      if (avatarPreviewRef.current)
        URL.revokeObjectURL(avatarPreviewRef.current);
    },
    [],
  );

  const participantIds = conversation?.participantIds ?? EMPTY_PARTICIPANTS;
  const adminIds = conversation?.adminIds ?? [];
  const isAdmin =
    adminIds.includes(userId) ||
    (adminIds.length === 0 &&
      (conversation?.createdBy === userId || participantIds[0] === userId));
  const filteredUsers = useMemo(() => {
    const term = query.trim().toLowerCase();
    const currentMembers = new Set(participantIds);
    return directoryUsers
      .filter((user) => user.id !== userId && !currentMembers.has(user.id))
      .filter(
        (user) =>
          !term ||
          user.name.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term),
      );
  }, [directoryUsers, participantIds, query, userId]);

  const toggleSelected = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : current.length + participantIds.length < 50
          ? [...current, id]
          : current,
    );
  };

  const handleAvatarChange = (file?: File) => {
    if (avatarPreviewRef.current) URL.revokeObjectURL(avatarPreviewRef.current);
    const preview = file ? URL.createObjectURL(file) : null;
    avatarPreviewRef.current = preview;
    setAvatarPreview(preview);
    setAvatar(file);
  };

  const saveDetails = async () => {
    if (!name.trim() || name.trim().length > 80 || saving) return;
    setSaving(true);
    const ok = await updateGroup(conversationId, {
      name: name.trim() !== conversation?.name ? name.trim() : undefined,
      avatar,
    });
    setSaving(false);
    if (ok) handleAvatarChange(undefined);
  };

  const addMembers = async () => {
    if (selectedIds.length === 0 || saving) return;
    setSaving(true);
    const ok = await addGroupMembers(conversationId, selectedIds);
    setSaving(false);
    if (ok) setSelectedIds([]);
  };

  const leave = async () => {
    if (saving || !window.confirm("Leave this group?")) return;
    setSaving(true);
    const ok = await leaveGroup(conversationId);
    setSaving(false);
    if (ok) onLeft();
  };

  if (!conversation) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm md:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="group-details-title"
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#222C43] bg-[#0D1322] shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-[#222C43] px-5 py-4">
          <div>
            <h2
              id="group-details-title"
              className="text-lg font-semibold text-white"
            >
              Group information
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
              <Users size={14} />
              {participantIds.length} members
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close group details"
            className="rounded-lg p-2 text-slate-400 hover:bg-[#151D31] hover:text-white"
          >
            <X size={18} />
          </button>
        </header>

        <div className="min-h-0 space-y-5 overflow-y-auto p-5">
          <div className="flex items-center gap-3">
            <Avatar
              name={conversation.name}
              src={avatarPreview ?? conversation.avatar}
              className="h-14 w-14 text-base"
            />
            <div className="min-w-0 flex-1">
              {isAdmin ? (
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value.slice(0, 80))}
                  maxLength={80}
                  className="h-10 w-full rounded-lg border border-[#222C43] bg-[#111827] px-3 text-sm text-white outline-none focus:border-indigo-500"
                  aria-label="Group name"
                />
              ) : (
                <p className="truncate text-base font-semibold text-white">
                  {conversation.name}
                </p>
              )}
              {isAdmin && (
                <label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-xs text-slate-400 hover:text-white">
                  <ImagePlus size={14} /> Change image
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) =>
                      handleAvatarChange(event.target.files?.[0])
                    }
                  />
                </label>
              )}
            </div>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => void saveDetails()}
              disabled={saving || !name.trim()}
              className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save group details"}
            </button>
          )}

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">Members</h3>
              <span className="text-[10px] text-slate-500">
                {participantIds.length}/50
              </span>
            </div>
            <div className="divide-y divide-[#1B2233] rounded-xl border border-[#222C43] bg-[#0A0F1C] px-3">
              {participantIds.map((id) => {
                const member =
                  usersById[id] ??
                  conversation.participants?.find((item) => item.id === id) ??
                  directoryUsers.find((item) => item.id === id);
                const memberName = member?.name ?? "Loading member...";
                const memberIsAdmin =
                  adminIds.includes(id) ||
                  (adminIds.length === 0 &&
                    (conversation.createdBy === id ||
                      participantIds[0] === id));
                return (
                  <div key={id} className="flex items-center gap-3 py-2.5">
                    <Avatar
                      name={memberName}
                      src={member?.avatar}
                      className="h-9 w-9 text-[10px]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-slate-200">
                        {memberName}
                        {id === userId ? " (you)" : ""}
                      </p>
                    </div>
                    {memberIsAdmin && (
                      <span className="flex items-center gap-1 text-[10px] text-indigo-300">
                        <Shield size={12} />
                        Admin
                      </span>
                    )}
                    {isAdmin && id !== userId && (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Remove ${memberName} from this group?`,
                            )
                          ) {
                            setSaving(true);
                            void removeGroupMember(conversationId, id).finally(
                              () => setSaving(false),
                            );
                          }
                        }}
                        aria-label={`Remove ${memberName}`}
                        className="rounded-lg p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
                      >
                        <UserMinus size={15} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {isAdmin && participantIds.length < 50 && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-white">
                Add members
              </h3>
              {selectedIds.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {selectedIds.map((id) => {
                    const user =
                      usersById[id] ??
                      directoryUsers.find((item) => item.id === id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleSelected(id)}
                        className="max-w-full truncate rounded-full bg-indigo-500/10 px-2.5 py-1 text-[11px] text-indigo-200"
                      >
                        {user?.name ?? "Selected user"} ×
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="relative mb-2">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search people"
                  className="h-9 w-full rounded-lg border border-[#222C43] bg-[#111827] pl-9 pr-3 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div className="max-h-36 overflow-y-auto rounded-lg border border-[#222C43] bg-[#0A0F1C]">
                {filteredUsers.length === 0 ? (
                  <p className="p-3 text-center text-xs text-slate-500">
                    No other users found
                  </p>
                ) : (
                  filteredUsers.map((user) => (
                    <label
                      key={user.id}
                      className="flex cursor-pointer items-center gap-3 border-b border-[#1B2233] px-3 py-2 last:border-0 hover:bg-[#111827]"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(user.id)}
                        onChange={() => toggleSelected(user.id)}
                        disabled={
                          !selectedIds.includes(user.id) &&
                          selectedIds.length + participantIds.length >= 50
                        }
                        className="h-4 w-4 accent-indigo-500"
                      />
                      <Avatar
                        name={user.name}
                        src={user.avatar}
                        className="h-8 w-8 text-[9px]"
                      />
                      <span className="truncate text-xs text-slate-200">
                        {user.name}
                      </span>
                    </label>
                  ))
                )}
              </div>
              <button
                type="button"
                onClick={() => void addMembers()}
                disabled={saving || selectedIds.length === 0}
                className="mt-2 rounded-lg border border-[#29344E] px-3 py-2 text-xs text-slate-200 hover:bg-[#151D31] disabled:opacity-50"
              >
                {saving
                  ? "Updating..."
                  : `Add ${selectedIds.length || ""} member${selectedIds.length === 1 ? "" : "s"}`}
              </button>
            </div>
          )}

          {error && (
            <p role="alert" className="text-xs text-red-400">
              {error}
            </p>
          )}
        </div>

        <footer className="border-t border-[#222C43] px-5 py-4">
          <button
            type="button"
            onClick={() => void leave()}
            disabled={saving}
            className="rounded-lg border border-red-500/30 px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-500/10 disabled:opacity-50"
          >
            Leave group
          </button>
        </footer>
      </section>
    </div>
  );
}
