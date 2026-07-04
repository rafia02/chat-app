import type { Message } from "@/types";

/** Stable references for Zustand selectors — avoids infinite re-render loops */
export const EMPTY_STRING_ARRAY: readonly string[] = [];
export const EMPTY_MESSAGES: readonly Message[] = [];
