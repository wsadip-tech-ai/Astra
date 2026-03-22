-- 003_horoscopes.sql
-- Cache table for daily horoscopes (populated in Sub-project 3)

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

-- Public read access (horoscopes are public content)
-- Write access is restricted to service_role only
alter table public.horoscopes enable row level security;

create policy "Horoscopes are publicly readable"
  on public.horoscopes for select
  using (true);
