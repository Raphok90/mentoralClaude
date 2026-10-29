import { hhmm } from "./dates";
import type { Booking } from "./types";

// Keep in step with supabase/functions/call-token, which makes the final decision.
export const EARLY_JOIN_MINUTES = 15;
const LATE_GRACE_MINUTES = 30;
const ASSUMED_SESSION_MINUTES = 60;

export type CallState = "not-available" | "too-early" | "open" | "ended";

/** Whether the in-app call for a session can be joined right now (viewer's local clock). */
export function callState(b: Pick<Booking, "status" | "date" | "start_time">, now = new Date()): CallState {
  if (b.status !== "accepted") return "not-available";
  const start = new Date(`${b.date}T${hhmm(b.start_time)}:00`).getTime();
  if (now.getTime() < start - EARLY_JOIN_MINUTES * 60_000) return "too-early";
  if (now.getTime() > start + (ASSUMED_SESSION_MINUTES + LATE_GRACE_MINUTES) * 60_000) return "ended";
  return "open";
}
