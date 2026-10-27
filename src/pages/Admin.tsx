import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../components/Toast";
import { Button, Card, Empty, Input, PageHeader, Spinner, StatusPill, TypeTag, cx } from "../components/ui";
import { GUIDE_TYPES } from "../lib/constants";
import { formatAgo } from "../lib/dates";
import { errorMessage, supabase } from "../lib/supabase";
import type { Application, GuideProfile } from "../lib/types";

type Tab = "applications" | "guides" | "reports";
type AppRow = Application & { applicant: { full_name: string } | null };
type GuideRow = GuideProfile & { profile: { full_name: string } | null };

interface ReportRow {
  id: string;
  reason: string;
  status: "open" | "resolved";
  created_at: string;
  reporter: { full_name: string } | null;
  target: { full_name: string } | null;
  target_user_id: string;
}

export default function Admin() {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("applications");
  const [apps, setApps] = useState<AppRow[] | null>(null);
  const [guides, setGuides] = useState<GuideRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const [a, g, r] = await Promise.all([
      supabase.from("guide_applications").select("*, applicant:profiles!guide_applications_user_id_fkey(full_name)").order("created_at", { ascending: false }),
      supabase.from("guide_profiles").select("*, profile:profiles!guide_profiles_user_id_fkey(full_name)").order("created_at", { ascending: false }),
      supabase
        .from("reports")
        .select("*, reporter:profiles!reports_reporter_id_fkey(full_name), target:profiles!reports_target_user_id_fkey(full_name)")
        .order("created_at", { ascending: false }),
    ]);
    setApps((a.data ?? []) as AppRow[]);
    setGuides((g.data ?? []) as GuideRow[]);
    setReports((r.data ?? []) as ReportRow[]);
  }, []);

  useEffect(() => void load(), [load]);

  async function call(p: PromiseLike<{ error: unknown }>, ok: string) {
    const { error } = await p;
    if (error) return toast(errorMessage(error), "error");
    toast(ok);
    await load();
  }

  async function openId(path: string) {
    const { data, error } = await supabase.storage.from("id-documents").createSignedUrl(path, 120);
    if (error || !data) return toast(errorMessage(error), "error");
    window.open(data.signedUrl, "_blank", "noopener");
  }

  if (!apps) return <Spinner />;
  const pending = apps.filter((a) => a.status === "pending");
  const openReports = reports.filter((r) => r.status === "open");

  return (
    <>
      <PageHeader title="Admin" subtitle={`${pending.length} applications waiting · ${openReports.length} open reports · ${guides.filter((g) => g.verified).length} verified guides`} />
      <div className="flex gap-1 overflow-x-auto border-b border-line" role="tablist">
        {(["applications", "guides", "reports"] as Tab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cx("whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold capitalize", tab === t ? "border-accent text-accent" : "border-transparent text-muted")}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "applications" &&
        (apps.length === 0 ? (
          <Empty title="No applications yet" />
        ) : (
          <div className="flex flex-col gap-3">
            {apps.map((a) => (
              <Card key={a.id} className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <b>{a.applicant?.full_name ?? "Unknown"}</b>
                  <TypeTag type={a.type} />
                  <StatusPill status={a.status} />
                  <span className="text-xs text-muted">{formatAgo(a.created_at)}</span>
                </div>
                <p className="text-sm">{a.headline} · {a.industry} · {a.years_experience} years · {a.state ?? "No state"}</p>
                <p className="text-sm text-muted">Topics: {a.expertise.join(", ")} · Languages: {a.languages.join(", ")}</p>
                {a.motivation && <p className="text-sm">"{a.motivation}"</p>}
                <div className="flex flex-wrap gap-3 text-sm">
                  {a.links && <a href={a.links} target="_blank" rel="noreferrer" className="font-semibold text-accent">Open profile link</a>}
                  {a.id_document_path && <button className="font-semibold text-accent" onClick={() => openId(a.id_document_path!)}>View ID document</button>}
                </div>
                {a.status === "pending" && (
                  <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
                    <Input
                      id={`note-${a.id}`}
                      aria-label="Note to applicant"
                      className="min-w-[200px] flex-1"
                      placeholder="Note to applicant (shown if rejected)"
                      value={notes[a.id] ?? ""}
                      onChange={(e) => setNotes({ ...notes, [a.id]: e.target.value })}
                    />
                    <Button size="sm" onClick={() => call(supabase.rpc("review_application", { p_id: a.id, p_approve: true, p_note: notes[a.id] || null }), "Approved. The guide is now live.")}>
                      Approve and verify
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => call(supabase.rpc("review_application", { p_id: a.id, p_approve: false, p_note: notes[a.id] || null }), "Application rejected")}>
                      Reject
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ))}

      {tab === "guides" &&
        (guides.length === 0 ? (
          <Empty title="No guides yet" />
        ) : (
          <Card className="p-0">
            <ul className="divide-y divide-line">
              {guides.map((g) => (
                <li key={g.user_id} className="flex flex-wrap items-center gap-3 p-4">
                  <div className="min-w-[200px] flex-1">
                    <Link to={`/guide/${g.user_id}`} className="font-semibold hover:underline">{g.profile?.full_name}</Link>
                    <p className="text-sm text-muted">{GUIDE_TYPES[g.type].label} · {g.headline}</p>
                  </div>
                  <span className={cx("text-sm font-semibold", g.verified ? "text-accent" : "text-warn")}>{g.verified ? "Verified" : "Hidden"}</span>
                  <Button size="sm" variant={g.verified ? "danger" : "primary"} onClick={() => call(supabase.rpc("admin_set_verified", { p_guide: g.user_id, p_verified: !g.verified }), g.verified ? "Guide hidden from search" : "Guide verified")}>
                    {g.verified ? "Suspend" : "Verify"}
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        ))}

      {tab === "reports" &&
        (reports.length === 0 ? (
          <Empty title="No reports" />
        ) : (
          <Card className="p-0">
            <ul className="divide-y divide-line">
              {reports.map((r) => (
                <li key={r.id} className="flex flex-wrap items-start gap-3 p-4">
                  <div className="min-w-[220px] flex-1">
                    <p className="text-sm"><b>{r.reporter?.full_name}</b> reported <b>{r.target?.full_name}</b> · <span className="text-muted">{formatAgo(r.created_at)}</span></p>
                    <p className="mt-1 text-sm">{r.reason}</p>
                  </div>
                  {r.status === "open" ? (
                    <Button size="sm" variant="ghost" onClick={() => call(supabase.from("reports").update({ status: "resolved" }).eq("id", r.id), "Report resolved")}>Mark resolved</Button>
                  ) : (
                    <span className="text-sm text-muted">Resolved</span>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        ))}
    </>
  );
}
