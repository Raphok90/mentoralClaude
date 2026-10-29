# Mentoral

Mentoral connects learners with verified **mentors, counsellors and tutors** across every industry in Nigeria. It is free to use while we grow.

Built with React, TypeScript, Vite and Tailwind CSS, with Supabase for the database, sign-in, file storage and live chat.

## Features

- Email and password sign-in, Google sign-in, and password reset
- Onboarding that records the help you want, your industry, interests, languages, state and main goal
- Guide discovery with search, filters (type, industry, state, language, online or in person, free this week) and a match score
- Guide profiles with reviews and bookable free times for the next 14 days
- Session requests with a status flow: pending → accepted → completed (or declined / cancelled)
- Chat for each session, with live updates
- Reviews, allowed only after a completed session
- Goals with steps and progress bars
- Saved guides
- Become-a-guide applications with ID upload, and an admin console to approve guides, verify them and handle reports
- Guide settings, including a weekly availability grid and a switch to pause requests

The full product plan is in [docs/FEATURE-PLAN.md](docs/FEATURE-PLAN.md).

## Run it locally

You need Node.js 18 or newer.

1. **Create a Supabase project** (free) at https://supabase.com. A London or Frankfurt region is close to Nigeria.
2. **Create the database.** In Supabase, open **SQL Editor → New query**, paste the whole of `supabase/schema.sql`, and click **Run**.
3. **Add your keys.** Copy `.env.example` to `.env`, then fill in the **Project URL** and **anon public** key from **Project Settings → API**.
4. **Install and start:**
   ```bash
   npm install
   npm run dev
   ```
   Open http://localhost:5173.
5. **Make yourself an admin.** Sign up in the app, then run this in the SQL Editor with your email:
   ```sql
   insert into public.user_roles (user_id, role)
   select id, 'admin' from auth.users where email = 'you@example.com';
   ```

## Supabase settings to check

- **Authentication → URL Configuration:** set **Site URL** to your live address (e.g. `https://mentoral.ng`). Add `http://localhost:5173/**` and `https://your-domain/**` to **Redirect URLs**.
- **Authentication → Providers → Google:** turn it on and paste a Client ID and Secret from Google Cloud Console (APIs & Services → Credentials → OAuth client ID → Web application). In Google, add `https://<your-project-ref>.supabase.co/auth/v1/callback` as an authorised redirect URI.
- **Authentication → Emails:** the built-in email sender has a low hourly limit. Before launch, connect your own SMTP service (for example Resend or Brevo) under **Project Settings → Authentication → SMTP**.

## Audio and video calls (Daily)

Accepted sessions get a private in-app call. Learners and guides choose **Audio only** or **Video**. The call opens 15 minutes before the start time and closes 30 minutes after the session should end.

How it works: the browser calls the `call-token` Edge Function (`supabase/functions/call-token`). It checks that the signed-in user is the guide or learner of an accepted session, creates a private Daily room for that session, and returns a short-lived meeting pass. The Daily API key stays on the server.

Setup:
1. Create a free account at https://www.daily.co and copy your **API key** from the Developers page.
2. In Supabase, open **Edge Functions → Secrets** and add `DAILY_API_KEY` with that key.
3. Deploy the function: **Edge Functions → Deploy a new function → Via Editor**, name it `call-token`, paste `supabase/functions/call-token/index.ts`, and deploy. Or with the Supabase CLI: `npx supabase functions deploy call-token --project-ref <your-ref>`.

Session times are treated as West Africa Time (UTC+1) by the server.

## Deploy worldwide (free)

The app is a static site, so any static host works. With **Cloudflare Pages**:

1. Push this repository to GitHub.
2. In Cloudflare, open **Workers & Pages → Create → Pages → Connect to Git** and pick the repository.
3. Build command: `npm run build`. Output directory: `dist`.
4. Under **Environment variables**, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5. Deploy. You get a `*.pages.dev` address. Add your own domain under **Custom domains**.

Netlify works the same way. `public/_redirects` already sends every path to the app so page refreshes work.

Every push to the `main` branch redeploys automatically.

## Project layout

```
supabase/schema.sql     Tables, security rules (RLS), functions, storage bucket
src/lib/                Supabase client, types, constants, dates, matching rules, data helpers
src/context/            Signed-in user, profile and roles
src/components/         Layout, shared UI, guide card, toasts
src/pages/              One file per screen
```

## Security notes

- Row-level security is on for every table. Users can only read and change their own data. Both people in a session can see that session and its chat, and only admins can see applications and reports.
- Session status changes, meeting links, approvals and verification go through database functions that check who is calling.
- ID documents go to a private storage bucket. Only the uploader and admins can open them.
- Only the **anon** key is used in the browser. Never put the `service_role` key in this app or in GitHub.

## Before launch

- [ ] Have a lawyer review the Privacy and Terms pages (Nigeria Data Protection Act 2023)
- [ ] Connect your own SMTP email sender
- [ ] Turn on Supabase backups (paid plan)
- [ ] Add an account-deletion flow (needs a Supabase Edge Function using the service role)
- [ ] Add email reminders for upcoming sessions and auto-expiry of requests after 48 hours
- [ ] Add a parent or guardian consent step if under-18 learners are allowed
