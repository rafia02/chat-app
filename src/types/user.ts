export type UserStatus = "online" | "offline" | "away" | "busy";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: UserStatus;
  bio?: string;
}
