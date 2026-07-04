import { Conversation } from "@/types/conversation";

export const conversations: Conversation[] = [
  {
    id: 1,
    name: "John Doe",
    avatar: "https://i.pravatar.cc/150?img=11",
    lastMessage: "Hey! How are you doing?",
    time: "2m ago",
    unread: 2,
    online: true,
  },
  {
    id: 2,
    name: "Emma Wilson",
    avatar: "https://i.pravatar.cc/150?img=32",
    lastMessage: "Sure, let's catch up tomorrow.",
    time: "5m ago",
    unread: 1,
    online: false,
  },
  {
    id: 3,
    name: "Alex Morgan",
    avatar: "https://i.pravatar.cc/150?img=15",
    lastMessage: "That's awesome! 🔥",
    time: "1h ago",
    unread: 0,
    online: true,
  },
  {
    id: 4,
    name: "Database Team",
    avatar: "https://i.pravatar.cc/150?img=60",
    lastMessage: "Nathan: We just deployed...",
    time: "2h ago",
    unread: 4,
    online: true,
  },
  {
    id: 5,
    name: "Olivia Brown",
    avatar: "https://i.pravatar.cc/150?img=45",
    lastMessage: "I shared the document.",
    time: "3h ago",
    unread: 0,
    online: false,
  },
];
