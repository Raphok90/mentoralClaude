import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Flag, Send } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { Avatar, Button, Card, Empty, Input, PageHeader, Spinner, StatusPill, cx } from "../components/ui";
import { useBookings } from "../lib/api";
import { formatAgo, formatDay, hhmm } from "../lib/dates";
import { errorMessage, supabase } from "../lib/supabase";
import type { Message } from "../lib/types";
import { ReportModal } from "./GuidePage";

export default function Messages() {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const { bookings, loading } = useBookings(user?.id);
  const navigate = useNavigate();
  const toast = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [reporting, setReporting] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const threads = useMemo(
    () => bookings.filter((b) => b.status !== "declined" && b.status !== "cancelled").slice().reverse(),
    [bookings],
  );
  const active = threads.find((b) => b.id === bookingId) ?? bookings.find((b) => b.id === bookingId);
  const canSend = active && ["pending", "accepted", "completed"].includes(active.status);

  useEffect(() => {
    if (!bookingId) return;
    setMessages([]);
    supabase.from("messages").select("*").eq("booking_id", bookingId).order("created_at")
      .then(({ data }) => setMessages((data ?? []) as Message[]));
    const channel = supabase
      .channel(`messages-${bookingId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `booking_id=eq.${bookingId}` }, (p) =>
        setMessages((prev) => (prev.some((m) => m.id === p.new.id) ? prev : [...prev, p.new as Message])),
      )
      .subscribe();
    return () => void supabase.removeChannel(channel);
  }, [bookingId]);

  useEffect(() => endRef.current?.scrollIntoView({ block: "end" }), [messages]);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!body.trim() || !user || !bookingId) return;
    setSending(true);
    const { data, error } = await supabase.from("messages").insert({ booking_id: bookingId, sender_id: user.id, body: body.trim() }).select().single();
    setSending(false);
    if (error) return toast(errorMessage(error), "error");
    setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data as Message]));
    setBody("");
  }

  if (loading) return <Spinner />;

  const otherOf = (b: (typeof bookings)[number]) => (b.provider_user_id === user?.id ? { p: b.requester, id: b.requester_id } : { p: b.provider, id: b.provider_user_id });

  return (
    <>
      <PageHeader title="Messages" subtitle="A conversation opens for each session request." />
      {threads.length === 0 ? (
        <Empty title="No conversations yet">
          <Link to="/browse" className="font-semibold text-accent">Request a session</Link> to start chatting with a guide.
        </Empty>
      ) : (
        <Card className="grid min-h-[480px] overflow-hidden p-0 md:grid-cols-[280px_minmax(0,1fr)]">
          <ul className={cx("overflow-y-auto border-line md:max-h-[600px] md:border-r", bookingId && "hidden md:block")}>
            {threads.map((b) => {
              const o = otherOf(b);
              return (
                <li key={b.id}>
                  <button
                    onClick={() => navigate(`/messages/${b.id}`)}
                    className={cx("flex w-full items-center gap-3 border-b border-line p-3 text-left", b.id === bookingId ? "bg-accentsoft" : "hover:bg-surface2")}
                  >
                    <Avatar name={o.p?.full_name ?? "?"} url={o.p?.avatar_url} size={38} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{o.p?.full_name}</span>
                      <span className="block truncate text-xs text-muted">{b.topic}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {!active ? (
            <div className="hidden place-items-center p-8 text-sm text-muted md:grid">Choose a conversation.</div>
          ) : (
            <div className="flex min-w-0 flex-col">
              <div className="flex flex-wrap items-center gap-3 border-b border-line p-3">
                <button className="text-sm text-accent md:hidden" onClick={() => navigate("/messages")}>← All</button>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{otherOf(active).p?.full_name}</p>
                  <p className="truncate text-xs text-muted">{active.topic} · {formatDay(active.date)} {hhmm(active.start_time)}</p>
                </div>
                <StatusPill status={active.status} />
                <button aria-label="Report" className="rounded-lg p-2 text-muted hover:bg-surface2" onClick={() => setReporting(true)}>
                  <Flag className="size-4" />
                </button>
              </div>
              <div className="flex max-h-[460px] flex-1 flex-col gap-2 overflow-y-auto p-4">
                {messages.length === 0 && <p className="m-auto text-sm text-muted">No messages yet. Say hello and share what you'd like to cover.</p>}
                {messages.map((m) => {
                  const mine = m.sender_id === user?.id;
                  return (
                    <div key={m.id} className={cx("max-w-[78%] rounded-2xl px-3.5 py-2 text-sm [overflow-wrap:anywhere]", mine ? "self-end bg-accent text-accentfg" : "bg-surface2")}>
                      <p className="whitespace-pre-line">{m.body}</p>
                      <time className="mt-0.5 block text-[11px] opacity-70">{formatAgo(m.created_at)}</time>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
              {canSend ? (
                <form onSubmit={send} className="flex gap-2 border-t border-line p-3">
                  <Input id="message" aria-label="Message" maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a message" />
                  <Button type="submit" loading={sending} aria-label="Send"><Send className="size-4" /></Button>
                </form>
              ) : (
                <p className="border-t border-line p-3 text-center text-sm text-muted">This session was closed, so the chat is read-only.</p>
              )}
            </div>
          )}
        </Card>
      )}
      {reporting && active && <ReportModal targetId={otherOf(active).id} bookingId={active.id} onClose={() => setReporting(false)} />}
    </>
  );
}
