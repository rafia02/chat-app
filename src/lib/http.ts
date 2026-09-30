import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { clearAuthSession, getAuthSession } from "@/lib/storage";
import type { ApiError } from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export const http: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const session = getAuthSession();
  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }

  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; success?: boolean }>) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ||
      error.message ||
      "Something went wrong. Please try again.";

    if (status === 401 && typeof window !== "undefined") {
      clearAuthSession();
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }

    const apiError: ApiError = {
      message,
      status,
      code: status === 401 ? "UNAUTHORIZED" : "API_ERROR",
    };

    return Promise.reject(apiError);
  }
);

export function toApiError(error: unknown): ApiError {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as ApiError).message === "string"
  ) {
    return error as ApiError;
  }

  return {
    message: "Something went wrong. Please try again.",
    code: "UNKNOWN",
  };
}
