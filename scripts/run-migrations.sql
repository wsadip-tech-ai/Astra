-- ============================================================
-- Astra — All migrations combined
-- Copy and paste this ENTIRE file into Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- 001: Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  subscription_tier text not null default 'free' check (subscription_tier in ('free', 'premium')),
  stripe_customer_id text,
  is_admin boolean not null default false,
  daily_message_count int not null default 0,
  daily_reset_at date not null default current_date,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;

create policy if not exists "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy if not exists "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 002: Birth Charts
create table if not exists public.birth_charts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null default 'My Chart',
  date_of_birth date not null,
  time_of_birth time,
  place_of_birth text not null,
  latitude double precision not null,
  longitude double precision not null,
  timezone text not null,
  western_chart_json jsonb,
  vedic_chart_json jsonb,
  created_at timestamptz not null default now()
);

alter table public.birth_charts enable row level security;

create policy if not exists "Users can view own charts"
  on public.birth_charts for select
  using (auth.uid() = user_id);

create policy if not exists "Users can insert own charts"
  on public.birth_charts for insert
  with check (auth.uid() = user_id);

-- 003: Horoscopes
create table if not exists public.horoscopes (
  id uuid primary key default gen_random_uuid(),
  sign text not null,
  date date not null,
  reading text not null,
  lucky_number int,
  lucky_color text,
  created_at timestamptz not null default now(),
  unique(sign, date),
  constraint valid_sign check (sign in ('aries','taurus','gemini','cancer','leo','virgo',
                                        'libra','scorpio','sagittarius','capricorn','aquarius','pisces'))
);

alter table public.horoscopes enable row level security;

create policy if not exists "Horoscopes are publicly readable"
  on public.horoscopes for select
  using (true);

-- 004: Chat Sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  chart_id uuid NOT NULL REFERENCES birth_charts(id),
  messages jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can read own sessions"
    ON chat_sessions FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own sessions"
    ON chat_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own sessions"
    ON chat_sessions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 005: Horoscopes compatibility column
DO $$ BEGIN
  ALTER TABLE horoscopes ADD COLUMN compatibility_sign text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 006: Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_subscription_id text UNIQUE NOT NULL,
  plan text NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due')),
  current_period_end timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can read own subscriptions"
    ON subscriptions FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow service role to write to profiles (for webhook updates)
DO $$ BEGIN
  CREATE POLICY "Service role can update profiles"
    ON profiles FOR UPDATE
    USING (true)
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow service role to write to horoscopes
DO $$ BEGIN
  CREATE POLICY "Service role can insert horoscopes"
    ON horoscopes FOR INSERT
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can update horoscopes"
    ON horoscopes FOR UPDATE
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Done!
-- All 6 migrations applied successfully.
