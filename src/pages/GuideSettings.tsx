import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { Button, Card, ChipPicker, Field, Input, PageHeader, Select, Textarea, buttonClass, cx } from "../components/ui";
import { INDUSTRIES, LANGUAGES, MODES, STATES, TIME_OPTIONS, WEEKDAYS } from "../lib/constants";
import { hhmm } from "../lib/dates";
import { errorMessage, supabase } from "../lib/supabase";

export default function GuideSettings() {
  const { user, guide, isGuide, refresh } = useAuth();
  const toast = useToast();
  const [headline, setHeadline] = useState(guide?.headline ?? "");
  const [bio, setBio] = useState(guide?.bio ?? "");
  const [industry, setIndustry] = useState(guide?.industry ?? "");
  const [expertise, setExpertise] = useState(guide?.expertise.join(", ") ?? "");
  const [years, setYears] = useState(String(guide?.years_experience ?? 0));
  const [languages, setLanguages] = useState<string[]>(guide?.languages ?? ["English"]);
  const [modes, setModes] = useState<string[]>(guide?.modes ?? ["Online"]);
  const [state, setState] = useState(guide?.state ?? "");
  const [minutes, setMinutes] = useState(String(guide?.session_minutes ?? 60));
  const [accepting, setAccepting] = useState(guide?.accepting_requests ?? true);
  const [busy, setBusy] = useState(false);
  const [slots, setSlots] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    supabase.from("availability").select("weekday, start_time").eq("guide_id", user.id)
      .then(({ data }) => setSlots(new Set((data ?? []).map((s) => `${s.weekday}|${hhmm(s.start_time)}`))));
  }, [user]);

  if (!isGuide || !guide) return <Navigate to="/become-guide" replace />;

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!modes.length) return toast("Choose at least one session type.", "error");
    setBusy(true);
    const { error } = await supabase
      .from("guide_profiles")
      .update({
        headline: headline.trim(),
        bio: bio.trim(),
        industry,
        expertise: expertise.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 8),
        years_experience: Number(years) || 0,
        languages,
        modes,
        state: state || null,
        session_minutes: Number(minutes),
        accepting_requests: accepting,
      })
      .eq("user_id", user!.id);
    setBusy(false);
    if (error) return toast(errorMessage(error), "error");
    await refresh();
    toast("Profile saved");
  }

  async function toggleSlot(day: number, time: string) {
    const key = `${day}|${time}`;
    const on = slots.has(key);
    const next = new Set(slots);
    if (on) next.delete(key);
    else next.add(key);
    setSlots(next);
    const { error } = on
      ? await supabase.from("availability").delete().eq("guide_id", user!.id).eq("weekday", day).eq("start_time", time)
      : await supabase.from("availability").insert({ guide_id: user!.id, weekday: day, start_time: time });
    if (error) {
      setSlots(slots);
      toast(errorMessage(error), "error");
    }
  }

  return (
    <>
      <PageHeader
        title="My guide profile"
        subtitle="What learners see, and when they can book you."
        action={<Link to={`/guide/${user!.id}`} className={buttonClass("ghost", "sm")}>View public profile</Link>}
      />

      <Card className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold">Weekly availability</h2>
          <p className="text-sm text-muted">Tap the times you're free each week. Each slot is one {minutes}-minute session. Learners see the next 14 days.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="border-separate border-spacing-1 text-xs">
            <thead>
              <tr>
                <th />
                {WEEKDAYS.map((d) => <th key={d} className="px-1 font-semibold text-muted">{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {TIME_OPTIONS.map((t) => (
                <tr key={t}>
                  <td className="pr-2 font-mono text-muted">{t}</td>
                  {WEEKDAYS.map((d, i) => {
                    const on = slots.has(`${i}|${t}`);
                    return (
                      <td key={d}>
                        <button
                          type="button"
                          aria-pressed={on}
                          aria-label={`${d} ${t}`}
                          onClick={() => toggleSlot(i, t)}
                          className={cx("h-7 w-11 rounded-md border", on ? "border-accent bg-accent" : "border-line bg-surface hover:bg-surface2")}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted">{slots.size} weekly slot{slots.size === 1 ? "" : "s"} set.</p>
      </Card>

      <Card>
        <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-lg bg-surface2 p-3 text-sm font-semibold md:col-span-2">
            <input id="accepting" type="checkbox" className="size-4 accent-[rgb(var(--accent))]" checked={accepting} onChange={(e) => setAccepting(e.target.checked)} />
            Accept new session requests
          </label>
          <div className="md:col-span-2">
            <Field label="Headline"><Input id="gs-headline" required maxLength={90} value={headline} onChange={(e) => setHeadline(e.target.value)} /></Field>
          </div>
          <div className="md:col-span-2">
            <Field label="About you" hint="Your story, who you help best and how your sessions work.">
              <Textarea id="gs-bio" rows={6} maxLength={2000} value={bio} onChange={(e) => setBio(e.target.value)} />
            </Field>
          </div>
          <Field label="Industry">
            <Select id="gs-industry" value={industry} onChange={(e) => setIndustry(e.target.value)}>
              {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
            </Select>
          </Field>
          <Field label="Years of experience"><Input id="gs-years" type="number" min={0} max={70} value={years} onChange={(e) => setYears(e.target.value)} /></Field>
          <div className="md:col-span-2">
            <Field label="Can help with" hint="Up to 8, separated by commas."><Input id="gs-expertise" value={expertise} onChange={(e) => setExpertise(e.target.value)} /></Field>
          </div>
          <Field label="State">
            <Select id="gs-state" value={state} onChange={(e) => setState(e.target.value)}>
              <option value="">Not set</option>
              {STATES.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="Session length">
            <Select id="gs-minutes" value={minutes} onChange={(e) => setMinutes(e.target.value)}>
              {[30, 45, 60, 90].map((m) => <option key={m} value={m}>{m} minutes</option>)}
            </Select>
          </Field>
          <div className="flex flex-col gap-2"><span className="text-[13px] font-semibold">Languages</span><ChipPicker options={LANGUAGES} value={languages} onChange={setLanguages} /></div>
          <div className="flex flex-col gap-2"><span className="text-[13px] font-semibold">Session types</span><ChipPicker options={MODES} value={modes} onChange={setModes} /></div>
          <div className="md:col-span-2"><Button type="submit" loading={busy}>Save profile</Button></div>
        </form>
      </Card>
    </>
  );
}
