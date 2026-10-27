# Mentoral — Feature Plan and Screen List

**Version:** 1.0 · 27 Oct 2026
**Builds on:** the live MVP at mentoral.lovable.app (React + shadcn/ui + Lovable Cloud backend)
**Direction:** a free, professional platform for mentorship, counselling and tutoring across all industries. Nigeria first. No payment features in this version.

---

## 1. Product principles

1. **Trust first.** Every guide is checked before they appear in search. Reviews only come from completed sessions.
2. **Free while we grow.** No prices, wallets or checkout. Design the data so payments can be added later without rebuilding.
3. **Nigeria first.** Nigerian states, local languages (English, Yoruba, Igbo, Hausa, Pidgin), WAT time zone, WAEC/JAMB/NECO subjects and Nigerian professional exams (ICAN, COREN, Law School).
4. **Mobile and low data.** Most users will be on phones with limited data. Pages must load fast and work well at phone width.
5. **One platform, three kinds of help.** Mentors, counsellors and tutors share the same booking, messaging and review system.

---

## 2. User roles

| Role | Who | What they can do |
|---|---|---|
| **Learner** | Students, graduates, professionals, anyone seeking help | Find guides, request sessions, message, review, track goals |
| **Guide** | Approved mentors, counsellors and tutors | Manage their profile and availability, accept or decline requests, run sessions |
| **Admin** | Mentoral team | Review guide applications, verify identities, handle reports, see platform stats |

A guide can also be a learner. "Guide" is the shared name for mentors, counsellors and tutors in the app. The public pages still say "mentor", "counsellor" or "tutor".

**Change from the MVP:** replace the **"Quick Fix / service provider"** section with **Tutors**. The `service_provider` role and the `/browse/service_provider` route should be removed or hidden.

---

## 3. Features by priority

### P1 — Standard app (build now)

| # | Feature | Notes |
|---|---|---|
| F1 | **Sign up and sign in** | Already built: email + password and Google. Add "Forgot password" and email verification. |
| F2 | **Onboarding** | Already routed (`/onboarding`). Asks: what help you want (mentor / counsellor / tutor), industry, interests, state, languages, main goal. These answers drive matching. |
| F3 | **Guide discovery** | Search plus filters: type, industry, expertise, state, language, online or in person, available this week, verified only. Sort by best match, rating or most sessions. |
| F4 | **Matching** | "Recommended for you" list with a match % and plain reasons ("Same industry", "Shares 2 of your interests"). Rules in section 6. |
| F5 | **Guide profile** | Photo, headline, verified badge, bio, expertise, work history, languages, session modes, rating, reviews, next free times. |
| F6 | **Availability** | Guides set weekly time slots. Learners only see free slots for the next 14 days. A booked slot disappears. |
| F7 | **Session requests** | Learner picks a slot, a topic and an optional note. Status flow in section 5. Builds on the existing `bookings` table. |
| F8 | **Session management** | One "Sessions" page with tabs: Requests, Upcoming, Past, Cancelled. Actions depend on role and status. |
| F9 | **Messaging** | One-to-one chat. It opens only after a session request exists, which limits spam and unwanted contact. |
| F10 | **Reviews and ratings** | 1–5 stars plus a short comment. Only allowed after a session is marked completed, one review per session. |
| F11 | **Goals tracker** | Learners add goals with milestones and tick them off. Guides can see a learner's goals when a session is booked. |
| F12 | **Become a guide** | Already routed (`/become-provider`). Application form: type, headline, industry, years of experience, expertise, LinkedIn or certificate link, government ID upload, short motivation. |
| F13 | **Admin console** | Already routed (`/admin`). Approve or reject applications, mark guides verified, handle reports, see basic counts. |
| F14 | **Notifications** | In-app notifications and email for new request, accepted, declined, upcoming session reminder (24 h and 1 h), new message, review received. |
| F15 | **Safety tools** | Report a user or message, block a user, community guidelines page, counsellor disclaimer (not a crisis service). |
| F16 | **Saved guides** | Learners save guides to a shortlist. |

### P2 — Next (after the first users)

- Video call link generated per session (Google Meet / Jitsi link field, then built-in video later)
- Group sessions and office hours (one guide, many learners)
- Session notes and shared action items after each session
- Guide public page link to share on LinkedIn and WhatsApp
- Referral invites ("Invite a friend" with tracking)
- Learner profile visible to guides (CV link, education)
- Search by university and by professional body

### Later — Monetisation (not in this version)

- Paid sessions and packages, Paystack / Flutterwave payouts
- Organisation programmes (universities, companies, NGOs) with their own admin
- Featured guide listings

---

## 4. Screen list

