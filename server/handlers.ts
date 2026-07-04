import type { Server, Socket } from "socket.io";
import type {
  Conversation,
  Message,
  MessageStatus,
  UserStatus,
} from "../src/types";
import {
  MOCK_CONVERSATIONS,
  MOCK_MESSAGES,
  USERS,
  generateId,
} from "./data";

const CLIENT_EVENTS = {
  MESSAGE_SEND: "message:send",
  MESSAGE_EDIT: "message:edit",
  MESSAGE_DELETE: "message:delete",
  MESSAGE_REACT: "message:react",
  MESSAGE_READ: "message:read",
  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",
  CONVERSATION_JOIN: "conversation:join",
  CONVERSATION_LEAVE: "conversation:leave",
  CALL_INITIATE: "call:initiate",
  CALL_ACCEPT: "call:accept",
  CALL_REJECT: "call:reject",
  CALL_END: "call:end",
  CALL_SIGNAL: "call:signal",
  PRESENCE_UPDATE: "presence:update",
} as const;

const SERVER_EVENTS = {
  MESSAGE_NEW: "message:new",
  MESSAGE_UPDATED: "message:updated",
  MESSAGE_DELETED: "message:deleted",
  MESSAGE_STATUS: "message:status",
  MESSAGE_REACTION: "message:reaction",
  CONVERSATION_UPDATED: "conversation:updated",
  TYPING_UPDATE: "typing:update",
  PRESENCE_UPDATE: "presence:update",
  NOTIFICATION_NEW: "notification:new",
  CALL_INCOMING: "call:incoming",
  CALL_ACCEPTED: "call:accepted",
  CALL_REJECTED: "call:rejected",
  CALL_ENDED: "call:ended",
  CALL_SIGNAL: "call:signal",
  ONLINE_USERS: "presence:online-users",
} as const;

// In-memory state
let conversations: Conversation[] = JSON.parse(JSON.stringify(MOCK_CONVERSATIONS));
let messages: Record<string, Message[]> = JSON.parse(JSON.stringify(MOCK_MESSAGES));
const typingUsers = new Map<string, Set<string>>();
const userSockets = new Map<string, string>();
const socketUsers = new Map<string, string>();
const activeCalls = new Map<string, {
  id: string;
  type: "voice" | "video";
  callerId: string;
  calleeId: string;
  conversationId: string;
  status: string;
}>();

const AUTO_REPLIES: Record<string, string[]> = {
  "user-2": [
    "That sounds great! 👍",
    "I'll check it out right now.",
    "Let me know when you're ready to test.",
    "Awesome work on the UI! 🔥",
  ],
  "user-3": ["Sounds good!", "See you then!", "Looking forward to it 😊"],
  "user-4": ["Nice!", "Cool feature!", "Love the animations!"],
};

function getConversation(convId: string) {
  return conversations.find((c) => c.id === convId);
}

function updateConversationPreview(convId: string, content: string, senderId: string) {
  conversations = conversations.map((c) => {
    if (c.id !== convId) return c;
    const sender = USERS[senderId];
    const preview =
      c.type === "group" && sender ? `${sender.name}: ${content}` : content;
    return {
      ...c,
      lastMessage: preview,
      lastMessageAt: new Date().toISOString(),
    };
  });
}

function broadcastConversationUpdate(io: Server, convId: string) {
  const conv = getConversation(convId);
  if (!conv) return;
  io.emit(SERVER_EVENTS.CONVERSATION_UPDATED, conv);
}

function getOtherParticipant(conv: Conversation, userId: string): string | undefined {
  return conv.participantIds.find((id) => id !== userId);
}

