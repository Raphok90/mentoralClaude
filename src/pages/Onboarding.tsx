import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "../components/Layout";
import { Button, Card, ChipPicker, Field, Input, Select, Textarea } from "../components/ui";
import { useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import { errorMessage, supabase } from "../lib/supabase";
import { GUIDE_TYPES, INDUSTRIES, LANGUAGES, STATES, SUGGESTED_INTERESTS } from "../lib/constants";
import type { GuideType } from "../lib/types";

export default function Onboarding() {
  const { user, profile, refresh } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile?.full_name ?? "");
  const [wants, setWants] = useState<GuideType[]>(profile?.wants ?? []);
  const [industry, setIndustry] = useState(profile?.industry ?? "");
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? []);
  const [extra, setExtra] = useState("");
  const [languages, setLanguages] = useState<string[]>(profile?.languages?.length ? profile.languages : ["English"]);
  const [state, setState] = useState(profile?.state ?? "");
  const [goal, setGoal] = useState(profile?.main_goal ?? "");
  const [busy, setBusy] = useState(false);

  const typeLabels = Object.entries(GUIDE_TYPES).map(([k, v]) => ({ k: k as GuideType, label: v.label }));

  async function finish(skip = false) {
    if (!user) return;
    setBusy(true);
    const custom = extra.split(",").map((s) => s.trim()).filter(Boolean);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: name.trim() || profile?.full_name || "",
        wants,
        industry: industry || null,
        interests: [...new Set([...interests, ...custom])],
        languages,
        state: state || null,
        main_goal: goal.trim() || null,
        onboarded: true,
      })
      .eq("id", user.id);
    setBusy(false);
    if (error) return toast(errorMessage(error), "error");
    await refresh();
    if (!skip) toast("You're all set");
    navigate("/dashboard", { replace: true });
  }

  return (
    <div className="gutter mx-auto flex min-h-screen max-w-xl flex-col gap-6 py-8">
      <Logo />
      <div className="flex gap-1.5" aria-label={`Step ${step + 1} of 3`}>
        {[0, 1, 2].map((i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-accent" : "bg-surface2"}`} />)}
      </div>
      <Card className="flex flex-col gap-5 p-6">
        {step === 0 && (
          <>
            <div>
              <h1 className="text-2xl font-extrabold">What help are you looking for?</h1>
              <p className="mt-1 text-sm text-muted">Pick one or more. You can change this later.</p>
            </div>
            <Field label="Your name">
              <Input id="full-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <div className="grid gap-2">
              {typeLabels.map(({ k, label }) => {
                const on = wants.includes(k);
                return (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setWants(on ? wants.filter((w) => w !== k) : [...wants, k])}
                    className={`rounded-xl border p-4 text-left transition ${on ? "border-accent bg-accentsoft" : "border-line hover:bg-surface2"}`}
                  >
                    <b>{label}</b>
                    <p className="text-sm text-muted">{GUIDE_TYPES[k].blurb}</p>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <h1 className="text-2xl font-extrabold">Tell us about you</h1>
              <p className="mt-1 text-sm text-muted">This is how we match you with the right guides.</p>
            </div>
            <Field label="Industry or field">
              <Select id="industry" value={industry} onChange={(e) => setIndustry(e.target.value)}>
                <option value="">Choose one</option>
                {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
              </Select>
            </Field>
            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold">Interests</span>
              <ChipPicker options={SUGGESTED_INTERESTS} value={interests} onChange={setInterests} />
              <Input id="extra-interests" placeholder="Others, separated by commas" value={extra} onChange={(e) => setExtra(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold">Languages you speak</span>
              <ChipPicker options={LANGUAGES} value={languages} onChange={setLanguages} />
            </div>
            <Field label="State">
              <Select id="state" value={state} onChange={(e) => setState(e.target.value)}>
                <option value="">Choose one</option>
                {STATES.map((s) => <option key={s}>{s}</option>)}
              </Select>
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <h1 className="text-2xl font-extrabold">What is your main goal?</h1>
              <p className="mt-1 text-sm text-muted">One sentence is enough. Guides see this when you request a session.</p>
            </div>
            <Field label="My goal">
              <Textarea id="goal" maxLength={300} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. Pass JAMB with 280+ and get into Medicine at UNILAG" />
            </Field>
          </>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
          <button className="text-sm text-muted hover:text-fg" onClick={() => finish(true)} disabled={busy}>Skip for now</button>
          <div className="flex gap-2">
            {step > 0 && <Button variant="ghost" onClick={() => setStep(step - 1)}>Back</Button>}
            {step < 2 ? (
              <Button onClick={() => setStep(step + 1)} disabled={step === 0 && !name.trim()}>Continue</Button>
            ) : (
              <Button onClick={() => finish()} loading={busy}>Finish</Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
