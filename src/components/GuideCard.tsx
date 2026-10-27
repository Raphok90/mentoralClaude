import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import type { DirectoryGuide } from "../lib/types";
import type { Match } from "../lib/match";
import { Avatar, Chip, Rating, TypeTag, Verified } from "./ui";

export function GuideCard({ guide, match }: { guide: DirectoryGuide; match?: Match | null }) {
  return (
    <Link
      to={`/guide/${guide.user_id}`}
      className="flex min-w-0 flex-col gap-3 rounded-xl border border-line bg-surface p-5 transition hover:border-accent"
    >
      <div className="flex items-start gap-3">
        <Avatar name={guide.full_name} url={guide.avatar_url} size={52} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-[17px] font-bold">{guide.full_name}</h3>
            <Verified />
          </div>
          <p className="line-clamp-2 text-sm text-muted">{guide.headline}</p>
        </div>
        {match && (
          <span className="whitespace-nowrap rounded-md bg-accentsoft px-2 py-0.5 font-mono text-xs text-accent">{match.score}% match</span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
        <TypeTag type={guide.type} />
        <span>{guide.industry}</span>
        {guide.state && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" />
            {guide.state}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {guide.expertise.slice(0, 3).map((e) => (
          <Chip key={e}>{e}</Chip>
        ))}
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
        <Rating avg={guide.avg_rating} count={guide.review_count} />
        <span className="text-[13px] text-muted">{guide.languages.join(" · ")}</span>
      </div>
      {match?.reasons.length ? <p className="text-xs text-accent">{match.reasons.join(" · ")}</p> : null}
    </Link>
  );
}
