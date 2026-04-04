-- ============================================================
-- Astra — All migrations with astra_ prefix
-- Safe to run on shared Supabase project
-- ============================================================

-- Astra Profiles (separate from existing profiles table)
CREATE TABLE IF NOT EXISTS astra_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  subscription_tier text NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium')),
  stripe_customer_id text,
  is_admin boolean NOT NULL DEFAULT false,
  daily_message_count int NOT NULL DEFAULT 0,
  daily_reset_at date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Auto-create astra profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_astra_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.astra_profiles (id, name)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  );
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_astra_user_created ON auth.users;
CREATE TRIGGER on_astra_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_astra_user();

ALTER TABLE astra_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "astra_profiles_select" ON astra_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "astra_profiles_update" ON astra_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "astra_profiles_service_update" ON astra_profiles FOR UPDATE USING (true) WITH CHECK (true);

-- Insert row for existing user if not exists
INSERT INTO astra_profiles (id, name)
SELECT id, raw_user_meta_data->>'full_name'
FROM auth.users
WHERE id NOT IN (SELECT id FROM astra_profiles)
ON CONFLICT DO NOTHING;

-- Astra Birth Charts
CREATE TABLE IF NOT EXISTS astra_birth_charts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES astra_profiles(id) ON DELETE CASCADE,
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

ALTER TABLE astra_birth_charts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "astra_charts_select" ON astra_birth_charts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "astra_charts_insert" ON astra_birth_charts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "astra_charts_delete" ON astra_birth_charts FOR DELETE USING (auth.uid() = user_id);

-- Migrate existing birth_charts data if any
INSERT INTO astra_birth_charts (id, user_id, label, date_of_birth, time_of_birth, place_of_birth, latitude, longitude, timezone, western_chart_json, vedic_chart_json, created_at)
SELECT id, user_id, label, date_of_birth, time_of_birth, place_of_birth, latitude, longitude, timezone, western_chart_json, vedic_chart_json, created_at
FROM birth_charts
WHERE user_id IN (SELECT id FROM astra_profiles)
ON CONFLICT DO NOTHING;

-- Astra Horoscopes
CREATE TABLE IF NOT EXISTS astra_horoscopes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sign text NOT NULL,
  date date NOT NULL,
  reading text NOT NULL,
  lucky_number int,
  lucky_color text,
  compatibility_sign text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(sign, date),
  CONSTRAINT astra_valid_sign CHECK (sign IN ('aries','taurus','gemini','cancer','leo','virgo',
                                               'libra','scorpio','sagittarius','capricorn','aquarius','pisces'))
);

ALTER TABLE astra_horoscopes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "astra_horoscopes_select" ON astra_horoscopes FOR SELECT USING (true);
CREATE POLICY "astra_horoscopes_insert" ON astra_horoscopes FOR INSERT WITH CHECK (true);
CREATE POLICY "astra_horoscopes_update" ON astra_horoscopes FOR UPDATE USING (true);

-- Astra Chats
CREATE TABLE IF NOT EXISTS astra_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES astra_profiles(id) ON DELETE CASCADE,
  messages jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE astra_chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "astra_chats_select" ON astra_chats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "astra_chats_insert" ON astra_chats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "astra_chats_update" ON astra_chats FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Astra Subscriptions
CREATE TABLE IF NOT EXISTS astra_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES astra_profiles(id) ON DELETE CASCADE,
  stripe_subscription_id text UNIQUE NOT NULL,
  plan text NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due')),
  current_period_end timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE astra_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "astra_subs_select" ON astra_subscriptions FOR SELECT USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';

-- Done! All astra_ tables created.
