import type { DirectoryGuide, Profile } from "./types";

export interface Match {
  score: number;
  reasons: string[];
}

/** Rule-based match score from the feature plan (section 6). */
export function matchGuide(learner: Profile | null, guide: DirectoryGuide, hasSlotThisWeek: boolean): Match | null {
  if (!learner || !learner.onboarded) return null;
  let score = 20;
  const reasons: string[] = [];

  if (learner.wants.includes(guide.type)) score += 25;
  if (learner.industry && learner.industry === guide.industry) {
    score += 20;
    reasons.push("Same industry");
  }
  const interests = new Set(learner.interests.map((i) => i.toLowerCase()));
  const shared = guide.expertise.filter((e) => interests.has(e.toLowerCase()));
  if (shared.length) {
    score += Math.min(shared.length, 3) * 10;
    reasons.push(shared.length === 1 ? `Knows ${shared[0]}` : `Shares ${shared.length} of your interests`);
  }
  const extraLang = guide.languages.find((l) => l !== "English" && learner.languages.includes(l));
  if (extraLang) {
    score += 5;
    reasons.push(`Speaks ${extraLang}`);
  }
  if (learner.state && learner.state === guide.state) {
    score += 5;
    reasons.push(`Also in ${guide.state}`);
  }
  if (hasSlotThisWeek) score += 5;
  if (guide.review_count > 0 && Number(guide.avg_rating) >= 4.5) score += 5;

  return { score: Math.min(score, 99), reasons: reasons.slice(0, 2) };
}
