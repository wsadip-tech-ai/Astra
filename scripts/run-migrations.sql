-- ============================================================
-- Astra — All migrations combined
-- Copy and paste this ENTIRE file into Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- 001: Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  subscription_tier text NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium')),
  stripe_customer_id text,
  is_admin boolean NOT NULL DEFAULT false,
  daily_message_count int NOT NULL DEFAULT 0,
  daily_reset_at date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  );
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 002: Birth Charts
CREATE TABLE IF NOT EXISTS public.birth_charts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'My Chart',
  date_of_birth date NOT NULL,
  time_of_birth time,
  place_of_birth text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  timezone text NOT NULL,
  western_chart_json jsonb,
  vedic_chart_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.birth_charts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own charts"
    ON public.birth_charts FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own charts"
    ON public.birth_charts FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 003: Horoscopes
CREATE TABLE IF NOT EXISTS public.horoscopes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sign text NOT NULL,
  date date NOT NULL,
  reading text NOT NULL,
  lucky_number int,
  lucky_color text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(sign, date),
  CONSTRAINT valid_sign CHECK (sign IN ('aries','taurus','gemini','cancer','leo','virgo',
                                        'libra','scorpio','sagittarius','capricorn','aquarius','pisces'))
);

ALTER TABLE public.horoscopes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Horoscopes are publicly readable"
    ON public.horoscopes FOR SELECT
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

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

-- Service role policies (for webhook and server-side writes)
DO $$ BEGIN
  CREATE POLICY "Service role can update profiles"
    ON profiles FOR UPDATE
    USING (true)
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

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
