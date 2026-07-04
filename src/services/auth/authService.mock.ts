import type {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  AuthSession,
  ServiceResult,
  User,
} from "@/types";
import type { IAuthService } from "./authService.interface";
import {
  CURRENT_USER,
  MOCK_CREDENTIALS,
  MOCK_USERS,
} from "@/mocks/users";
import { delay, generateId } from "@/lib/api";
import {
  getAuthSession,
  setAuthSession,
  clearAuthSession,
} from "@/lib/storage";

class MockAuthService implements IAuthService {
  async login(
    credentials: LoginCredentials
  ): Promise<ServiceResult<AuthResponse>> {
    await delay();

    const user = MOCK_USERS.find((u) => u.email === credentials.email);

    if (!user || credentials.password !== MOCK_CREDENTIALS.password) {
      return {
        success: false,
        error: { message: "Invalid email or password", code: "INVALID_CREDENTIALS", status: 401 },
      };
    }

    const response: AuthResponse = {
      user,
      token: generateId("token"),
    };

    setAuthSession(response);
    return { success: true, data: response };
  }

  async register(
    credentials: RegisterCredentials
  ): Promise<ServiceResult<AuthResponse>> {
    await delay(800);

    const exists = MOCK_USERS.some((u) => u.email === credentials.email);
    if (exists) {
      return {
        success: false,
        error: { message: "Email already registered", code: "EMAIL_EXISTS", status: 409 },
      };
    }

    const newUser: User = {
      id: generateId("user"),
      name: credentials.name,
      email: credentials.email,
      avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(credentials.email)}`,
      status: "online",
    };

    MOCK_USERS.push(newUser);

    const response: AuthResponse = {
      user: newUser,
      token: generateId("token"),
    };

    setAuthSession(response);
    return { success: true, data: response };
  }

  async logout(): Promise<ServiceResult<void>> {
    await delay(300);
    clearAuthSession();
    return { success: true, data: undefined };
  }

  async getSession(): Promise<ServiceResult<AuthSession | null>> {
    await delay(200);
    const session = getAuthSession();
    return { success: true, data: session };
  }

  async getCurrentUser(): Promise<ServiceResult<User>> {
    await delay(200);
    const session = getAuthSession();
    if (!session) {
      return {
        success: false,
        error: { message: "Not authenticated", code: "UNAUTHORIZED", status: 401 },
      };
    }
    return { success: true, data: session.user };
  }
}

export const authService: IAuthService = new MockAuthService();
