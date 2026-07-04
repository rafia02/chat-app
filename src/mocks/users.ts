import type { User } from "@/types";

export const CURRENT_USER: User = {
  id: "user-1",
  name: "Rafia Islam",
  email: "rafia@novachat.com",
  avatar: "https://i.pravatar.cc/150?img=20",
  status: "online",
  bio: "Building awesome chat experiences",
};

export const MOCK_USERS: User[] = [
  CURRENT_USER,
  {
    id: "user-2",
    name: "John Doe",
    email: "john@example.com",
    avatar: "https://i.pravatar.cc/150?img=11",
    status: "online",
  },
  {
    id: "user-3",
    name: "Emma Wilson",
    email: "emma@example.com",
    avatar: "https://i.pravatar.cc/150?img=32",
    status: "offline",
  },
  {
    id: "user-4",
    name: "Alex Morgan",
    email: "alex@example.com",
    avatar: "https://i.pravatar.cc/150?img=15",
    status: "online",
  },
  {
    id: "user-5",
    name: "Nathan",
    email: "nathan@example.com",
    avatar: "https://i.pravatar.cc/150?img=60",
    status: "online",
  },
  {
    id: "user-6",
    name: "Olivia Brown",
    email: "olivia@example.com",
    avatar: "https://i.pravatar.cc/150?img=45",
    status: "away",
  },
  {
    id: "user-7",
    name: "Sarah Chen",
    email: "sarah@example.com",
    avatar: "https://i.pravatar.cc/150?img=47",
    status: "online",
  },
];

export const MOCK_CREDENTIALS = {
  email: "rafia@novachat.com",
  password: "password123",
};

export function getUserById(id: string): User | undefined {
  return MOCK_USERS.find((u) => u.id === id);
}
