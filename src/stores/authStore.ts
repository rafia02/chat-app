import { create } from "zustand";
import type { User, LoginCredentials, RegisterCredentials } from "@/types";
import { authService } from "@/services";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (credentials: RegisterCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,

  initialize: async () => {
    set({ isLoading: true });
    const result = await authService.getSession();
    if (result.success && result.data) {
      set({
        user: result.data.user,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
        error: null,
      });
    } else {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
        error: null,
      });
    }
  },

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    const result = await authService.login(credentials);
    if (result.success) {
      set({
        user: result.data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return true;
    }
    set({ isLoading: false, error: result.error.message });
    return false;
  },

  register: async (credentials) => {
    set({ isLoading: true, error: null });
    const result = await authService.register(credentials);
    if (result.success) {
      set({
        user: result.data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return true;
    }
    set({ isLoading: false, error: result.error.message });
    return false;
  },

  logout: async () => {
    set({ isLoading: true });
    await authService.logout();
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));
