import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { Button, Card, ChipPicker, Field, Input, PageHeader, Select, Spinner, StatusPill, Textarea, buttonClass } from "../components/ui";
import { GUIDE_TYPES, INDUSTRIES, LANGUAGES, STATES } from "../lib/constants";
import { formatDate } from "../lib/dates";
import { errorMessage, supabase } from "../lib/supabase";
import type { Application, GuideType } from "../lib/types";

const MAX_FILE = 5 * 1024 * 1024;

export default function BecomeGuide() {
  const { user, profile, isGuide } = useAuth();
  const toast = useToast();
  const [latest, setLatest] = useState<Application | null | undefined>(undefined);
  const [type, setType] = useState<GuideType>("mentor");
  const [headline, setHeadline] = useState("");
  const [industry, setIndustry] = useState(profile?.industry ?? "");
  const [years, setYears] = useState("3");
  const [expertise, setExpertise] = useState("");
  const [languages, setLanguages] = useState<string[]>(["English"]);
  const [state, setState] = useState(profile?.state ?? "");
  const [links, setLinks] = useState("");
  const [motivation, setMotivation] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [reapply, setReapply] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("guide_applications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => setLatest((data as Application) ?? null));
  }, [user]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!file) return toast("Upload a photo or PDF of your ID.", "error");
    if (file.size > MAX_FILE) return toast("The ID file must be 5 MB or smaller.", "error");
    setBusy(true);
    try {
      const path = `${user.id}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
      const up = await supabase.storage.from("id-documents").upload(path, file, { upsert: false });
      if (up.error) throw up.error;
      const { data, error } = await supabase
        .from("guide_applications")
        .insert({
          user_id: user.id,
          type,
          headline: headline.trim(),
          industry,
          years_experience: Number(years) || 0,
          expertise: expertise.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 8),
          languages,
          state: state || null,
          links: links.trim() || null,
          id_document_path: path,
          motivation: motivation.trim() || null,
        })
        .select()
        .single();
      if (error) throw error;
      setLatest(data as Application);
      setReapply(false);
      toast("Application sent. We'll review it within 3 working days.");
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  }

  if (latest === undefined) return <Spinner />;

  if (isGuide)
    return (
      <>
        <PageHeader title="You're a guide" subtitle="Your profile is live for learners." />
        <Link to="/guide-settings" className={buttonClass() + " self-start"}>Edit profile and availability</Link>
      </>
    );

  if (latest && !reapply && latest.status !== "approved")
    return (
      <>
        <PageHeader title="Your application" />
        <Card className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <b>{GUIDE_TYPES[latest.type].label} · {latest.headline}</b>
            <StatusPill status={latest.status} />
          </div>
          <p className="text-sm text-muted">Sent {formatDate(latest.created_at)}</p>
          {latest.status === "pending" && <p className="text-sm">Our team checks your ID and links by hand. We'll update this page within 3 working days.</p>}
          {latest.status === "rejected" && (
            <>
              <p className="text-sm">{latest.admin_note ? `Note from our team: ${latest.admin_note}` : "Your application was not approved this time."}</p>
              <Button className="self-start" onClick={() => setReapply(true)}>Apply again</Button>
            </>
          )}
        </Card>
      </>
    );

  return (
    <>
      <PageHeader title="Become a guide" subtitle="Share your experience as a mentor, counsellor or tutor. It's free, and every guide is verified." />
      <Card>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <Field label="I want to be a">
            <Select id="app-type" value={type} onChange={(e) => setType(e.target.value as GuideType)}>
              {Object.entries(GUIDE_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </Select>
          </Field>
          <Field label="Industry or subject area">
            <Select id="app-industry" required value={industry} onChange={(e) => setIndustry(e.target.value)}>
              <option value="">Choose one</option>
              {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
            </Select>
          </Field>
          <div className="md:col-span-2">
            <Field label="Headline" hint="Your current role in one line, e.g. 'Process engineer in oil and gas'.">
              <Input id="app-headline" required maxLength={90} value={headline} onChange={(e) => setHeadline(e.target.value)} />
            </Field>
          </div>
          <Field label="Years of experience">
            <Input id="app-years" type="number" min={0} max={70} required value={years} onChange={(e) => setYears(e.target.value)} />
          </Field>
          <Field label="State">
            <Select id="app-state" value={state} onChange={(e) => setState(e.target.value)}>
              <option value="">Choose one</option>
              {STATES.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </Field>
          <div className="md:col-span-2">
            <Field label="What can you help with?" hint="Up to 8 topics, separated by commas.">
              <Input id="app-expertise" required value={expertise} onChange={(e) => setExpertise(e.target.value)} placeholder="CV review, Interviews, Career switching" />
            </Field>
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <span className="text-[13px] font-semibold">Languages you can guide in</span>
            <ChipPicker options={LANGUAGES} value={languages} onChange={setLanguages} />
          </div>
          <div className="md:col-span-2">
            <Field label="LinkedIn profile or certificate link" hint="We use this to confirm your experience.">
              <Input id="app-links" type="url" required value={links} onChange={(e) => setLinks(e.target.value)} placeholder="https://linkedin.com/in/..." />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Government ID (NIN slip, passport or driver's licence)" hint="JPG, PNG or PDF, up to 5 MB. Only our verification team can see it.">
              <input id="app-id" type="file" accept="image/jpeg,image/png,application/pdf" required onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="input" />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Why do you want to guide others? (optional)">
              <Textarea id="app-motivation" maxLength={800} value={motivation} onChange={(e) => setMotivation(e.target.value)} />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Button type="submit" loading={busy}>Submit application</Button>
          </div>
        </form>
      </Card>
    </>
  );
}
