import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Search } from "lucide-react";
import { AdaptiveShell } from "../components/Layout";
import { GuideCard } from "../components/GuideCard";
import { Button, Empty, Input, PageHeader, Select, Spinner } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { fetchAvailability, fetchDirectory, hasSlotSoon } from "../lib/api";
import { GUIDE_TYPES, INDUSTRIES, LANGUAGES, STATES } from "../lib/constants";
import { matchGuide } from "../lib/match";
import type { DirectoryGuide, GuideType, Slot } from "../lib/types";

type Sort = "match" | "rating" | "sessions" | "newest";

export default function Discover() {
  const { type } = useParams();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const activeType = (type && type in GUIDE_TYPES ? type : "all") as GuideType | "all";

  const [guides, setGuides] = useState<DirectoryGuide[] | null>(null);
  const [slots, setSlots] = useState<Record<string, Slot[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [industry, setIndustry] = useState("all");
  const [state, setState] = useState("all");
  const [language, setLanguage] = useState("all");
  const [mode, setMode] = useState("all");
  const [freeThisWeek, setFreeThisWeek] = useState(false);
  const [sort, setSort] = useState<Sort>(user ? "match" : "rating");

  useEffect(() => {
    fetchDirectory()
      .then(async (g) => {
        setGuides(g);
        setSlots(await fetchAvailability(g.map((x) => x.user_id)));
      })
      .catch(() => setError("We could not load guides. Check your connection and refresh the page."));
  }, []);

  const results = useMemo(() => {
    if (!guides) return [];
    const needle = q.trim().toLowerCase();
    return guides
      .filter((g) => activeType === "all" || g.type === activeType)
      .filter((g) => industry === "all" || g.industry === industry)
      .filter((g) => state === "all" || g.state === state)
      .filter((g) => language === "all" || g.languages.includes(language))
      .filter((g) => mode === "all" || g.modes.includes(mode))
      .filter((g) => !freeThisWeek || hasSlotSoon(slots[g.user_id]))
      .filter(
        (g) =>
          !needle ||
          [g.full_name, g.headline, g.industry, ...g.expertise].some((s) => s.toLowerCase().includes(needle)),
      )
      .map((g) => ({ g, m: matchGuide(profile, g, hasSlotSoon(slots[g.user_id])) }))
      .sort((a, b) => {
        if (sort === "match") return (b.m?.score ?? 0) - (a.m?.score ?? 0) || Number(b.g.avg_rating) - Number(a.g.avg_rating);
        if (sort === "rating") return Number(b.g.avg_rating) - Number(a.g.avg_rating) || b.g.review_count - a.g.review_count;
        if (sort === "sessions") return b.g.sessions_completed - a.g.sessions_completed;
        return b.g.created_at.localeCompare(a.g.created_at);
      });
  }, [guides, slots, q, activeType, industry, state, language, mode, freeThisWeek, sort, profile]);

  const clear = () => {
    setQ("");
    setIndustry("all");
    setState("all");
    setLanguage("all");
    setMode("all");
    setFreeThisWeek(false);
  };

  return (
    <AdaptiveShell>
      <PageHeader
        title={activeType === "all" ? "Find a guide" : GUIDE_TYPES[activeType].plural}
        subtitle={activeType === "all" ? "Verified mentors, counsellors and tutors." : GUIDE_TYPES[activeType].blurb}
      />

      <div className="flex gap-1 overflow-x-auto border-b border-line" role="tablist">
        {(["all", "mentor", "counsellor", "tutor"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={activeType === t}
            onClick={() => navigate(t === "all" ? "/browse" : `/browse/${t}`)}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold ${
              activeType === t ? "border-accent text-accent" : "border-transparent text-muted hover:text-fg"
            }`}
          >
            {t === "all" ? "All" : GUIDE_TYPES[t].plural}
          </button>
        ))}
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-[2fr_repeat(4,1fr)]">
        <label className="relative sm:col-span-2 lg:col-span-1">
          <span className="sr-only">Search</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input id="search" className="pl-9" placeholder="Search by name, skill or subject" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <Select id="industry" aria-label="Industry" value={industry} onChange={(e) => setIndustry(e.target.value)}>
          <option value="all">All industries</option>
          {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
        </Select>
        <Select id="state" aria-label="State" value={state} onChange={(e) => setState(e.target.value)}>
          <option value="all">Any state</option>
          {STATES.map((s) => <option key={s}>{s}</option>)}
        </Select>
        <Select id="language" aria-label="Language" value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="all">Any language</option>
          {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
        </Select>
        <Select id="mode" aria-label="Session mode" value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="all">Online or in person</option>
          <option>Online</option>
          <option>In person</option>
        </Select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <label className="flex cursor-pointer items-center gap-2">
          <input id="free-week" type="checkbox" checked={freeThisWeek} onChange={(e) => setFreeThisWeek(e.target.checked)} className="size-4 accent-[rgb(var(--accent))]" />
          Has free times this week
        </label>
        <div className="flex items-center gap-2">
          <span className="text-muted">{guides ? `${results.length} guide${results.length === 1 ? "" : "s"}` : ""}</span>
          <Select id="sort" aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="w-auto">
            {user && <option value="match">Best match</option>}
            <option value="rating">Highest rated</option>
            <option value="sessions">Most sessions</option>
            <option value="newest">Newest</option>
          </Select>
        </div>
      </div>

      {error ? (
        <Empty title="Something went wrong">{error}</Empty>
      ) : !guides ? (
        <Spinner />
      ) : results.length === 0 ? (
        <Empty title={guides.length ? "No guides match these filters" : "No verified guides yet"}>
          {guides.length ? (
            <Button variant="ghost" size="sm" onClick={clear}>Clear filters</Button>
          ) : (
            "Guides appear here once our team approves their applications."
          )}
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map(({ g, m }) => <GuideCard key={g.user_id} guide={g} match={m} />)}
        </div>
      )}
    </AdaptiveShell>
  );
}
