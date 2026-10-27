import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { Button, Card, ChipPicker, Field, Input, PageHeader, Select, Textarea } from "../components/ui";
import { GUIDE_TYPES, INDUSTRIES, LANGUAGES, STATES, SUGGESTED_INTERESTS } from "../lib/constants";
import { errorMessage, supabase } from "../lib/supabase";
import type { GuideType } from "../lib/types";

export default function Account() {
  const { user, profile, refresh, signOut, isGuide, isAdmin } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [name, setName] = useState(profile?.full_name ?? "");
  const [state, setState] = useState(profile?.state ?? "");
  const [industry, setIndustry] = useState(profile?.industry ?? "");
  const [wants, setWants] = useState<string[]>(profile?.wants ?? []);
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? []);
  const [languages, setLanguages] = useState<string[]>(profile?.languages ?? []);
  const [goal, setGoal] = useState(profile?.main_goal ?? "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const typeLabels = Object.values(GUIDE_TYPES).map((t) => t.label);
  const toKeys = (labels: string[]) =>
    (Object.keys(GUIDE_TYPES) as GuideType[]).filter((k) => labels.includes(GUIDE_TYPES[k].label));

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name.trim(), state: state || null, industry: industry || null, wants: toKeys(wants), interests, languages, main_goal: goal.trim() || null })
      .eq("id", user!.id);
    setBusy(false);
    if (error) return toast(errorMessage(error), "error");
    await refresh();
    toast("Profile saved");
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return toast(errorMessage(error), "error");
    setPassword("");
    toast("Password changed");
  }

  return (
    <>
      <PageHeader title="Account" subtitle={user?.email} />
      <nav className="flex flex-wrap gap-2 md:hidden">
        {[
          ["/goals", "Goals"], ["/saved", "Saved"],
          ...(isGuide ? [["/guide-settings", "My guide profile"]] : [["/become-guide", "Become a guide"]]),
          ...(isAdmin ? [["/admin", "Admin"]] : []),
        ].map(([to, label]) => (
          <Link key={to} to={to} className="rounded-full bg-surface2 px-3 py-1.5 text-sm font-semibold">{label}</Link>
        ))}
      </nav>

      <Card>
        <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
          <Field label="Full name"><Input id="acc-name" required value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="State">
            <Select id="acc-state" value={state} onChange={(e) => setState(e.target.value)}>
              <option value="">Not set</option>
              {STATES.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="Industry or field">
            <Select id="acc-industry" value={industry} onChange={(e) => setIndustry(e.target.value)}>
              <option value="">Not set</option>
              {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
            </Select>
          </Field>
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold">Help I'm looking for</span>
            <ChipPicker options={typeLabels} value={wants.map((w) => GUIDE_TYPES[w as GuideType]?.label ?? w)} onChange={setWants} />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <span className="text-[13px] font-semibold">Interests</span>
            <ChipPicker options={[...new Set([...SUGGESTED_INTERESTS, ...interests])]} value={interests} onChange={setInterests} />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <span className="text-[13px] font-semibold">Languages</span>
            <ChipPicker options={LANGUAGES} value={languages} onChange={setLanguages} />
          </div>
          <div className="md:col-span-2">
            <Field label="Main goal"><Textarea id="acc-goal" maxLength={300} value={goal} onChange={(e) => setGoal(e.target.value)} /></Field>
          </div>
          <div className="md:col-span-2"><Button type="submit" loading={busy}>Save changes</Button></div>
        </form>
      </Card>

      <Card>
        <form onSubmit={changePassword} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <Field label="New password" hint="At least 8 characters.">
              <Input id="acc-password" type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
            </Field>
          </div>
          <Button type="submit" variant="ghost">Change password</Button>
        </form>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">To delete your account and data, contact the Mentoral team.</p>
        <Button variant="danger" onClick={async () => { await signOut(); navigate("/"); }}>Sign out</Button>
      </div>
    </>
  );
}
