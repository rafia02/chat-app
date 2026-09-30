import type {
  Conversation,
  Message,
  MessageMedia,
  MessageReaction,
  ReplyTo,
  User,
  UserStatus,
} from "@/types";

export function avatarUrl(name: string, avatar?: string | null): string {
  if (avatar && avatar.trim()) return avatar;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "U")}&background=4F46E5&color=fff`;
}

function asId(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number")
    return String(value);
  if (typeof value === "object" && "_id" in (value as object)) {
    return String((value as { _id: unknown })._id);
  }
  if (typeof value === "object" && "id" in (value as object)) {
    return String((value as { id: unknown }).id);
  }
  return String(value);
}

function asIso(value: unknown): string {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  return new Date(String(value)).toISOString();
}

function normalizeStatus(status: unknown): UserStatus {
  if (status === "online" || status === "away" || status === "busy")
    return status;
  return "offline";
}

export function mapUser(raw: unknown): User {
  const data = (raw ?? {}) as Record<string, unknown>;
  const name = String(data.name ?? "Unknown");

  return {
    id: asId(data._id ?? data.id),
    name,
    email: String(data.email ?? ""),
    avatar: avatarUrl(name, data.avatar as string | null | undefined),
    status: normalizeStatus(data.status),
    bio: data.bio ? String(data.bio) : undefined,
  };
}

export function extractParticipantUsers(raw: unknown): User[] {
  const data = (raw ?? {}) as Record<string, unknown>;
  const participants = Array.isArray(data.participants)
    ? data.participants
    : [];

  return participants
    .filter((p) => p && typeof p === "object")
    .map((p) => mapUser(p));
}

export function mapConversation(
  raw: unknown,
  currentUserId?: string | null,
): Conversation {
  const data = (raw ?? {}) as Record<string, unknown>;
  const participants = Array.isArray(data.participants)
    ? data.participants
    : [];
  const participantUsers = extractParticipantUsers(raw);
  const participantIds = participants.map((p) => asId(p));

  const type = data.type === "group" ? "group" : "dm";
  let name = data.name ? String(data.name) : "";
  let avatar = data.avatar ? String(data.avatar) : "";

  if (type === "dm") {
    const other =
      participantUsers.find((u) => u.id !== currentUserId) ??
      participantUsers[0];
    if (!name) name = other?.name ?? "Direct message";
    if (!avatar) avatar = other?.avatar ?? "";
  }

  if (!name) name = type === "group" ? "Group chat" : "Conversation";

  return {
    id: asId(data._id ?? data.id),
    name,
    avatar: avatarUrl(name, avatar),
    type,
    participantIds,
    lastMessage: String(data.lastMessage ?? ""),
    lastMessageAt: asIso(
      data.lastMessageAt ?? data.updatedAt ?? data.createdAt,
    ),
    unreadCount: Number(data.unreadCount ?? 0),
    isOnline: false,
    requestStatus:
      data.requestStatus === "pending" || data.requestStatus === "rejected"
        ? data.requestStatus
        : "normal",
    requestedBy: data.requestedBy == null ? null : asId(data.requestedBy),
  };
}

function mapReplyTo(raw: unknown): ReplyTo | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const data = raw as Record<string, unknown>;
  if (!data.messageId && !data.content) return undefined;

  return {
    messageId: String(data.messageId ?? ""),
    senderId: String(data.senderId ?? ""),
    senderName: String(data.senderName ?? "Unknown"),
    content: String(data.content ?? ""),
  };
}

function mapMedia(raw: unknown): MessageMedia | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const data = raw as Record<string, unknown>;
  if (!data.url) return undefined;

  const type = data.type;
  const mediaType =
    type === "image" || type === "video" || type === "audio" || type === "file"
      ? type
      : "file";

  return {
    url: String(data.url),
    type: mediaType,
  };
}

export function mapMessage(raw: unknown): Message {
  const data = (raw ?? {}) as Record<string, unknown>;
  const reactionsRaw = Array.isArray(data.reactions) ? data.reactions : [];

  const reactions: MessageReaction[] = reactionsRaw.map((r) => {
    const reaction = (r ?? {}) as Record<string, unknown>;
    return {
      emoji: String(reaction.emoji ?? ""),
      userId: String(reaction.userId ?? ""),
    };
  });

  const status = data.status;
  const messageStatus =
    status === "delivered" ||
    status === "seen" ||
    status === "failed" ||
    status === "sending"
      ? status
      : "sent";

  return {
    id: asId(data._id ?? data.id),
    conversationId: asId(data.conversationId),
    senderId: asId(data.senderId),
    content: String(data.content ?? ""),
    createdAt: asIso(data.createdAt),
    status: messageStatus,
    reactions,
    replyTo: mapReplyTo(data.replyTo),
    editedAt: data.editedAt ? asIso(data.editedAt) : undefined,
    isDeleted: Boolean(data.isDeleted),
    tempId: data.tempId ? String(data.tempId) : undefined,
    media: mapMedia(data.media),
  };
}

export function mapMessages(raw: unknown): Message[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(mapMessage);
}

export function mapConversations(
  raw: unknown,
  currentUserId?: string | null,
): Conversation[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => mapConversation(item, currentUserId));
}

export function mapUsers(raw: unknown): User[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(mapUser);
}
