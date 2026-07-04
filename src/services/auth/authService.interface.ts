import type {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  AuthSession,
  ServiceResult,
  User,
} from "@/types";

export interface IAuthService {
  login(credentials: LoginCredentials): Promise<ServiceResult<AuthResponse>>;
  register(credentials: RegisterCredentials): Promise<ServiceResult<AuthResponse>>;
  logout(): Promise<ServiceResult<void>>;
  getSession(): Promise<ServiceResult<AuthSession | null>>;
  getCurrentUser(): Promise<ServiceResult<User>>;
}
