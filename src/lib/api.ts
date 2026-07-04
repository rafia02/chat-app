export const MOCK_DELAY_MS = 600;

export function delay(ms: number = MOCK_DELAY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function simulateNetworkError(chance = 0): never {
  if (Math.random() < chance) {
    throw { message: "Network error. Please try again.", code: "NETWORK_ERROR", status: 500 };
  }
  throw new Error("Unreachable");
}
