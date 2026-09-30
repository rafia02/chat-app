import { create } from "zustand";
import type { User, UserStatus } from "@/types";
import { userService } from "@/services/user/userService";
import { getAuthSession, setAuthSession } from "@/lib/storage";
import { useAuthStore } from "@/stores/authStore";

interface UsersState {
  usersById: Record<string, User>;
  directoryUsers: User[];
  searchResults: User[];
  isLoading: boolean;
  error: string | null;
  upsertUser: (user: User) => void;
  upsertUsers: (users: User[]) => void;
  setUserStatus: (userId: string, status: UserStatus) => void;
  getUser: (id: string) => User | undefined;
  ensureUser: (id: string) => Promise<User | undefined>;
  fetchUsers: () => Promise<User[]>;
  searchUsers: (query: string) => Promise<User[]>;
  updateMe: (
    payload: Partial<Pick<User, "name" | "avatar" | "bio" | "status">>,
  ) => Promise<User | null>;
  clearError: () => void;
}

let latestSearchId = 0;

export const useUsersStore = create<UsersState>((set, get) => ({
  usersById: {},
  directoryUsers: [],
  searchResults: [],
  isLoading: false,
  error: null,

  upsertUser: (user) => {
    if (!user?.id) return;
    set((state) => ({
      usersById: { ...state.usersById, [user.id]: user },
    }));
  },

  upsertUsers: (users) => {
    if (!users.length) return;
    set((state) => {
      const next = { ...state.usersById };
      for (const user of users) {
        if (user?.id) next[user.id] = user;
      }
      return { usersById: next };
    });
  },

  getUser: (id) => get().usersById[id],

  ensureUser: async (id) => {
    if (!id) return undefined;
    const cached = get().usersById[id];
    if (cached) return cached;

    const result = await userService.getUserById(id);
    if (result.success) {
      get().upsertUser(result.data);
      return result.data;
    }
    return undefined;
  },

  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    const result = await userService.getUsers();
    if (result.success) {
      get().upsertUsers(result.data);
      set({ isLoading: false, directoryUsers: result.data });
      return result.data;
    }
    set({ isLoading: false, error: result.error.message, directoryUsers: [] });
    return [];
  },

  setUserStatus: (userId, status) => {
    const update = (user: User) =>
      user.id === userId ? { ...user, status } : user;
    set((state) => ({
      usersById: state.usersById[userId]
        ? { ...state.usersById, [userId]: update(state.usersById[userId]) }
        : state.usersById,
      directoryUsers: state.directoryUsers.map(update),
      searchResults: state.searchResults.map(update),
    }));
  },

  searchUsers: async (query) => {
    const searchId = ++latestSearchId;
    if (!query.trim()) {
      set({ searchResults: [], isLoading: false, error: null });
      return [];
    }
    set({ isLoading: true, error: null });
    const result = await userService.searchUsers(query);
    if (result.success) {
      get().upsertUsers(result.data);
      if (searchId === latestSearchId) {
        set({ isLoading: false, searchResults: result.data });
      }
      return result.data;
    }
    if (searchId === latestSearchId) {
      set({ isLoading: false, error: result.error.message, searchResults: [] });
    }
    return [];
  },

  updateMe: async (payload) => {
    set({ isLoading: true, error: null });
    const result = await userService.updateMe(payload);
    if (!result.success) {
      set({ isLoading: false, error: result.error.message });
      return null;
    }

    get().upsertUser(result.data);

    const session = getAuthSession();
    if (session?.user.id === result.data.id) {
      const nextSession = { ...session, user: result.data };
      setAuthSession(nextSession);
      useAuthStore.setState({
        user: result.data,
        isAuthenticated: true,
      });
    }

    set({ isLoading: false, error: null });
    return result.data;
  },

  clearError: () => set({ error: null }),
}));