**Legend** — Who: P = public (signed out), L = learner, G = guide, A = admin. Status: ✅ exists in MVP, ✏️ exists but needs changes, 🆕 new.

| # | Screen | Route | Who | Status | Purpose and key elements |
|---|---|---|---|---|---|
| S1 | **Landing page** | `/` | P | ✏️ | Headline and one-line pitch, three tracks (Mentors, Counsellors, Tutors), how it works (4 steps), trust section (verification, real reviews, free), CTA to join and to become a guide. |
| S2 | **Sign in / Create account** | `/auth` | P | ✅ | Already built. Add "Forgot password". |
| S3 | **Reset password** | `/reset-password` | P | 🆕 | Email field, then new password form from the email link. |
| S4 | **Onboarding** | `/onboarding` | L | ✏️ | 3 short steps: (1) What help do you want? (2) Industry, interests, languages, state (3) Your main goal. Skippable, editable later. |
| S5 | **Learner dashboard** | `/dashboard` | L | ✏️ | Greeting, counts (pending / upcoming / completed), next session card, recommended guides with match %, goals progress, profile completeness prompt. |
| S6 | **Guide dashboard** | `/dashboard` | G | 🆕 | New requests with Accept / Decline, upcoming sessions, rating and sessions completed, prompt to keep availability up to date. |
| S7 | **Discover guides** | `/browse/:type` | P, L | ✏️ | Search box, filters (F3), sort, guide cards: photo, name, verified badge, type, headline, industry · state, rating, languages, next free slot, match %. Types: `mentor`, `counsellor`, `tutor`. |
| S8 | **Guide profile** | `/guide/:id` | P, L | 🆕 | Profile details (F5), reviews list, booking panel: mode, free slots for 14 days, topic, note, "Send request". Save and Report buttons. Signed-out users are asked to sign in to book. |
| S9 | **Sessions** | `/bookings` | L, G | ✏️ | Tabs: Requests, Upcoming, Past, Cancelled. Each row: person, date and time (WAT), topic, status pill, actions (section 5). |
| S10 | **Session detail** | `/bookings/:id` | L, G | 🆕 | Full details, meeting link, learner's goals, chat shortcut, status history, Cancel, Mark completed, Leave review. |
| S11 | **Leave a review** | dialog on S9 / S10 | L | 🆕 | Star picker, comment (max 500 characters), submit. |
| S12 | **Messages** | `/messages` | L, G | 🆕 | Conversation list and chat thread. Report and Block in the thread menu. |
| S13 | **Goals** | `/goals` | L | 🆕 | Goals with milestones, progress bars, add / edit / archive goal. |
| S14 | **Saved guides** | `/saved` | L | 🆕 | Shortlist of saved guide cards. |
| S15 | **Become a guide** | `/become-provider` | L | ✏️ | Application form (F12). After submitting, shows status: Pending, Approved or Needs changes. |
| S16 | **My guide profile and availability** | `/guide-settings` | G | 🆕 | Edit public profile, expertise, languages, modes, weekly availability grid (days × times), pause new requests switch. |
| S17 | **Account and profile** | `/account` | L, G | 🆕 | Name, photo, state, languages, interests, notification settings, change password, delete account. |
| S18 | **Notifications** | `/notifications` | L, G | 🆕 | List of in-app notifications, mark all as read. |
| S19 | **Admin — Applications** | `/admin` | A | ✏️ | Pending applications with ID and links, Approve / Reject with reason. |
| S20 | **Admin — Guides and reports** | `/admin/guides`, `/admin/reports` | A | 🆕 | Guide list with verify / suspend, report queue with resolve actions, basic counts (users, guides, sessions this week). |
| S21 | **Static pages** | `/about`, `/guidelines`, `/privacy`, `/terms` | P | 🆕 | About Mentoral, community guidelines, privacy policy (NDPR-compliant), terms of use. |

**Navigation**

- Learner: Dashboard · Discover · Sessions · Messages · Goals · (menu) Saved, Become a guide, Account
- Guide: Dashboard · Sessions · Messages · My profile · Discover · (menu) Account
- Admin: Applications · Guides · Reports
- Phones: a bottom tab bar with the first 4 items, the rest under a "More" menu.

---

## 5. Session status flow

Keeps the statuses already used by the MVP's `bookings` table.

```
pending ──accept──▶ accepted ──(time arrives)──▶ in_progress ──▶ completed ──▶ review allowed
   │                    │
   ├─decline──▶ declined │
   └─cancel───▶ cancelled ◀──cancel (either side, with reason)
```

| Status | Learner can | Guide can |
|---|---|---|
| pending | Cancel, Message | Accept, Decline (with optional reason), Message |
| accepted | Cancel, Message, Join link | Cancel, Message, Add meeting link |
| in_progress | Join link | Join link, Mark completed |
| completed | Leave review (once) | Add session notes (P2) |
| declined / cancelled | Book again | — |

