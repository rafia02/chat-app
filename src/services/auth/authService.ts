import type {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  AuthSession,
  ServiceResult,
  User,
} from "@/types";
import type { IAuthService } from "./authService.interface";
import { http, toApiError } from "@/lib/http";
import { mapUser } from "@/lib/mappers";
import {
  clearAuthSession,
  getAuthSession,
  setAuthSession,
} from "@/lib/storage";

interface BackendAuthPayload {
  user: unknown;
  token: string;
}

class AuthService implements IAuthService {
  async login(
    credentials: LoginCredentials
  ): Promise<ServiceResult<AuthResponse>> {
    try {
      const { data } = await http.post<{
        success: boolean;
        data: BackendAuthPayload;
        message?: string;
      }>("/auth/login", credentials);

      if (!data.success || !data.data) {
        return {
          success: false,
          error: { message: data.message ?? "Login failed", status: 400 },
        };
      }

      const response: AuthResponse = {
        user: mapUser(data.data.user),
        token: data.data.token,
      };

      setAuthSession(response);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: toApiError(error) };
    }
  }

  async register(
    credentials: RegisterCredentials
  ): Promise<ServiceResult<AuthResponse>> {
    try {
      const { data } = await http.post<{
        success: boolean;
        data: BackendAuthPayload;
        message?: string;
      }>("/auth/register", credentials);

      if (!data.success || !data.data) {
        return {
          success: false,
          error: { message: data.message ?? "Registration failed", status: 400 },
        };
      }

      const response: AuthResponse = {
        user: mapUser(data.data.user),
        token: data.data.token,
      };

      setAuthSession(response);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: toApiError(error) };
    }
  }

  async logout(): Promise<ServiceResult<void>> {
    clearAuthSession();
    return { success: true, data: undefined };
  }

  async getSession(): Promise<ServiceResult<AuthSession | null>> {
    const session = getAuthSession();
    if (!session?.token) {
      return { success: true, data: null };
    }

    try {
      const { data } = await http.get<{ success: boolean; data: unknown }>(
        "/auth/me"
      );

      if (!data.success || !data.data) {
        clearAuthSession();
        return { success: true, data: null };
      }

      const user = mapUser(data.data);
      const nextSession: AuthSession = { user, token: session.token };
      setAuthSession(nextSession);
      return { success: true, data: nextSession };
    } catch {
      clearAuthSession();
      return { success: true, data: null };
    }
  }

  async getCurrentUser(): Promise<ServiceResult<User>> {
    try {
      const { data } = await http.get<{ success: boolean; data: unknown }>(
        "/auth/me"
      );

      if (!data.success || !data.data) {
        return {
          success: false,
          error: { message: "Not authenticated", code: "UNAUTHORIZED", status: 401 },
        };
      }

      return { success: true, data: mapUser(data.data) };
    } catch (error) {
      return { success: false, error: toApiError(error) };
    }
  }
}

export const authService: IAuthService = new AuthService();
