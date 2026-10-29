import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DailyIframe, { type DailyCall } from "@daily-co/daily-js";
import { Mic, Video } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button, Card, Empty, Spinner, buttonClass, cx } from "../components/ui";
import { BOOKING_SELECT } from "../lib/api";
import { EARLY_JOIN_MINUTES, callState } from "../lib/calls";
import { formatDay, hhmm } from "../lib/dates";
import { errorMessage, supabase } from "../lib/supabase";
import type { Booking } from "../lib/types";

type Mode = "audio" | "video";

export default function Call() {
  const { bookingId = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null | undefined>(undefined);
  const [mode, setMode] = useState<Mode>("video");
  const [joining, setJoining] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const frameHost = useRef<HTMLDivElement>(null);
  const callRef = useRef<DailyCall | null>(null);

  useEffect(() => {
    supabase.from("bookings").select(BOOKING_SELECT).eq("id", bookingId).maybeSingle()
      .then(({ data }) => setBooking((data as unknown as Booking) ?? null));
  }, [bookingId]);

  // Leave the call and free the camera and microphone when the page closes.
  useEffect(() => () => {
    void callRef.current?.destroy();
    callRef.current = null;
  }, []);

  async function join() {
    if (!frameHost.current) return;
    setJoining(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("call-token", { body: { bookingId } });
      if (fnError) {
        const detail = await (fnError as { context?: Response }).context?.json?.().catch(() => null);
        throw new Error(detail?.error ?? fnError.message);
      }
      const frame = DailyIframe.createFrame(frameHost.current, {
        showLeaveButton: true,
        showFullscreenButton: true,
        iframeStyle: { width: "100%", height: "100%", border: "0", borderRadius: "12px" },
      });
      callRef.current = frame;
      frame.on("left-meeting", () => {
        void frame.destroy();
        callRef.current = null;
        navigate("/bookings");
      });
      frame.on("error", (e) => setError(e?.errorMsg ?? "The call stopped unexpectedly."));
      setInCall(true);
      await frame.join({ url: data.url, token: data.token, startVideoOff: mode === "audio", startAudioOff: false });
    } catch (e) {
      setError(errorMessage(e));
      setInCall(false);
      void callRef.current?.destroy();
      callRef.current = null;
    } finally {
      setJoining(false);
    }
  }

  if (booking === undefined) return <Spinner />;
  if (!booking)
    return (
      <Empty title="Session not found">
        <Link to="/bookings" className="font-semibold text-accent">Back to sessions</Link>
      </Empty>
    );

  const asGuide = booking.provider_user_id === user?.id;
  const other = asGuide ? booking.requester : booking.provider;
  const state = callState(booking);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Session call</p>
          <h1 className="text-2xl font-extrabold">{booking.topic}</h1>
          <p className="text-sm text-muted">
            with {other?.full_name ?? "your guide"} · {formatDay(booking.date)} at {hhmm(booking.start_time)}
          </p>
        </div>
        {!inCall && <Link to="/bookings" className={buttonClass("ghost", "sm")}>Back to sessions</Link>}
      </div>

      {!inCall && (
        <Card className="flex flex-col gap-5">
          {state === "not-available" && <p className="text-sm">Calls open once the guide has accepted this session.</p>}
          {state === "too-early" && (
            <p className="text-sm">The call opens {EARLY_JOIN_MINUTES} minutes before the session starts. Come back then.</p>
          )}
          {state === "ended" && <p className="text-sm">This session's call has ended.</p>}
          {state === "open" && (
            <>
              <div>
                <h2 className="text-lg font-bold">How do you want to join?</h2>
                <p className="text-sm text-muted">You can turn your camera on or off at any time during the call.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Call type">
                {([
                  ["audio", Mic, "Audio only", "Uses less data. Best on a weak connection."],
                  ["video", Video, "Video", "Camera on from the start."],
                ] as const).map(([value, Icon, label, hint]) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={mode === value}
                    onClick={() => setMode(value)}
                    className={cx(
                      "flex items-start gap-3 rounded-xl border p-4 text-left transition",
                      mode === value ? "border-accent bg-accentsoft" : "border-line hover:bg-surface2",
                    )}
                  >
                    <Icon className="mt-0.5 size-5 text-accent" />
                    <span>
                      <b className="block">{label}</b>
                      <span className="text-sm text-muted">{hint}</span>
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted">Your browser will ask to use your microphone{mode === "video" ? " and camera" : ""}. Click Allow.</p>
              <Button size="lg" className="self-start" onClick={join} loading={joining}>
                Join {mode === "audio" ? "audio" : "video"} call
              </Button>
            </>
          )}
          {error && <p className="rounded-lg bg-danger/10 p-3 text-sm text-danger">{error}</p>}
        </Card>
      )}

      <div ref={frameHost} className={cx("w-full overflow-hidden rounded-xl bg-surface2", inCall ? "h-[75vh] min-h-[420px]" : "hidden")} />
    </>
  );
}
