import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { Button, Card, Empty, Field, Input, PageHeader, Spinner } from "../components/ui";
import { formatDay } from "../lib/dates";
import { errorMessage, supabase } from "../lib/supabase";
import type { Goal } from "../lib/types";

export default function Goals() {
  const { user } = useAuth();
  const toast = useToast();
  const [goals, setGoals] = useState<Goal[] | null>(null);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("goals")
      .select("*, milestones(*)")
      .eq("user_id", user.id)
      .eq("archived", false)
      .order("created_at", { ascending: false });
    setGoals(((data ?? []) as Goal[]).map((g) => ({ ...g, milestones: [...g.milestones].sort((a, b) => a.position - b.position) })));
  }, [user]);

  useEffect(() => void load(), [load]);

  async function run(p: PromiseLike<{ error: unknown }>, ok?: string) {
    const { error } = await p;
    if (error) return toast(errorMessage(error), "error");
    if (ok) toast(ok);
    await load();
  }

  async function addGoal(e: FormEvent) {
    e.preventDefault();
    await run(supabase.from("goals").insert({ user_id: user!.id, title: title.trim(), target_date: target || null }), "Goal added");
    setTitle("");
    setTarget("");
  }

  if (!goals) return <Spinner />;

  return (
    <>
      <PageHeader title="Goals" subtitle="Break big goals into steps. Guides you book can see these to prepare." />
      <Card>
        <form onSubmit={addGoal} className="grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end">
          <Field label="New goal">
            <Input id="goal-title" required minLength={2} maxLength={140} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Land a junior developer role" />
          </Field>
          <Field label="Target date (optional)">
            <Input id="goal-date" type="date" value={target} onChange={(e) => setTarget(e.target.value)} />
          </Field>
          <Button type="submit"><Plus className="size-4" /> Add goal</Button>
        </form>
      </Card>
      {goals.length === 0 ? (
        <Empty title="No goals yet">Add one above to start tracking progress.</Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((g) => <GoalCard key={g.id} goal={g} run={run} />)}
        </div>
      )}
    </>
  );
}

function GoalCard({ goal, run }: { goal: Goal; run: (p: PromiseLike<{ error: unknown }>, ok?: string) => Promise<void> }) {
  const [step, setStep] = useState("");
  const done = goal.milestones.filter((m) => m.done).length;
  const pct = goal.milestones.length ? Math.round((done / goal.milestones.length) * 100) : 0;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold">{goal.title}</h2>
          {goal.target_date && <p className="text-xs text-muted">Target: {formatDay(goal.target_date)}</p>}
        </div>
        <button
          aria-label="Archive goal"
          className="rounded-lg p-2 text-muted hover:bg-surface2"
          onClick={() => run(supabase.from("goals").update({ archived: true }).eq("id", goal.id), "Goal archived")}
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface2"><div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} /></div>
        <span className="font-mono text-xs tabular-nums text-muted">{pct}%</span>
      </div>
      <ul className="flex flex-col gap-1.5">
        {goal.milestones.map((m) => (
          <li key={m.id}>
            <label className="flex cursor-pointer items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 size-4 accent-[rgb(var(--accent))]"
                checked={m.done}
                onChange={() => run(supabase.from("milestones").update({ done: !m.done }).eq("id", m.id))}
              />
              <span className={m.done ? "text-muted line-through" : ""}>{m.text}</span>
            </label>
          </li>
        ))}
      </ul>
      <form
        className="flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!step.trim()) return;
          await run(supabase.from("milestones").insert({ goal_id: goal.id, text: step.trim(), position: goal.milestones.length }));
          setStep("");
        }}
      >
        <Input id={`step-${goal.id}`} aria-label="New step" maxLength={200} value={step} onChange={(e) => setStep(e.target.value)} placeholder="Add a step" />
        <Button type="submit" variant="soft" size="sm">Add</Button>
      </form>
    </Card>
  );
}