function simulateStatusUpdates(
  io: Server,
  message: Message,
  recipientIds: string[]
) {
  setTimeout(() => {
    message.status = "delivered";
    recipientIds.forEach((uid) => {
      const sid = userSockets.get(uid);
      if (sid) {
        io.to(sid).emit(SERVER_EVENTS.MESSAGE_STATUS, {
          messageId: message.id,
          conversationId: message.conversationId,
          status: "delivered" as MessageStatus,
        });
      }
    });
    io.emit(SERVER_EVENTS.MESSAGE_STATUS, {
      messageId: message.id,
      conversationId: message.conversationId,
      status: "delivered" as MessageStatus,
    });
  }, 600);

  setTimeout(() => {
    message.status = "seen";
    io.emit(SERVER_EVENTS.MESSAGE_STATUS, {
      messageId: message.id,
      conversationId: message.conversationId,
      status: "seen" as MessageStatus,
    });
  }, 1800);
}

function scheduleAutoReply(io: Server, convId: string, senderId: string) {
  const conv = getConversation(convId);
  if (!conv || conv.type === "group") return;

  const otherId = getOtherParticipant(conv, senderId);
  if (!otherId || !AUTO_REPLIES[otherId]) return;

  const replies = AUTO_REPLIES[otherId];
  const replyText = replies[Math.floor(Math.random() * replies.length)];

  setTimeout(() => {
    const reply: Message = {
      id: generateId("msg"),
      conversationId: convId,
      senderId: otherId,
      content: replyText,
      createdAt: new Date().toISOString(),
      status: "delivered",
      reactions: [],
    };

    if (!messages[convId]) messages[convId] = [];
    messages[convId].push(reply);

    conversations = conversations.map((c) =>
      c.id === convId
        ? { ...c, unreadCount: c.unreadCount + 1, lastMessage: replyText, lastMessageAt: reply.createdAt }
        : c
    );

    io.to(`conversation:${convId}`).emit(SERVER_EVENTS.MESSAGE_NEW, reply);
    io.emit(SERVER_EVENTS.CONVERSATION_UPDATED, getConversation(convId));

    const sender = USERS[otherId];
    io.emit(SERVER_EVENTS.NOTIFICATION_NEW, {
      conversationId: convId,
      message: reply,
      senderName: sender?.name ?? "Unknown",
    });
  }, 2000 + Math.random() * 3000);
}

function broadcastPresence(io: Server) {
  const onlineUserIds = [...userSockets.keys()];
  io.emit(SERVER_EVENTS.ONLINE_USERS, onlineUserIds);

  conversations = conversations.map((c) => {
    if (c.type !== "dm") return c;
    const otherId = c.participantIds.find((id) => id !== "user-1");
    return {
      ...c,
      isOnline: otherId ? onlineUserIds.includes(otherId) || Object.keys(USERS).includes(otherId) : false,
    };
  });

  onlineUserIds.forEach((uid) => {
    if (USERS[uid]) USERS[uid].status = "online";
    io.emit(SERVER_EVENTS.PRESENCE_UPDATE, { userId: uid, status: "online" as UserStatus });
  });
}

