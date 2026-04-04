-- Migration: add_chat_weather_vaastu_yearly_tables
-- Created: 2026-04-04
-- Tables: astra_chat_messages, astra_cosmic_weather, astra_vaastu_properties, astra_yearly_forecasts

-- ------------------------------------------------------------
-- 1. astra_chat_messages
-- Chat persistence — messages saved after each exchange
-- ------------------------------------------------------------

create table if not exists astra_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now() not null
);

create index idx_chat_messages_user_id on astra_chat_messages(user_id);
create index idx_chat_messages_created_at on astra_chat_messages(user_id, created_at);

alter table astra_chat_messages enable row level security;

create policy "Users can read own messages"
  on astra_chat_messages for select
  using (auth.uid() = user_id);

create policy "Users can insert own messages"
  on astra_chat_messages for insert
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 2. astra_cosmic_weather
-- Cache for personalized daily cosmic weather readings
-- ------------------------------------------------------------

create table if not exists astra_cosmic_weather (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  reading text not null,
  created_at timestamptz default now() not null,
  unique(user_id, date)
);

create index idx_cosmic_weather_user_date on astra_cosmic_weather(user_id, date);

alter table astra_cosmic_weather enable row level security;

create policy "Users can read own weather"
  on astra_cosmic_weather for select
  using (auth.uid() = user_id);

create policy "Users can insert own weather"
  on astra_cosmic_weather for insert
  with check (auth.uid() = user_id);

create policy "Users can update own weather"
  on astra_cosmic_weather for update
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 3. astra_vaastu_properties
-- User property data for Vaastu analysis
-- ------------------------------------------------------------

create table if not exists astra_vaastu_properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  length float not null,
  breadth float not null,
  entrance_direction text not null,
  floor_level text default 'ground',
  kitchen_zone text,
  toilet_zones text[],
  brahmasthan_status text,
  slope_direction text,
  name_initial text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table astra_vaastu_properties enable row level security;

create policy "Users can read own property"
  on astra_vaastu_properties for select
  using (auth.uid() = user_id);

create policy "Users can insert own property"
  on astra_vaastu_properties for insert
  with check (auth.uid() = user_id);

create policy "Users can update own property"
  on astra_vaastu_properties for update
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 4. astra_yearly_forecasts
-- Cache for yearly prediction readings per user
-- ------------------------------------------------------------

create table if not exists astra_yearly_forecasts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  year int not null,
  reading text not null,
  created_at timestamptz default now() not null,
  unique(user_id, year)
);

alter table astra_yearly_forecasts enable row level security;

create policy "Users can read own forecasts"
  on astra_yearly_forecasts for select
  using (auth.uid() = user_id);

create policy "Users can insert own forecasts"
  on astra_yearly_forecasts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own forecasts"
  on astra_yearly_forecasts for update
  using (auth.uid() = user_id);
