import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GuideCard } from "../components/GuideCard";
import { Empty, PageHeader, Spinner } from "../components/ui";
import { fetchDirectory } from "../lib/api";
import { supabase } from "../lib/supabase";
import type { DirectoryGuide } from "../lib/types";

export default function Saved() {
  const { user } = useAuth();
  const [guides, setGuides] = useState<DirectoryGuide[] | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("saved_guides").select("guide_id").eq("user_id", user.id);
      setGuides(await fetchDirectory((data ?? []).map((r) => r.guide_id)));
    })().catch(() => setGuides([]));
  }, [user]);

  if (!guides) return <Spinner />;
  return (
    <>
      <PageHeader title="Saved guides" subtitle="Your shortlist." />
      {guides.length === 0 ? (
        <Empty title="Nothing saved yet">
          Tap Save on a guide's profile to keep them here. <Link to="/browse" className="font-semibold text-accent">Browse guides</Link>
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{guides.map((g) => <GuideCard key={g.user_id} guide={g} />)}</div>
      )}
    </>
  );
}
