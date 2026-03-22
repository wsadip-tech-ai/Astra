-- 002_birth_charts.sql

create table if not exists public.birth_charts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null default 'My Chart',
  date_of_birth date not null,
  time_of_birth time,
  place_of_birth text not null,
  latitude float not null,
  longitude float not null,
  timezone text not null,
  western_chart_json jsonb,
  vedic_chart_json jsonb,
  created_at timestamptz not null default now()
);

alter table public.birth_charts enable row level security;

create policy "Users can manage own charts"
  on public.birth_charts for all
  using (auth.uid() = user_id);
