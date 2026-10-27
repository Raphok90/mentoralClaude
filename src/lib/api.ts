import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";
import { daysFromToday } from "./dates";
import type { Booking, DirectoryGuide, Slot } from "./types";

export const BOOKING_SELECT =
  "*, requester:profiles!bookings_requester_id_fkey(full_name, avatar_url), provider:profiles!bookings_provider_user_id_fkey(full_name, avatar_url), reviews(id)";

export async function fetchDirectory(ids?: string[]): Promise<DirectoryGuide[]> {
  let q = supabase.from("guide_directory").select("*");
  if (ids) q = q.in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as DirectoryGuide[];
}

/** Weekly slots grouped by guide. */
export async function fetchAvailability(guideIds: string[]): Promise<Record<string, Slot[]>> {
  if (!guideIds.length) return {};
  const { data, error } = await supabase.from("availability").select("guide_id, weekday, start_time").in("guide_id", guideIds);
  if (error) throw error;
  const out: Record<string, Slot[]> = {};
  for (const row of data ?? []) (out[row.guide_id] ??= []).push({ weekday: row.weekday, start_time: row.start_time });
  return out;
}

/** True if the guide has any weekly slot in the next 7 days (ignores bookings). */
export function hasSlotSoon(slots: Slot[] | undefined): boolean {
  if (!slots?.length) return false;
  const days = new Set(Array.from({ length: 7 }, (_, i) => daysFromToday(i + 1).getDay()));
  return slots.some((s) => days.has(s.weekday));
}

export function useBookings(userId: string | undefined) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("bookings")
      .select(BOOKING_SELECT)
      .or(`requester_id.eq.${userId},provider_user_id.eq.${userId}`)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });
    setBookings((data ?? []) as unknown as Booking[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { bookings, loading, reload };
}

export async function setBookingStatus(id: string, status: string, reason?: string) {
  const { error } = await supabase.rpc("update_booking_status", { p_id: id, p_status: status, p_reason: reason ?? null });
  if (error) throw error;
}