export function setupSocketHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    const auth = socket.handshake.auth as { userId?: string; token?: string };
    const userId = auth.userId ?? "user-1";

    userSockets.set(userId, socket.id);
    socketUsers.set(socket.id, userId);

    if (USERS[userId]) USERS[userId].status = "online";

    socket.join(`user:${userId}`);
    broadcastPresence(io);

    // Join all user conversations
    conversations
      .filter((c) => c.participantIds.includes(userId))
      .forEach((c) => socket.join(`conversation:${c.id}`));

    socket.on(CLIENT_EVENTS.CONVERSATION_JOIN, (convId: string) => {
      socket.join(`conversation:${convId}`);
    });

    socket.on(CLIENT_EVENTS.CONVERSATION_LEAVE, (convId: string) => {
      socket.leave(`conversation:${convId}`);
    });

    socket.on(CLIENT_EVENTS.MESSAGE_SEND, (payload: {
      conversationId: string;
      content: string;
      replyTo?: Message["replyTo"];
      tempId?: string;
    }) => {
      const message: Message = {
        id: generateId("msg"),
        conversationId: payload.conversationId,
        senderId: userId,
        content: payload.content,
        createdAt: new Date().toISOString(),
        status: "sent",
        reactions: [],
        replyTo: payload.replyTo,
        tempId: payload.tempId,
      };

      if (!messages[payload.conversationId]) messages[payload.conversationId] = [];
      messages[payload.conversationId].push(message);
      updateConversationPreview(payload.conversationId, payload.content, userId);

      io.to(`conversation:${payload.conversationId}`).emit(SERVER_EVENTS.MESSAGE_NEW, message);
      broadcastConversationUpdate(io, payload.conversationId);

      const conv = getConversation(payload.conversationId);
      const recipients = conv?.participantIds.filter((id) => id !== userId) ?? [];
      simulateStatusUpdates(io, message, recipients);
      scheduleAutoReply(io, payload.conversationId, userId);
    });

    socket.on(CLIENT_EVENTS.MESSAGE_EDIT, (payload: {
      messageId: string;
      conversationId: string;
      content: string;
    }) => {
      const msgs = messages[payload.conversationId];
      if (!msgs) return;
      const msg = msgs.find((m) => m.id === payload.messageId);
      if (!msg || msg.senderId !== userId) return;

      msg.content = payload.content;
      msg.editedAt = new Date().toISOString();

      io.to(`conversation:${payload.conversationId}`).emit(SERVER_EVENTS.MESSAGE_UPDATED, msg);
    });

    socket.on(CLIENT_EVENTS.MESSAGE_DELETE, (payload: {
      messageId: string;
      conversationId: string;
    }) => {
      const msgs = messages[payload.conversationId];
      if (!msgs) return;
      const msg = msgs.find((m) => m.id === payload.messageId);
      if (!msg || msg.senderId !== userId) return;

      msg.isDeleted = true;
      msg.content = "This message was deleted";

      io.to(`conversation:${payload.conversationId}`).emit(SERVER_EVENTS.MESSAGE_DELETED, {
        messageId: payload.messageId,
        conversationId: payload.conversationId,
      });
    });

    socket.on(CLIENT_EVENTS.MESSAGE_REACT, (payload: {
      messageId: string;
      conversationId: string;
      emoji: string;
    }) => {
      const msgs = messages[payload.conversationId];
      if (!msgs) return;
      const msg = msgs.find((m) => m.id === payload.messageId);
      if (!msg) return;

      const existing = msg.reactions.findIndex(
        (r) => r.emoji === payload.emoji && r.userId === userId
      );
      if (existing >= 0) {
        msg.reactions.splice(existing, 1);
      } else {
        msg.reactions.push({ emoji: payload.emoji, userId });
      }

      io.to(`conversation:${payload.conversationId}`).emit(SERVER_EVENTS.MESSAGE_REACTION, { ...msg });
    });

    socket.on(CLIENT_EVENTS.MESSAGE_READ, (payload: {
      conversationId: string;
      messageIds: string[];
    }) => {
      conversations = conversations.map((c) =>
        c.id === payload.conversationId ? { ...c, unreadCount: 0 } : c
      );

      payload.messageIds.forEach((msgId) => {
        const msgs = messages[payload.conversationId];
        const msg = msgs?.find((m) => m.id === msgId);
        if (msg && msg.senderId !== userId) {
          msg.status = "seen";
          io.emit(SERVER_EVENTS.MESSAGE_STATUS, {
            messageId: msgId,
            conversationId: payload.conversationId,
            status: "seen" as MessageStatus,
          });
        }
      });

      broadcastConversationUpdate(io, payload.conversationId);
    });

    socket.on(CLIENT_EVENTS.TYPING_START, (payload: { conversationId: string }) => {
      if (!typingUsers.has(payload.conversationId)) {
        typingUsers.set(payload.conversationId, new Set());
      }
      typingUsers.get(payload.conversationId)!.add(userId);

      socket.to(`conversation:${payload.conversationId}`).emit(SERVER_EVENTS.TYPING_UPDATE, {
        conversationId: payload.conversationId,
        userId,
        isTyping: true,
      });
    });

    socket.on(CLIENT_EVENTS.TYPING_STOP, (payload: { conversationId: string }) => {
      typingUsers.get(payload.conversationId)?.delete(userId);
      socket.to(`conversation:${payload.conversationId}`).emit(SERVER_EVENTS.TYPING_UPDATE, {
        conversationId: payload.conversationId,
        userId,
        isTyping: false,
      });
    });

    socket.on(CLIENT_EVENTS.PRESENCE_UPDATE, (payload: { status: UserStatus }) => {
      if (USERS[userId]) USERS[userId].status = payload.status;
      io.emit(SERVER_EVENTS.PRESENCE_UPDATE, { userId, status: payload.status });
    });

    // Call handlers
    socket.on(CLIENT_EVENTS.CALL_INITIATE, (payload: {
      conversationId: string;
      calleeId: string;
      type: "voice" | "video";
    }) => {
      const callId = generateId("call");
      const caller = USERS[userId];
      const call = {
        id: callId,
        type: payload.type,
        callerId: userId,
        calleeId: payload.calleeId,
        conversationId: payload.conversationId,
        status: "ringing",
      };
      activeCalls.set(callId, call);

      const calleeSocket = userSockets.get(payload.calleeId);
      if (calleeSocket) {
        io.to(calleeSocket).emit(SERVER_EVENTS.CALL_INCOMING, {
          ...call,
          callerName: caller?.name ?? "Unknown",
          callerAvatar: caller?.avatar ?? "",
        });
      } else {
        // Simulate callee is online via bot - auto accept for demo after delay
        setTimeout(() => {
          io.to(socket.id).emit(SERVER_EVENTS.CALL_ACCEPTED, { callId, conversationId: payload.conversationId });
        }, 2000);
      }
    });

    socket.on(CLIENT_EVENTS.CALL_ACCEPT, (payload: { callId: string }) => {
      const call = activeCalls.get(payload.callId);
      if (!call) return;
      call.status = "connected";
      const callerSocket = userSockets.get(call.callerId);
      if (callerSocket) {
        io.to(callerSocket).emit(SERVER_EVENTS.CALL_ACCEPTED, { callId: payload.callId, conversationId: call.conversationId });
      }
      io.to(socket.id).emit(SERVER_EVENTS.CALL_ACCEPTED, { callId: payload.callId, conversationId: call.conversationId });
    });

    socket.on(CLIENT_EVENTS.CALL_REJECT, (payload: { callId: string }) => {
      const call = activeCalls.get(payload.callId);
      if (!call) return;
      const callerSocket = userSockets.get(call.callerId);
      if (callerSocket) {
        io.to(callerSocket).emit(SERVER_EVENTS.CALL_REJECTED, { callId: payload.callId });
      }
      activeCalls.delete(payload.callId);
    });

    socket.on(CLIENT_EVENTS.CALL_END, (payload: { callId: string }) => {
      const call = activeCalls.get(payload.callId);
      if (!call) return;
      [call.callerId, call.calleeId].forEach((uid) => {
        const sid = userSockets.get(uid);
        if (sid) io.to(sid).emit(SERVER_EVENTS.CALL_ENDED, { callId: payload.callId });
      });
      activeCalls.delete(payload.callId);
    });

    socket.on(CLIENT_EVENTS.CALL_SIGNAL, (payload: {
      callId: string;
      signal: RTCSessionDescriptionInit | RTCIceCandidateInit;
      targetUserId: string;
    }) => {
      const targetSocket = userSockets.get(payload.targetUserId);
      if (targetSocket) {
        io.to(targetSocket).emit(SERVER_EVENTS.CALL_SIGNAL, {
          callId: payload.callId,
          signal: payload.signal,
          fromUserId: userId,
        });
      }
    });

    socket.on("disconnect", () => {
      const uid = socketUsers.get(socket.id);
      if (uid) {
        userSockets.delete(uid);
        socketUsers.delete(socket.id);
        if (USERS[uid]) USERS[uid].status = "offline";
        io.emit(SERVER_EVENTS.PRESENCE_UPDATE, { userId: uid, status: "offline" as UserStatus });
      }
      broadcastPresence(io);
    });
  });
}
