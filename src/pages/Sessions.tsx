import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { Avatar, Button, Card, Empty, Field, Input, Modal, PageHeader, Spinner, StatusPill, Textarea, buttonClass, cx } from "../components/ui";
import { setBookingStatus, useBookings } from "../lib/api";
import { formatDay, hhmm, isPast } from "../lib/dates";
import { errorMessage, supabase } from "../lib/supabase";
import type { Booking } from "../lib/types";

type Tab = "requests" | "upcoming" | "past" | "closed";
const TABS: { id: Tab; label: string }[] = [
  { id: "requests", label: "Requests" },
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
  { id: "closed", label: "Declined & cancelled" },
];

function tabOf(b: Booking): Tab {
  if (b.status === "pending") return "requests";
  if (b.status === "accepted") return "upcoming";
  if (b.status === "completed") return "past";
  return "closed";
}

export default function Sessions() {
  const { user } = useAuth();
  const { bookings, loading, reload } = useBookings(user?.id);
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("requests");
  const [reviewing, setReviewing] = useState<Booking | null>(null);
  const [linkFor, setLinkFor] = useState<Booking | null>(null);

  const grouped = useMemo(() => {
    const g: Record<Tab, Booking[]> = { requests: [], upcoming: [], past: [], closed: [] };
    bookings.forEach((b) => g[tabOf(b)].push(b));
    g.past.reverse();
    g.closed.reverse();
    return g;
  }, [bookings]);

  async function change(b: Booking, status: string, success: string) {
    try {
      await setBookingStatus(b.id, status);
      toast(success);
      await reload();
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  }

  if (loading) return <Spinner />;

  return (
    <>
      <PageHeader title="Sessions" subtitle="Requests you sent and received, upcoming sessions and your history." />
      <div className="flex gap-1 overflow-x-auto border-b border-line" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cx(
              "whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold",
              tab === t.id ? "border-accent text-accent" : "border-transparent text-muted hover:text-fg",
            )}
          >
            {t.label} <span className="ml-1 font-mono text-xs">{grouped[t.id].length}</span>
          </button>
        ))}
      </div>

      {grouped[tab].length === 0 ? (
        <Empty title="Nothing here yet">
          {tab === "requests" ? <Link to="/browse" className="font-semibold text-accent">Find a guide to request a session</Link> : "Sessions will show up here."}
        </Empty>
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-line">
            {grouped[tab].map((b) => {
              const asGuide = b.provider_user_id === user?.id;
              const other = asGuide ? b.requester : b.provider;
              const reviewed = (b.reviews?.length ?? 0) > 0;
              const past = isPast(b.date, b.start_time);
              return (
                <li key={b.id} className="flex flex-wrap items-center gap-4 p-4">
                  <Avatar name={other?.full_name ?? "?"} url={other?.avatar_url} />
                  <div className="min-w-[200px] flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{b.topic}</p>
                      <StatusPill status={b.status} />
                    </div>
                    <p className="text-sm text-muted">
                      {asGuide ? "From" : "With"} {other?.full_name ?? "Unknown"} · {formatDay(b.date)} at {hhmm(b.start_time)} · {b.mode}
                    </p>
                    {b.note && <p className="mt-1 text-sm">"{b.note}"</p>}
                    {b.decline_reason && <p className="mt-1 text-sm text-muted">Reason: {b.decline_reason}</p>}
                    {b.meeting_link && b.status === "accepted" && (
                      <a href={b.meeting_link} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-accent">
                        Join meeting <ExternalLink className="size-3.5" />
                      </a>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {b.status !== "declined" && b.status !== "cancelled" && (
                      <Link to={`/messages/${b.id}`} className={buttonClass("ghost", "sm")}>Message</Link>
                    )}
                    {asGuide && b.status === "pending" && (
                      <>
                        <Button size="sm" onClick={() => change(b, "accepted", "Request accepted")}>Accept</Button>
                        <Button size="sm" variant="ghost" onClick={() => change(b, "declined", "Request declined")}>Decline</Button>
                      </>
                    )}
                    {asGuide && b.status === "accepted" && (
                      <>
                        <Button size="sm" variant="soft" onClick={() => setLinkFor(b)}>{b.meeting_link ? "Edit link" : "Add meeting link"}</Button>
                        {past && <Button size="sm" onClick={() => change(b, "completed", "Marked as completed")}>Mark completed</Button>}
                      </>
                    )}
                    {(b.status === "pending" || b.status === "accepted") && (
                      <Button size="sm" variant="danger" onClick={() => change(b, "cancelled", "Session cancelled")}>Cancel</Button>
                    )}
                    {!asGuide && b.status === "completed" && !reviewed && (
                      <Button size="sm" onClick={() => setReviewing(b)}>Leave a review</Button>
                    )}
                    {!asGuide && b.status === "completed" && reviewed && <span className="text-sm text-muted">Reviewed</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {reviewing && <ReviewModal booking={reviewing} onClose={() => setReviewing(null)} onDone={reload} />}
      {linkFor && <LinkModal booking={linkFor} onClose={() => setLinkFor(null)} onDone={reload} />}
    </>
  );
}

function ReviewModal({ booking, onClose, onDone }: { booking: Booking; onClose: () => void; onDone: () => void }) {
  const { user } = useAuth();
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!rating) return toast("Choose a star rating.", "error");
    setBusy(true);
    const { error } = await supabase.from("reviews").insert({
      booking_id: booking.id,
      guide_id: booking.provider_user_id,
      author_id: user!.id,
      rating,
      comment: comment.trim() || null,
    });
    setBusy(false);
    if (error) return toast(errorMessage(error), "error");
    toast("Thanks for your review");
    onDone();
    onClose();
  }

  return (
    <Modal title={`Review your session with ${booking.provider?.full_name ?? "your guide"}`} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div role="radiogroup" aria-label="Rating" className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              onClick={() => setRating(n)}
              className={cx("text-4xl leading-none", n <= rating ? "text-gold" : "text-line")}
            >
              ★
            </button>
          ))}
        </div>
        <Field label="What was helpful? (optional)">
          <Textarea id="review-comment" maxLength={500} value={comment} onChange={(e) => setComment(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={busy}>Post review</Button>
        </div>
      </form>
    </Modal>
  );
}

function LinkModal({ booking, onClose, onDone }: { booking: Booking; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [link, setLink] = useState(booking.meeting_link ?? "");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.rpc("set_meeting_link", { p_id: booking.id, p_link: link.trim() || null });
    setBusy(false);
    if (error) return toast(errorMessage(error), "error");
    toast("Meeting link saved");
    onDone();
    onClose();
  }

  return (
    <Modal title="Meeting link" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Google Meet, Zoom or Jitsi link" hint="Only you and the learner can see this link.">
          <Input id="meeting-link" type="url" pattern="https://.*" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://meet.google.com/..." />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={busy}>Save link</Button>
        </div>
      </form>
    </Modal>
  );
}
