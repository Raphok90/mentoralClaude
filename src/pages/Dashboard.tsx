import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { GuideCard } from "../components/GuideCard";
import { Avatar, Button, Card, Empty, Rating, buttonClass } from "../components/ui";
import { fetchAvailability, fetchDirectory, hasSlotSoon, setBookingStatus, useBookings } from "../lib/api";
import { formatDay, hhmm, isPast } from "../lib/dates";
import { matchGuide, type Match } from "../lib/match";
import { errorMessage, supabase } from "../lib/supabase";
import type { Booking, DirectoryGuide, Goal } from "../lib/types";

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="flex flex-col gap-0.5 p-4">
      <b className="font-display text-3xl tabular-nums">{value}</b>
      <span className="text-sm text-muted">{label}</span>
    </Card>
  );
}

function NextSession({ b, asGuide }: { b: Booking; asGuide: boolean }) {
  const other = asGuide ? b.requester : b.provider;
  return (
    <Card className="flex flex-wrap items-center gap-4">
      <CalendarDays className="size-6 text-accent" />
      <div className="min-w-0 flex-1">
        <p className="eyebrow">Next session</p>
        <p className="font-semibold">{b.topic}</p>
        <p className="text-sm text-muted">
          with {other?.full_name ?? "your guide"} · {formatDay(b.date)} at {hhmm(b.start_time)} · {b.mode}
        </p>
      </div>
      <Link to={`/messages/${b.id}`} className={buttonClass("soft", "sm")}>Open chat</Link>
    </Card>
  );
}

export default function Dashboard() {
  const { user, profile, isGuide, isAdmin, guide } = useAuth();
  const { bookings, reload } = useBookings(user?.id);
  const toast = useToast();
  const [recs, setRecs] = useState<{ g: DirectoryGuide; m: Match | null }[] | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [me, setMe] = useState<DirectoryGuide | null>(null);

  const mine = useMemo(() => {
    const asLearner = bookings.filter((b) => b.requester_id === user?.id);
    const asGuide = bookings.filter((b) => b.provider_user_id === user?.id);
    const upcoming = (list: Booking[]) => list.filter((b) => b.status === "accepted" && !isPast(b.date, b.start_time));
    return { asLearner, asGuide, upcomingL: upcoming(asLearner), upcomingG: upcoming(asGuide) };
  }, [bookings, user]);

  useEffect(() => {
    if (!user) return;
    fetchDirectory().then(async (all) => {
      const slots = await fetchAvailability(all.map((g) => g.user_id));
      setMe(all.find((g) => g.user_id === user.id) ?? null);
      setRecs(
        all
          .filter((g) => g.user_id !== user.id && g.accepting_requests)
          .map((g) => ({ g, m: matchGuide(profile, g, hasSlotSoon(slots[g.user_id])) }))
          .sort((a, b) => (b.m?.score ?? 0) - (a.m?.score ?? 0))
          .slice(0, 3),
      );
    }).catch(() => setRecs([]));
    supabase.from("goals").select("*, milestones(*)").eq("user_id", user.id).eq("archived", false).limit(3)
      .then(({ data }) => setGoals((data ?? []) as Goal[]));
  }, [user, profile]);

  async function act(id: string, status: "accepted" | "declined") {
    try {
      await setBookingStatus(id, status);
      toast(status === "accepted" ? "Request accepted" : "Request declined");
      await reload();
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  }

  const firstName = (profile?.full_name || "there").split(" ")[0];
  const pendingForMe = mine.asGuide.filter((b) => b.status === "pending");

  return (
    <>
      <div>
        <h1 className="text-3xl font-extrabold">Hi, {firstName}</h1>
        <p className="mt-1 text-muted">{profile?.main_goal ? `Your goal: ${profile.main_goal}` : "Here's what's happening with your sessions."}</p>
      </div>

      {isAdmin && (
        <Link to="/admin" className="flex items-center justify-between rounded-xl bg-accentsoft p-4 font-semibold text-accent">
          Review guide applications and reports <ArrowRight className="size-4" />
        </Link>
      )}

      {isGuide && (
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-bold">As a guide</h2>
            {guide && !guide.accepting_requests && <span className="text-sm text-warn">New requests are paused</span>}
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="New requests" value={pendingForMe.length} />
            <Stat label="Upcoming" value={mine.upcomingG.length} />
            <Stat label="Completed" value={mine.asGuide.filter((b) => b.status === "completed").length} />
            <Card className="flex flex-col justify-center gap-1 p-4">
              {me ? <Rating avg={me.avg_rating} count={me.review_count} /> : <span className="text-sm text-muted">Pending verification</span>}
              <span className="text-sm text-muted">Your rating</span>
            </Card>
          </div>
          {pendingForMe.length > 0 && (
            <Card className="flex flex-col gap-1">
              <h3 className="mb-1 font-bold">Waiting for your reply</h3>
              <ul className="divide-y divide-line">
                {pendingForMe.map((b) => (
                  <li key={b.id} className="flex flex-wrap items-center gap-3 py-3">
                    <Avatar name={b.requester?.full_name ?? "?"} url={b.requester?.avatar_url} />
                    <div className="min-w-[180px] flex-1">
                      <p className="font-semibold">{b.topic}</p>
                      <p className="text-sm text-muted">{b.requester?.full_name} · {formatDay(b.date)} at {hhmm(b.start_time)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => act(b.id, "accepted")}>Accept</Button>
                      <Button size="sm" variant="ghost" onClick={() => act(b.id, "declined")}>Decline</Button>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {mine.upcomingG[0] && <NextSession b={mine.upcomingG[0]} asGuide />}
        </section>
      )}

      <section className="flex flex-col gap-4">
        {isGuide && <h2 className="text-xl font-bold">As a learner</h2>}
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Pending requests" value={mine.asLearner.filter((b) => b.status === "pending").length} />
          <Stat label="Upcoming" value={mine.upcomingL.length} />
          <Stat label="Completed" value={mine.asLearner.filter((b) => b.status === "completed").length} />
        </div>
        {mine.upcomingL[0] && <NextSession b={mine.upcomingL[0]} asGuide={false} />}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Recommended for you</h2>
          <Link to="/browse" className="text-sm font-semibold text-accent">See all guides</Link>
        </div>
        {recs === null ? null : recs.length === 0 ? (
          <Empty title="No guides to recommend yet">Verified guides will appear here as they join.</Empty>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">{recs.map(({ g, m }) => <GuideCard key={g.user_id} guide={g} match={m} />)}</div>
        )}
        {!profile?.interests.length && (
          <p className="text-sm text-muted">
            Add interests in your <Link to="/account" className="font-semibold text-accent">account</Link> to improve your matches.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Your goals</h2>
          <Link to="/goals" className="text-sm font-semibold text-accent">Manage goals</Link>
        </div>
        {goals.length === 0 ? (
          <Empty title="No goals yet">
            <Link to="/goals" className="font-semibold text-accent">Add your first goal</Link> and break it into steps.
          </Empty>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {goals.map((g) => {
              const done = g.milestones.filter((m) => m.done).length;
              const pct = g.milestones.length ? Math.round((done / g.milestones.length) * 100) : 0;
              return (
                <Card key={g.id} className="flex flex-col gap-2 p-4">
                  <p className="font-semibold">{g.title}</p>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface2"><div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} /></div>
                  <p className="text-xs text-muted">{done} of {g.milestones.length} steps done</p>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
