import type { Message } from "@/types";

const today = new Date();
today.setHours(10, 18, 0, 0);

function timeAt(hours: number, minutes: number): string {
  const d = new Date(today);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

export const MOCK_MESSAGES: Record<string, Message[]> = {
  "conv-1": [
    {
      id: "msg-1-1",
      conversationId: "conv-1",
      senderId: "user-2",
      content: "Hey Rafia 👋",
      createdAt: timeAt(10, 18),
      status: "seen",
      reactions: [],
    },
    {
      id: "msg-1-2",
      conversationId: "conv-1",
      senderId: "user-2",
      content: "The new dashboard design looks really clean.",
      createdAt: timeAt(10, 19),
      status: "seen",
      reactions: [],
    },
    {
      id: "msg-1-3",
      conversationId: "conv-1",
      senderId: "user-1",
      content: "Thank you 😊 I'm trying to make it look like Discord + Linear.",
      createdAt: timeAt(10, 20),
      status: "seen",
      reactions: [{ emoji: "🔥", userId: "user-2" }],
    },
    {
      id: "msg-1-4",
      conversationId: "conv-1",
      senderId: "user-1",
      content: "Next I'll connect Socket.io.",
      createdAt: timeAt(10, 22),
      status: "delivered",
      reactions: [],
    },
    {
      id: "msg-1-5",
      conversationId: "conv-1",
      senderId: "user-2",
      content: "That's awesome 🔥",
      createdAt: timeAt(10, 24),
      status: "seen",
      reactions: [],
    },
    {
      id: "msg-1-6",
      conversationId: "conv-1",
      senderId: "user-2",
      content: "Can't wait to test realtime messaging.",
      createdAt: timeAt(10, 24),
      status: "seen",
      reactions: [],
    },
  ],
  "conv-2": [
    {
      id: "msg-2-1",
      conversationId: "conv-2",
      senderId: "user-3",
      content: "Hi Rafia! Are you free this weekend?",
      createdAt: timeAt(9, 30),
      status: "seen",
      reactions: [],
    },
    {
      id: "msg-2-2",
      conversationId: "conv-2",
      senderId: "user-1",
      content: "Hey Emma! Yes, Saturday works for me.",
      createdAt: timeAt(9, 35),
      status: "seen",
      reactions: [],
    },
    {
      id: "msg-2-3",
      conversationId: "conv-2",
      senderId: "user-3",
      content: "Sure, let's catch up tomorrow.",
      createdAt: timeAt(9, 40),
      status: "delivered",
      reactions: [],
    },
  ],
  "conv-3": [
    {
      id: "msg-3-1",
      conversationId: "conv-3",
      senderId: "user-4",
      content: "Did you see the new feature release?",
      createdAt: timeAt(8, 0),
      status: "seen",
      reactions: [],
    },
    {
      id: "msg-3-2",
      conversationId: "conv-3",
      senderId: "user-1",
      content: "Yes! The animations are smooth.",
      createdAt: timeAt(8, 5),
      status: "seen",
      reactions: [],
    },
    {
      id: "msg-3-3",
      conversationId: "conv-3",
      senderId: "user-4",
      content: "That's awesome! 🔥",
      createdAt: timeAt(8, 10),
      status: "seen",
      reactions: [{ emoji: "👍", userId: "user-1" }],
    },
  ],
  "conv-4": [
    {
      id: "msg-4-1",
      conversationId: "conv-4",
      senderId: "user-7",
      content: "Team, we need to review the migration plan.",
      createdAt: timeAt(7, 0),
      status: "seen",
      reactions: [],
    },
    {
      id: "msg-4-2",
      conversationId: "conv-4",
      senderId: "user-5",
      content: "I've prepared the rollback scripts.",
      createdAt: timeAt(7, 15),
      status: "seen",
      reactions: [],
    },
    {
      id: "msg-4-3",
      conversationId: "conv-4",
      senderId: "user-5",
      content: "We just deployed the new schema.",
      createdAt: timeAt(7, 30),
      status: "delivered",
      reactions: [],
      replyTo: {
        messageId: "msg-4-1",
        senderId: "user-7",
        senderName: "Sarah Chen",
        content: "Team, we need to review the migration plan.",
      },
    },
  ],
  "conv-5": [
    {
      id: "msg-5-1",
      conversationId: "conv-5",
      senderId: "user-1",
      content: "Hi Olivia, did you get a chance to review the proposal?",
      createdAt: timeAt(6, 0),
      status: "seen",
      reactions: [],
    },
    {
      id: "msg-5-2",
      conversationId: "conv-5",
      senderId: "user-6",
      content: "I shared the document.",
      createdAt: timeAt(6, 30),
      status: "seen",
      reactions: [],
    },
  ],
};
