// Supabase Edge Function: call-token
// Gives a signed-in guide or learner a private Daily room URL and a meeting token
// for one of their accepted sessions. The Daily API key never reaches the browser.
//
// Secret required (Supabase -> Edge Functions -> Secrets): DAILY_API_KEY
// SUPABASE_URL and SUPABASE_ANON_KEY are provided by Supabase automatically.

import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const DAILY_API = "https://api.daily.co/v1";
const EARLY_JOIN_MINUTES = 15; // room opens this long before the start time
const LATE_GRACE_MINUTES = 30; // and stays open this long after the session should end
const LAGOS_UTC_OFFSET_HOURS = 1; // session times are stored in West Africa Time (no daylight saving)

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

/** "2026-11-02" + "18:00:00" in WAT -> epoch milliseconds. */
function sessionStartMs(date: string, time: string): number {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return Date.UTC(y, m - 1, d, hh - LAGOS_UTC_OFFSET_HOURS, mm);
}

async function daily(path: string, apiKey: string, init: RequestInit = {}) {
  const res = await fetch(`${DAILY_API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);

  const apiKey = Deno.env.get("DAILY_API_KEY");
  if (!apiKey) return json({ error: "Calls are not set up yet. Add DAILY_API_KEY in Supabase secrets." }, 500);

  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return json({ error: "Sign in to join this call." }, 401);

  const { bookingId } = await req.json().catch(() => ({}));
  if (typeof bookingId !== "string") return json({ error: "Missing session." }, 400);

  // Row-level security means this only returns the booking if the user is the guide or the learner.
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, requester_id, provider_user_id, date, start_time, status")
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking) return json({ error: "Session not found." }, 404);
  if (booking.status !== "accepted") return json({ error: "Calls open once the guide has accepted the session." }, 403);

  const isGuide = booking.provider_user_id === user.id;
  const { data: guide } = await supabase
    .from("guide_directory")
    .select("session_minutes")
    .eq("user_id", booking.provider_user_id)
    .maybeSingle();
  const minutes = guide?.session_minutes ?? 60;

  const start = sessionStartMs(booking.date, booking.start_time);
  const opensAt = start - EARLY_JOIN_MINUTES * 60_000;
  const closesAt = start + (minutes + LATE_GRACE_MINUTES) * 60_000;
  const now = Date.now();
  if (now < opensAt) return json({ error: "The call opens 15 minutes before the session starts.", opensAt }, 403);
  if (now > closesAt) return json({ error: "This session's call has ended." }, 403);

  const { data: me } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  const exp = Math.floor(closesAt / 1000);
  const roomName = `mentoral-${booking.id}`;

  let room = await daily(`/rooms/${roomName}`, apiKey);
  if (room.status === 404) {
    room = await daily("/rooms", apiKey, {
      method: "POST",
      body: JSON.stringify({
        name: roomName,
        privacy: "private",
        properties: {
          exp,
          eject_at_room_exp: true,
          max_participants: 2,
          enable_prejoin_ui: false, // the app asks audio or video before joining
          enable_chat: true,
          enable_screenshare: true,
        },
      }),
    });
  }
  if (!room.ok) return json({ error: "Could not open the call room. Try again in a moment." }, 502);

  const token = await daily("/meeting-tokens", apiKey, {
    method: "POST",
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        user_id: user.id,
        user_name: me?.full_name || (isGuide ? "Guide" : "Learner"),
        is_owner: isGuide,
        exp,
      },
    }),
  });
  if (!token.ok) return json({ error: "Could not create your call pass. Try again in a moment." }, 502);

  return json({ url: room.body.url, token: token.body.token, closesAt });
});
