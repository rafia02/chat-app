import type { ServiceResult, User } from "@/types";
import { http, toApiError } from "@/lib/http";
import { mapUser, mapUsers } from "@/lib/mappers";

export interface IUserService {
  getUsers(): Promise<ServiceResult<User[]>>;
  searchUsers(query: string): Promise<ServiceResult<User[]>>;
  getUserById(id: string): Promise<ServiceResult<User>>;
  updateMe(payload: Partial<Pick<User, "name" | "avatar" | "bio" | "status">>): Promise<ServiceResult<User>>;
}

class UserService implements IUserService {
  async getUsers(): Promise<ServiceResult<User[]>> {
    try {
      const { data } = await http.get<{ success: boolean; data: unknown }>(
        "/users"
      );

      if (!data.success) {
        return {
          success: false,
          error: { message: "Failed to load users", status: 400 },
        };
      }

      return { success: true, data: mapUsers(data.data) };
    } catch (error) {
      return { success: false, error: toApiError(error) };
    }
  }

  async searchUsers(query: string): Promise<ServiceResult<User[]>> {
    try {
      const trimmed = query.trim();
      if (!trimmed) {
        return { success: true, data: [] };
      }

      const { data } = await http.get<{ success: boolean; data: unknown }>(
        "/users/search",
        { params: { q: trimmed } }
      );

      if (!data.success) {
        return {
          success: false,
          error: { message: "User search failed", status: 400 },
        };
      }

      return { success: true, data: mapUsers(data.data) };
    } catch (error) {
      return { success: false, error: toApiError(error) };
    }
  }

  async getUserById(id: string): Promise<ServiceResult<User>> {
    try {
      const { data } = await http.get<{ success: boolean; data: unknown }>(
        `/users/${id}`
      );
      if (!data.success || !data.data) {
        return {
          success: false,
          error: { message: "User not found", code: "NOT_FOUND", status: 404 },
        };
      }
      return { success: true, data: mapUser(data.data) };
    } catch (error) {
      return { success: false, error: toApiError(error) };
    }
  }

  async updateMe(
    payload: Partial<Pick<User, "name" | "avatar" | "bio" | "status">>
  ): Promise<ServiceResult<User>> {
    try {
      const { data } = await http.patch<{ success: boolean; data: unknown }>(
        "/users/me",
        payload
      );

      if (!data.success || !data.data) {
        return {
          success: false,
          error: { message: "Failed to update profile", status: 400 },
        };
      }

      return { success: true, data: mapUser(data.data) };
    } catch (error) {
      return { success: false, error: toApiError(error) };
    }
  }
}

export const userService: IUserService = new UserService();
