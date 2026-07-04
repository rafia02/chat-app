const AUTH_KEY = "novachat_auth";

export function getStorageItem<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : null;
  } catch {
    return null;
  }
}

export function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function removeStorageItem(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
}

export function getAuthSession() {
  return getStorageItem<import("@/types").AuthSession>(AUTH_KEY);
}

export function setAuthSession(session: import("@/types").AuthSession) {
  setStorageItem(AUTH_KEY, session);
}

export function clearAuthSession() {
  removeStorageItem(AUTH_KEY);
}
