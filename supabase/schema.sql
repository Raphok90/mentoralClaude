-- Mentoral database schema
-- Run once in Supabase: Dashboard -> SQL Editor -> New query -> paste this file -> Run.
-- Every table has row-level security (RLS) on. Status changes and admin actions go
-- through the functions at the bottom so the rules cannot be skipped from the browser.

create extension if not exists pgcrypto;

-- ---------- Types ----------
create type app_role as enum ('learner', 'guide', 'admin');
create type guide_type as enum ('mentor', 'counsellor', 'tutor');
create type booking_status as enum ('pending', 'accepted', 'completed', 'declined', 'cancelled');
create type application_status as enum ('pending', 'approved', 'rejected');
create type report_status as enum ('open', 'resolved');

-- ---------- Tables ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  state text,
  languages text[] not null default '{}',
  interests text[] not null default '{}',
  industry text,
  wants guide_type[] not null default '{}',
  main_goal text,
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role app_role not null,
  primary key (user_id, role)
);

create table public.guide_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  type guide_type not null,
  headline text not null,
  bio text not null default '',
  industry text not null,
  expertise text[] not null default '{}',
  years_experience int not null default 0 check (years_experience between 0 and 70),
  languages text[] not null default '{English}',
  modes text[] not null default '{Online}',
  state text,
  session_minutes int not null default 60 check (session_minutes in (30, 45, 60, 90)),
  verified boolean not null default false,
  accepting_requests boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.availability (
  id bigint generated always as identity primary key,
  guide_id uuid not null references public.guide_profiles (user_id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6), -- 0 = Sunday
  start_time time not null,
  unique (guide_id, weekday, start_time)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  provider_user_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  start_time time not null,
  mode text not null default 'Online',
  topic text not null check (char_length(topic) between 3 and 140),
  note text check (char_length(note) <= 1000),
  meeting_link text,
  decline_reason text,
  cancelled_by uuid references public.profiles (id),
  status booking_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> provider_user_id)
);
-- One active booking per guide per slot.
create unique index bookings_slot_taken on public.bookings (provider_user_id, date, start_time)
  where status in ('pending', 'accepted');

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  guide_id uuid not null references public.profiles (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 500),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 2 and 140),
  target_date date,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 200),
  done boolean not null default false,
  position int not null default 0
);

create table public.guide_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type guide_type not null,
  headline text not null,
  industry text not null,
  years_experience int not null default 0,
  expertise text[] not null default '{}',
  languages text[] not null default '{English}',
  state text,
  links text,
  id_document_path text,
  motivation text,
  status application_status not null default 'pending',
  admin_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table public.saved_guides (
  user_id uuid not null references public.profiles (id) on delete cascade,
  guide_id uuid not null references public.guide_profiles (user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, guide_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_user_id uuid not null references public.profiles (id) on delete cascade,
  booking_id uuid references public.bookings (id) on delete set null,
  reason text not null check (char_length(reason) between 5 and 1000),
  status report_status not null default 'open',
  created_at timestamptz not null default now()
);

-- ---------- Helpers ----------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin');
$$;

create or replace function public.shares_booking(other uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from bookings
    where (requester_id = auth.uid() and provider_user_id = other)
       or (provider_user_id = auth.uid() and requester_id = other)
  );
$$;

-- New sign-ups get a profile and the learner role.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, avatar_url)
  values (new.id,
          coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
          new.raw_user_meta_data ->> 'avatar_url');
  insert into user_roles (user_id, role) values (new.id, 'learner');
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- A learner can hold at most 3 pending requests, and only book verified guides who accept requests.
create or replace function public.check_new_booking()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from bookings where requester_id = new.requester_id and status = 'pending') >= 3 then
    raise exception 'You already have 3 pending requests. Wait for a reply or cancel one first.';
  end if;
  if not exists (select 1 from guide_profiles where user_id = new.provider_user_id and verified and accepting_requests) then
    raise exception 'This guide is not taking requests right now.';
  end if;
  if new.date < current_date then
    raise exception 'Pick a date in the future.';
  end if;
  new.status := 'pending';
  return new;
end;
$$;
create trigger before_booking_insert before insert on public.bookings
  for each row execute function public.check_new_booking();

-- ---------- Public read models (safe columns only) ----------
create view public.guide_directory as
select g.user_id, p.full_name, p.avatar_url, g.type, g.headline, g.industry, g.expertise,
       g.years_experience, g.languages, g.modes, g.state, g.session_minutes, g.accepting_requests,
       g.created_at,
       coalesce(r.avg_rating, 0)::numeric(3, 2) as avg_rating,
       coalesce(r.review_count, 0) as review_count,
       coalesce(b.completed, 0) as sessions_completed
