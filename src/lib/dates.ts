import type { Slot } from "./types";

const pad = (n: number) => String(n).padStart(2, "0");

export const toYmd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function parseYmd(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function daysFromToday(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
}

/** "18:00:00" -> "18:00" */
export const hhmm = (t: string) => t.slice(0, 5);

export const formatDay = (ymd: string) =>
  parseYmd(ymd).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function formatAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 1440) return `${Math.round(mins / 60)} h ago`;
  return formatDate(iso);
}

export const isPast = (ymd: string, time: string) => new Date(`${ymd}T${hhmm(time)}:00`) < new Date();

export interface OpenSlot {
  date: string;
  time: string;
}

/** Free slots from tomorrow for `days` days, minus slots already taken. */
export function openSlots(weekly: Slot[], taken: { date: string; start_time: string }[], days = 14): OpenSlot[] {
  const takenKeys = new Set(taken.map((t) => `${t.date}|${hhmm(t.start_time)}`));
  const out: OpenSlot[] = [];
  for (let i = 1; i <= days; i++) {
    const d = daysFromToday(i);
    const date = toYmd(d);
    weekly
      .filter((s) => s.weekday === d.getDay())
      .map((s) => hhmm(s.start_time))
      .sort()
      .forEach((time) => {
        if (!takenKeys.has(`${date}|${time}`)) out.push({ date, time });
      });
  }
  return out;
}
