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

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function filenameFromUrl(url: string): string | undefined {
  try {
    const path = new URL(url, "https://attachment.local").pathname;
    const filename = decodeURIComponent(path.split("/").pop() ?? "");
    return filename || undefined;
  } catch {
    return undefined;
  }
}

function mapMedia(raw: unknown, content: string): MessageMedia | undefined {
  const message = asRecord(raw);
  const nestedValue =
    message.media ?? message.attachment ?? message.file ?? message.image;
  const nested = asRecord(nestedValue);
  const urlValue =
    (typeof nestedValue === "string" ? nestedValue : undefined) ??
    nested.url ??
    nested.secure_url ??
    nested.path ??
    nested.fileUrl ??
    nested.src ??
    message.mediaUrl ??
    message.fileUrl ??
    message.attachmentUrl ??
    message.filePath;
  if (typeof urlValue !== "string" || !urlValue.trim()) return undefined;

  const url = urlValue.trim();
  const rawType = String(
    nested.type ?? nested.mediaType ?? nested.mimeType ?? nested.mimetype ?? "",
  ).toLowerCase();
  const type: MessageMedia["type"] =
    rawType === "image" || rawType.startsWith("image/")
      ? "image"
      : rawType === "video" || rawType.startsWith("video/")
        ? "video"
        : rawType === "audio" || rawType.startsWith("audio/")
          ? "audio"
          : "file";
  const rawName =
    nested.name ??
    nested.fileName ??
    nested.filename ??
    nested.originalName ??
    nested.originalname ??
    message.fileName ??
    message.filename;
  const contentIsFilename =
    content !== "📎 Media" && /^[^\\/]+\.[a-z0-9]{1,10}$/i.test(content.trim());

  return {
    url,
    type,
    name:
      (typeof rawName === "string" && rawName.trim()) ||
      (contentIsFilename ? content.trim() : undefined) ||
      filenameFromUrl(url),
  };
}

export function mapMessage(raw: unknown): Message {
  const data = (raw ?? {}) as Record<string, unknown>;
  const reactionsRaw = Array.isArray(data.reactions) ? data.reactions : [];
  const reactionsByUser = new Map<string, MessageReaction>();
  reactionsRaw.forEach((r) => {
    const reaction = (r ?? {}) as Record<string, unknown>;
    const mapped = {
      emoji: String(reaction.emoji ?? ""),
      userId: String(reaction.userId ?? ""),
    };
    if (mapped.emoji && mapped.userId) {
      reactionsByUser.set(mapped.userId, mapped);
    }
  });
  const reactions = Array.from(reactionsByUser.values());

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
    media: mapMedia(data, String(data.content ?? "")),
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
