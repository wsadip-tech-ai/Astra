-- 001_profiles.sql
-- Extends auth.users with app-specific profile data

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

-- Auto-create profile row when a new user signs up
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

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Row Level Security: users can only read/update their own profile
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);
