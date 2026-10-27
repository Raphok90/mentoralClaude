import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Bookmark, BookmarkCheck, Clock, Flag, Info, MapPin } from "lucide-react";
import { AdaptiveShell } from "../components/Layout";
import {
  Avatar, Button, Card, Chip, Empty, Field, Input, Modal, Rating, Select, Spinner, Textarea, TypeTag, Verified, buttonClass, cx,
} from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { errorMessage, supabase } from "../lib/supabase";
import { fetchAvailability, fetchDirectory } from "../lib/api";
import { daysFromToday, formatDate, formatDay, openSlots, toYmd, type OpenSlot } from "../lib/dates";
import type { DirectoryGuide, GuideProfile, Review, Slot } from "../lib/types";

export default function GuidePage() {
  const { id = "" } = useParams();
  const { user, profile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [dir, setDir] = useState<DirectoryGuide | null | undefined>(undefined);
  const [detail, setDetail] = useState<GuideProfile | null>(null);
  const [weekly, setWeekly] = useState<Slot[]>([]);
  const [taken, setTaken] = useState<{ date: string; start_time: string }[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [saved, setSaved] = useState(false);
  const [slot, setSlot] = useState<OpenSlot | null>(null);
  const [topic, setTopic] = useState("");
  const [note, setNote] = useState("");
  const [mode, setMode] = useState("Online");
  const [busy, setBusy] = useState(false);
  const [reporting, setReporting] = useState(false);

  async function load() {
    const [d, g, av, tk, rv] = await Promise.all([
      fetchDirectory([id]),
      supabase.from("guide_profiles").select("*").eq("user_id", id).maybeSingle(),
      fetchAvailability([id]),
      supabase.rpc("taken_slots", { guide: id, from_date: toYmd(daysFromToday(0)), to_date: toYmd(daysFromToday(15)) }),
      supabase.from("guide_reviews").select("*").eq("guide_id", id).order("created_at", { ascending: false }).limit(20),
    ]);
    setDir(d[0] ?? null);
    setDetail((g.data as GuideProfile) ?? null);
    setWeekly(av[id] ?? []);
    setTaken((tk.data ?? []) as { date: string; start_time: string }[]);
    setReviews((rv.data ?? []) as Review[]);
    if (d[0]) setMode(d[0].modes[0] ?? "Online");
  }

  useEffect(() => {
    load().catch(() => setDir(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!user) return;
    supabase.from("saved_guides").select("guide_id").eq("user_id", user.id).eq("guide_id", id).maybeSingle()
      .then(({ data }) => setSaved(Boolean(data)));
  }, [user, id]);

  const free = useMemo(() => openSlots(weekly, taken, 14), [weekly, taken]);
  const byDay = useMemo(() => {
    const m = new Map<string, string[]>();
    free.forEach((s) => m.set(s.date, [...(m.get(s.date) ?? []), s.time]));
    return [...m.entries()];
  }, [free]);

  const isSelf = user?.id === id;

  async function toggleSave() {
    if (!user) return navigate(`/auth?next=/guide/${id}`);
    if (saved) await supabase.from("saved_guides").delete().eq("user_id", user.id).eq("guide_id", id);
    else await supabase.from("saved_guides").insert({ user_id: user.id, guide_id: id });
    setSaved(!saved);
    toast(saved ? "Removed from saved" : "Saved to your shortlist");
  }

  async function book(e: FormEvent) {
    e.preventDefault();
    if (!user) return navigate(`/auth?next=/guide/${id}`);
    if (!slot) return toast("Pick a time first.", "error");
    setBusy(true);
    const { error } = await supabase.from("bookings").insert({
      requester_id: user.id,
      provider_user_id: id,
      date: slot.date,
      start_time: slot.time,
      mode,
      topic: topic.trim(),
      note: note.trim() || null,
    });
    setBusy(false);
    if (error) return toast(error.code === "23505" ? "That time was just taken. Pick another one." : errorMessage(error), "error");
    toast("Request sent. You'll see it under Sessions.");
    navigate("/bookings");
  }

  if (dir === undefined) return <AdaptiveShell><Spinner /></AdaptiveShell>;
  if (!dir || !detail)
    return (
      <AdaptiveShell>
        <Empty title="Guide not found">
          This profile is not available. <Link to="/browse" className="font-semibold text-accent">Browse guides</Link>
        </Empty>
      </AdaptiveShell>
    );

  return (
    <AdaptiveShell>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-5">
          <Card className="flex flex-col gap-4">
            <div className="flex flex-wrap items-start gap-4">
              <Avatar name={dir.full_name} url={dir.avatar_url} size={84} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-extrabold">{dir.full_name}</h1>
                  <Verified />
                </div>
                <p className="mt-1 text-muted">{dir.headline}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                  <TypeTag type={dir.type} />
                  <span>{dir.industry}</span>
                  {dir.state && <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{dir.state}</span>}
                  <span>{dir.years_experience} years' experience</span>
                </div>
              </div>
              {!isSelf && (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={toggleSave} aria-pressed={saved}>
                    {saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
                    {saved ? "Saved" : "Save"}
                  </Button>
                  {user && (
                    <Button variant="ghost" size="sm" onClick={() => setReporting(true)} aria-label="Report this profile">
                      <Flag className="size-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3 border-t border-line pt-4 text-center">
              <div><Rating avg={dir.avg_rating} count={dir.review_count} /><p className="text-xs text-muted">Rating</p></div>
              <div><b className="font-display text-xl tabular-nums">{dir.sessions_completed}</b><p className="text-xs text-muted">Sessions completed</p></div>
              <div><b className="font-display text-xl tabular-nums">{dir.session_minutes} min</b><p className="text-xs text-muted">Session length</p></div>
            </div>
          </Card>

          {dir.type === "counsellor" && (
            <div className="flex gap-3 rounded-xl bg-warn/10 p-4 text-sm">
              <Info className="size-5 shrink-0 text-warn" />
              <p>Mentoral is not an emergency or crisis service. If you or someone else is in danger, contact local emergency services now.</p>
            </div>
          )}

          <Card className="flex flex-col gap-3">
            <h2 className="text-xl font-bold">About</h2>
            <p className="whitespace-pre-line text-[15px] leading-relaxed">{detail.bio || "This guide has not written a bio yet."}</p>
            <h3 className="mt-2 font-bold">Can help with</h3>
            <div className="flex flex-wrap gap-2">{dir.expertise.map((e) => <Chip key={e}>{e}</Chip>)}</div>
            <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
              <p><span className="text-muted">Languages: </span>{dir.languages.join(", ")}</p>
              <p><span className="text-muted">Sessions: </span>{dir.modes.join(" or ")}</p>
            </div>
          </Card>

          <Card className="flex flex-col gap-3">
            <h2 className="text-xl font-bold">Reviews</h2>
            {reviews.length === 0 ? (
              <p className="text-sm text-muted">No reviews yet. Reviews appear after completed sessions.</p>
            ) : (
              <ul className="divide-y divide-line">
                {reviews.map((r) => (
                  <li key={r.id} className="flex flex-col gap-1 py-3">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <b>{r.author_first_name}</b>
                      <span className="text-gold" aria-label={`${r.rating} out of 5`}>{"★".repeat(r.rating)}<span className="text-line">{"★".repeat(5 - r.rating)}</span></span>
                    </div>
                    {r.comment && <p className="text-sm">{r.comment}</p>}
                    <p className="text-xs text-muted">{formatDate(r.created_at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card className="flex flex-col gap-4 lg:sticky lg:top-6">
          <h2 className="text-xl font-bold">Request a session</h2>
          {isSelf ? (
            <div className="flex flex-col gap-3 text-sm">
              <p className="text-muted">This is how learners see your profile.</p>
              <Link to="/guide-settings" className={buttonClass("soft")}>Edit profile and availability</Link>
            </div>
          ) : !dir.accepting_requests ? (
            <p className="text-sm text-muted">{dir.full_name.split(" ")[0]} has paused new requests. Save this profile and check back later.</p>
          ) : (
            <form onSubmit={book} className="flex flex-col gap-4">
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold">
                  <Clock className="size-4" /> Pick a time <span className="font-normal text-muted">(your local time)</span>
                </p>
                {byDay.length === 0 ? (
                  <p className="rounded-lg bg-surface2 p-3 text-sm text-muted">No free times in the next two weeks.</p>
                ) : (
                  <div className="flex max-h-72 flex-col gap-3 overflow-y-auto pr-1">
                    {byDay.map(([date, times]) => (
                      <div key={date}>
                        <p className="mb-1.5 text-xs font-semibold text-muted">{formatDay(date)}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {times.map((t) => {
                            const on = slot?.date === date && slot.time === t;
                            return (
                              <button
                                type="button"
                                key={t}
                                aria-pressed={on}
                                onClick={() => setSlot({ date, time: t })}
                                className={cx(
                                  "rounded-lg border px-3 py-1.5 font-mono text-[13px]",
                                  on ? "border-accent bg-accent text-accentfg" : "border-line hover:bg-surface2",
                                )}
                              >
                                {t}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {dir.modes.length > 1 && (
                <Field label="Session type">
                  <Select id="mode" value={mode} onChange={(e) => setMode(e.target.value)}>
                    {dir.modes.map((m) => <option key={m}>{m}</option>)}
                  </Select>
                </Field>
              )}
              <Field label="What do you want to talk about?">
                <Input id="topic" required minLength={3} maxLength={140} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Planning a switch into data analysis" />
              </Field>
              <Field label="Anything they should know first? (optional)">
                <Textarea id="note" maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
              </Field>
              {profile?.main_goal && <p className="text-xs text-muted">Your goals are shared with the guide once you send a request.</p>}
              <Button type="submit" loading={busy} disabled={!slot || byDay.length === 0}>
                {user ? "Send request" : "Sign in to request"}
              </Button>
              <p className="text-center text-xs text-muted">Free · the guide replies within 48 hours</p>
            </form>
          )}
        </Card>
      </div>
      {reporting && <ReportModal targetId={id} onClose={() => setReporting(false)} />}
    </AdaptiveShell>
  );
}

export function ReportModal({ targetId, bookingId, onClose }: { targetId: string; bookingId?: string; onClose: () => void }) {
  const { user } = useAuth();
  const toast = useToast();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      target_user_id: targetId,
      booking_id: bookingId ?? null,
      reason: reason.trim(),
    });
    setBusy(false);
    if (error) return toast(errorMessage(error), "error");
    toast("Report sent. Our team will review it.");
    onClose();
  }

  return (
    <Modal title="Report this person" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="What happened?" hint="Reports are private. The person is not told who reported them.">
          <Textarea id="report-reason" required minLength={5} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="danger" loading={busy}>Send report</Button>
        </div>
      </form>
    </Modal>
  );
}
