import { Link } from "react-router-dom";
import { BadgeCheck, GraduationCap, HeartHandshake, MessageSquareLock, Star, Users } from "lucide-react";
import { PublicFooter, PublicHeader } from "../components/Layout";
import { buttonClass } from "../components/ui";
import { GUIDE_TYPES } from "../lib/constants";
import type { GuideType } from "../lib/types";

const trackIcons: Record<GuideType, typeof Users> = { mentor: Users, counsellor: HeartHandshake, tutor: GraduationCap };
const trackExamples: Record<GuideType, string> = {
  mentor: "Tech, finance, health, law, energy, creative work, starting a business",
  counsellor: "Career direction, university choices, money, stress and exam anxiety",
  tutor: "WAEC and JAMB subjects, university courses, IELTS, coding and data",
};

const steps = [
  ["Tell us your goals", "Pick the help you need, your field and what you want to achieve."],
  ["Get matched", "See verified guides ranked by how well they fit your goals."],
  ["Request a session", "Choose a free time slot. The guide accepts and you chat to prepare."],
  ["Review and grow", "Rate the session, track your goals and book the next step."],
];

const trust = [
  [BadgeCheck, "Verified guides", "Every guide is checked with a government ID and a LinkedIn profile or certificate before they appear."],
  [Star, "Real reviews", "Only learners who completed a session can leave a review."],
  [MessageSquareLock, "Safe messaging", "Chat opens only after a session request, and every conversation can be reported."],
] as const;

export default function Landing() {
  return (
    <>
      <PublicHeader />
      <section className="gutter mx-auto grid max-w-6xl items-center gap-10 py-14 md:grid-cols-[1.2fr_1fr] md:py-20">
        <div>
          <p className="eyebrow">Mentorship · Counselling · Tutoring</p>
          <h1 className="mt-3 text-[clamp(38px,6vw,64px)] font-extrabold leading-[1.02]">
            Learn from someone who has <span className="text-accent">done it before.</span>
          </h1>
          <p className="mt-5 max-w-[52ch] text-lg text-muted">
            Mentoral connects you with verified mentors, counsellors and tutors across every industry in Nigeria.
            Free to join and free to book while we grow.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/browse" className={buttonClass("primary", "lg")}>Find a guide</Link>
            <Link to="/auth?mode=signup&next=/become-guide" className={buttonClass("ghost", "lg")}>Become a guide</Link>
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-6">
          <p className="eyebrow">How a match looks</p>
          <div className="mt-4 flex flex-col gap-3">
            {[
              ["You want", "Move from banking operations into software engineering"],
              ["You get", "A mentor in Technology who made a similar switch"],
              ["Why", "Same industry · shares 3 of your interests · free this week"],
            ].map(([k, v]) => (
              <div key={k} className="grid grid-cols-[84px_1fr] gap-3 border-b border-line pb-3 last:border-0">
                <span className="text-sm font-semibold text-muted">{k}</span>
                <span className="text-sm">{v}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">Example only.</p>
        </div>
      </section>

      <section className="border-t border-line py-14">
        <div className="gutter mx-auto max-w-6xl">
          <h2 className="text-3xl font-extrabold">Three kinds of help, one place</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {(Object.keys(GUIDE_TYPES) as GuideType[]).map((t) => {
              const Icon = trackIcons[t];
              return (
                <Link key={t} to={`/browse/${t}`} className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-6 transition hover:border-accent">
                  <Icon className="size-7 text-accent" />
                  <h3 className="text-2xl font-extrabold">{GUIDE_TYPES[t].plural}</h3>
                  <p className="text-muted">{GUIDE_TYPES[t].blurb}</p>
                  <p className="text-sm">{trackExamples[t]}</p>
                  <span className="mt-auto text-sm font-semibold text-accent">Browse {GUIDE_TYPES[t].plural.toLowerCase()} →</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-line py-14">
        <div className="gutter mx-auto max-w-6xl">
          <h2 className="text-3xl font-extrabold">How it works</h2>
          <ol className="mt-6 grid gap-6 sm:grid-cols-2 md:grid-cols-4">
            {steps.map(([title, body], i) => (
              <li key={title} className="flex flex-col gap-2">
                <span className="grid size-8 place-items-center rounded-full border-2 border-accent font-mono text-sm text-accent">{i + 1}</span>
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="text-sm text-muted">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-line py-14">
        <div className="gutter mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {trust.map(([Icon, title, body]) => (
            <div key={title} className="flex flex-col gap-2">
              <Icon className="size-6 text-accent" />
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="text-sm text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-line bg-accent py-14 text-accentfg">
        <div className="gutter mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-extrabold">Have experience to share?</h2>
            <p className="mt-2 max-w-[56ch] opacity-90">Apply to guide others. It takes about five minutes, and our team reviews every application.</p>
          </div>
          <Link to="/auth?mode=signup&next=/become-guide" className="rounded-full bg-accentfg px-6 py-3 font-semibold text-accent">
            Apply to be a guide
          </Link>
        </div>
      </section>
      <PublicFooter />
    </>
  );
}