Rules:
- A slot is blocked as soon as a request is **pending**, and freed again if it is declined or cancelled.
- Requests not answered in 48 hours expire automatically and the learner is told.
- Learners can have at most 3 pending requests at a time, to stop spam.

---

## 6. Matching rules (first version)

Simple, explainable scoring. Start rule-based; refine with data later.

| Signal | Points |
|---|---|
| Guide type is one the learner asked for | +25 |
| Same industry | +20 |
| Each shared interest / expertise (max 3) | +10 each |
| Speaks one of the learner's languages (besides English) | +5 |
| Same state (matters for in-person) | +5 |
| Has a free slot in the next 7 days | +5 |
| Rating 4.5 or above | +5 |

Show the score as a % (capped at 99) with the top 2 reasons. Never show unverified guides in recommendations.

---

## 7. Data model

Existing in MVP: `profiles` (full_name, avatar_url, id_verified), user roles, `bookings` (requester_id, provider_user_id, status).

| Table | Key fields |
|---|---|
| `profiles` ✏️ | + state, languages[], interests[], industry, wants[] (mentor/counsellor/tutor), main_goal, onboarded |
| `user_roles` ✏️ | learner, guide, admin (drop service_provider) |
| `guide_profiles` 🆕 | user_id, type, headline, bio, industry, expertise[], years_experience, languages[], modes[], verified, accepting_requests, sessions_completed |
| `guide_experience` 🆕 | guide_id, role, organisation, start_year, end_year |
| `availability` 🆕 | guide_id, weekday (0–6), start_time, duration_minutes |
| `bookings` ✏️ | + date, start_time, mode, topic, note, meeting_link, decline_reason, cancelled_by, expires_at |
| `reviews` 🆕 | booking_id (unique), guide_id, author_id, rating 1–5, comment, created_at |
| `messages` 🆕 | conversation_id, sender_id, body, created_at, read_at |
| `conversations` 🆕 | user_a, user_b, booking_id |
| `goals` 🆕 | user_id, title, target_date, status |
| `milestones` 🆕 | goal_id, text, done, position |
| `guide_applications` 🆕 | user_id, type, headline, industry, years, expertise[], links, id_document_path, motivation, status, admin_note |
| `saved_guides` 🆕 | user_id, guide_id |
| `notifications` 🆕 | user_id, kind, payload, read_at |
| `reports` 🆕 | reporter_id, target_user_id, message_id, reason, status |
| `blocks` 🆕 | user_id, blocked_user_id |

Security: turn on row-level security for every table. Users read and write only their own rows, both people in a booking can see it, and only admins can see applications and reports.

---

## 8. Trust and safety

- **Guide verification:** government ID (NIN slip, passport or driver's licence) plus a LinkedIn profile or professional certificate. An admin checks each application by hand. Show "Verified" only after both checks.
- **Counsellors:** require a qualification or licence. Every counsellor profile shows: "Mentoral is not an emergency or crisis service."
- **Under-18 learners** (WAEC/JAMB tutoring): ask for date of birth at sign-up. Under-18s need a parent or guardian email to approve the account, and their sessions are online only.
- **Messaging:** only after a request exists. Report and block on every conversation.
- **Reviews:** only from completed sessions. Admins can hide reviews that break the guidelines.
- **Privacy:** follow the Nigeria Data Protection Act (NDPA 2023). Show a privacy policy and allow account deletion.

---

## 9. Build order

| Phase | Scope | Screens |
|---|---|---|
| **1. Clean up** | Remove Quick Fix, add Tutors, add counsellor spelling consistently, add forgot password | S1, S2, S3, S7 |
| **2. Profiles and discovery** | Onboarding fields, guide profiles, filters, guide profile page | S4, S7, S8, S16 |
| **3. Booking** | Availability, session requests, status flow, sessions pages | S6, S8, S9, S10 |
| **4. Engagement** | Messages, reviews, notifications, saved guides | S11, S12, S14, S18 |
| **5. Growth and trust** | Goals, matching, become-a-guide flow, admin console, reports | S5, S13, S15, S19, S20 |
| **6. Polish** | Static pages, account settings, mobile tab bar, speed checks | S17, S21 |

---

## 10. Decisions needed from you

1. **Session length:** fixed 30 minutes, fixed 60 minutes, or chosen by each guide?
2. **Video calls:** guides paste their own meeting link (simplest), or Mentoral creates links automatically?
3. **Under-18 users:** allow them now with parent approval, or adults only at launch?
4. **Quick Fix:** remove completely, or keep it hidden for a possible future product?
5. **Where to build:** keep building in Lovable using this plan, or build a separate codebase?
