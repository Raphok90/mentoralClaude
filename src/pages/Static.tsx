import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { PublicFooter, PublicHeader } from "../components/Layout";
import { buttonClass } from "../components/ui";

function Page({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <PublicHeader />
      <main className="gutter mx-auto max-w-3xl py-12">
        <h1 className="text-4xl font-extrabold">{title}</h1>
        <div className="mt-6 flex flex-col gap-4 leading-relaxed [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-bold [&_li]:ml-5 [&_li]:list-disc">
          {children}
        </div>
      </main>
      <PublicFooter />
    </>
  );
}

export const About = () => (
  <Page title="About Mentoral">
    <p>
      Mentoral helps people find trusted guidance at every stage of life and work, from students preparing for exams
      to professionals planning their next move.
    </p>
    <p>
      We bring mentors, counsellors and tutors into one place, check every guide before they appear, and keep the
      platform free while we grow. We are starting in Nigeria and plan to grow across Africa.
    </p>
  </Page>
);

export const Guidelines = () => (
  <Page title="Community guidelines">
    <h2>For everyone</h2>
    <ul>
      <li>Be respectful and keep conversations professional.</li>
      <li>No harassment, hate speech or sexual content.</li>
      <li>Do not ask for or send money through Mentoral sessions.</li>
      <li>Keep personal contact details private until you trust the other person.</li>
    </ul>
    <h2>For guides</h2>
    <ul>
      <li>Only offer guidance within your real experience and qualifications.</li>
      <li>Reply to requests within 48 hours, or pause new requests in your settings.</li>
      <li>Sessions with learners under 18 must stay online.</li>
    </ul>
    <h2>Counselling is not crisis care</h2>
    <p>
      Mentoral is not an emergency service. If you or someone else is in danger, contact local emergency services
      straight away.
    </p>
    <h2>Reporting</h2>
    <p>Use the Report button on any profile or conversation. Our team reviews every report.</p>
  </Page>
);

export const Privacy = () => (
  <Page title="Privacy policy">
    <p className="rounded-lg bg-surface2 p-4 text-sm">
      Draft for review. Have a lawyer check this against the Nigeria Data Protection Act 2023 before launch.
    </p>
    <h2>What we collect</h2>
    <ul>
      <li>Account details: name, email and password (stored securely by our authentication provider).</li>
      <li>Profile details you choose to add: state, languages, interests and goals.</li>
      <li>For guides: work history and an identity document, used only for verification.</li>
      <li>Session requests, messages and reviews you create.</li>
    </ul>
    <h2>How we use it</h2>
    <p>To match you with guides, run sessions, keep the platform safe and improve Mentoral. We do not sell your data.</p>
    <h2>Your rights</h2>
    <p>You can see, correct or delete your data. Contact the Mentoral team to request deletion of your account.</p>
  </Page>
);

export const Terms = () => (
  <Page title="Terms of use">
    <p className="rounded-lg bg-surface2 p-4 text-sm">Draft for review by a lawyer before launch.</p>
    <p>
      Mentoral is a platform that connects learners with independent guides. Guides are not Mentoral employees, and
      advice given in sessions is the responsibility of the guide giving it.
    </p>
    <p>You must follow the community guidelines. We may suspend accounts that break them.</p>
    <p>Mentoral is currently free. If we introduce paid features we will tell you before anything changes.</p>
  </Page>
);

export const NotFound = () => (
  <Page title="Page not found">
    <p>The page you were looking for does not exist or has moved.</p>
    <Link to="/" className={buttonClass("primary") + " self-start"}>Go to the home page</Link>
  </Page>
);