from guide_profiles g
join profiles p on p.id = g.user_id
left join (select guide_id, avg(rating) as avg_rating, count(*) as review_count
           from reviews where not hidden group by guide_id) r on r.guide_id = g.user_id
left join (select provider_user_id, count(*) as completed
           from bookings where status = 'completed' group by provider_user_id) b on b.provider_user_id = g.user_id
where g.verified;

create view public.guide_reviews as
select r.id, r.guide_id, r.rating, r.comment, r.created_at,
       split_part(p.full_name, ' ', 1) as author_first_name
from reviews r join profiles p on p.id = r.author_id
where not r.hidden;

-- These views are public on purpose (verified guides and visible reviews only) and are read-only.
revoke all on public.guide_directory, public.guide_reviews from anon, authenticated;
grant select on public.guide_directory, public.guide_reviews to anon, authenticated;

-- Slots already held by pending or accepted bookings, without revealing who booked them.
create or replace function public.taken_slots(guide uuid, from_date date, to_date date)
returns table (date date, start_time time)
language sql stable security definer set search_path = public as $$
  select b.date, b.start_time from bookings b
  where b.provider_user_id = guide and b.date between from_date and to_date
    and b.status in ('pending', 'accepted');
$$;

-- ---------- Actions ----------
create or replace function public.update_booking_status(p_id uuid, p_status booking_status, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
declare b bookings;
begin
  select * into b from bookings where id = p_id for update;
  if b.id is null then raise exception 'Session not found.'; end if;

  if auth.uid() = b.provider_user_id then
    if not ((b.status = 'pending' and p_status in ('accepted', 'declined'))
         or (b.status = 'accepted' and p_status in ('completed', 'cancelled'))) then
      raise exception 'You cannot change this session from % to %.', b.status, p_status;
    end if;
  elsif auth.uid() = b.requester_id then
    if not (b.status in ('pending', 'accepted') and p_status = 'cancelled') then
      raise exception 'You can only cancel a pending or accepted session.';
    end if;
  else
    raise exception 'This is not your session.';
  end if;

  update bookings set
    status = p_status,
    decline_reason = case when p_status = 'declined' then p_reason else decline_reason end,
    cancelled_by = case when p_status = 'cancelled' then auth.uid() else cancelled_by end,
    updated_at = now()
  where id = p_id;
end;
$$;

create or replace function public.set_meeting_link(p_id uuid, p_link text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_link is not null and p_link !~* '^https://' then
    raise exception 'Meeting links must start with https://';
  end if;
  update bookings set meeting_link = p_link, updated_at = now()
  where id = p_id and provider_user_id = auth.uid();
  if not found then raise exception 'Only the guide can set the meeting link.'; end if;
end;
$$;

create or replace function public.review_application(p_id uuid, p_approve boolean, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare a guide_applications;
begin
  if not is_admin() then raise exception 'Admins only.'; end if;
  select * into a from guide_applications where id = p_id for update;
  if a.id is null then raise exception 'Application not found.'; end if;

  update guide_applications
  set status = case when p_approve then 'approved'::application_status else 'rejected'::application_status end,
      admin_note = p_note, reviewed_at = now()
  where id = p_id;

  if p_approve then
    insert into guide_profiles (user_id, type, headline, industry, years_experience, expertise, languages, state, verified)
    values (a.user_id, a.type, a.headline, a.industry, a.years_experience, a.expertise, a.languages, a.state, true)
    on conflict (user_id) do update set
      type = excluded.type, headline = excluded.headline, industry = excluded.industry,
      years_experience = excluded.years_experience, expertise = excluded.expertise,
      languages = excluded.languages, state = excluded.state, verified = true;
    insert into user_roles (user_id, role) values (a.user_id, 'guide') on conflict do nothing;
  end if;
end;
$$;

create or replace function public.admin_set_verified(p_guide uuid, p_verified boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Admins only.'; end if;
  update guide_profiles set verified = p_verified where user_id = p_guide;
end;
$$;

-- ---------- Row-level security ----------
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.guide_profiles enable row level security;
alter table public.availability enable row level security;
alter table public.bookings enable row level security;
alter table public.reviews enable row level security;
alter table public.messages enable row level security;
alter table public.goals enable row level security;
alter table public.milestones enable row level security;
alter table public.guide_applications enable row level security;
alter table public.saved_guides enable row level security;
alter table public.reports enable row level security;

-- profiles: yourself, people you share a session with, admins
create policy "profiles read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.shares_booking(id) or public.is_admin());
create policy "profiles update own" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- user_roles: read own; admins read all. Changes only through functions.
create policy "roles read" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- guide_profiles: verified profiles are public; owners edit everything except "verified"
create policy "guides read" on public.guide_profiles for select to anon, authenticated
  using (verified or user_id = auth.uid() or public.is_admin());
create policy "guides update own" on public.guide_profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke update on public.guide_profiles from authenticated;
grant update (headline, bio, industry, expertise, years_experience, languages, modes, state,
              session_minutes, accepting_requests) on public.guide_profiles to authenticated;

-- availability: public read, owner writes
create policy "availability read" on public.availability for select to anon, authenticated using (true);
create policy "availability insert own" on public.availability for insert to authenticated
  with check (guide_id = auth.uid());
create policy "availability delete own" on public.availability for delete to authenticated
  using (guide_id = auth.uid());

-- bookings: participants and admins read; learners create; changes through update_booking_status
create policy "bookings read" on public.bookings for select to authenticated
  using (requester_id = auth.uid() or provider_user_id = auth.uid() or public.is_admin());
create policy "bookings create" on public.bookings for insert to authenticated
  with check (requester_id = auth.uid());

-- reviews: public through guide_reviews; only the learner of a completed session can write one
create policy "reviews read" on public.reviews for select to authenticated
  using (not hidden or author_id = auth.uid() or public.is_admin());
create policy "reviews create" on public.reviews for insert to authenticated
  with check (
    author_id = auth.uid() and exists (
      select 1 from public.bookings b
      where b.id = booking_id and b.requester_id = auth.uid()
        and b.provider_user_id = guide_id and b.status = 'completed'));
create policy "reviews moderate" on public.reviews for update to authenticated
  using (public.is_admin());

-- messages: only the two people in the session
create policy "messages read" on public.messages for select to authenticated
  using (exists (select 1 from public.bookings b where b.id = booking_id
                 and auth.uid() in (b.requester_id, b.provider_user_id)));
create policy "messages send" on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and exists (
    select 1 from public.bookings b where b.id = booking_id
      and auth.uid() in (b.requester_id, b.provider_user_id)
      and b.status in ('pending', 'accepted', 'completed')));

-- goals and milestones: owner manages; a guide in a session with the learner can read
create policy "goals owner" on public.goals for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "goals guide read" on public.goals for select to authenticated
  using (exists (select 1 from public.bookings b where b.requester_id = goals.user_id
                 and b.provider_user_id = auth.uid() and b.status in ('pending', 'accepted', 'completed')));
create policy "milestones owner" on public.milestones for all to authenticated
  using (exists (select 1 from public.goals g where g.id = goal_id and g.user_id = auth.uid()))
  with check (exists (select 1 from public.goals g where g.id = goal_id and g.user_id = auth.uid()));
create policy "milestones guide read" on public.milestones for select to authenticated
  using (exists (select 1 from public.goals g join public.bookings b on b.requester_id = g.user_id
                 where g.id = goal_id and b.provider_user_id = auth.uid()
                   and b.status in ('pending', 'accepted', 'completed')));

-- applications: applicant creates and reads own; admins read all
create policy "applications create" on public.guide_applications for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');
create policy "applications read" on public.guide_applications for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- saved guides: owner only
create policy "saved owner" on public.saved_guides for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- reports: anyone signed in can file; admins read and resolve
create policy "reports create" on public.reports for insert to authenticated
  with check (reporter_id = auth.uid());
create policy "reports admin read" on public.reports for select to authenticated using (public.is_admin());
create policy "reports admin update" on public.reports for update to authenticated using (public.is_admin());

-- ---------- Storage: private ID documents ----------
insert into storage.buckets (id, name, public) values ('id-documents', 'id-documents', false)
  on conflict (id) do nothing;
create policy "id docs upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'id-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "id docs read own or admin" on storage.objects for select to authenticated
  using (bucket_id = 'id-documents' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- ---------- Realtime for chat ----------
alter publication supabase_realtime add table public.messages;

-- ---------- Make yourself admin (run separately after you sign up) ----------
-- insert into public.user_roles (user_id, role)
-- select id, 'admin' from auth.users where email = 'you@example.com';
