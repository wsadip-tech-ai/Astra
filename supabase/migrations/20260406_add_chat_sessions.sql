-- Chat sessions table
-- Groups astra_chat_messages into named conversations per user

create table if not exists astra_chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'New conversation',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_chat_sessions_user on astra_chat_sessions(user_id, updated_at desc);

alter table astra_chat_sessions enable row level security;

create policy "Users can read own sessions"
  on astra_chat_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on astra_chat_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sessions"
  on astra_chat_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete own sessions"
  on astra_chat_sessions for delete
  using (auth.uid() = user_id);

-- Add session_id to messages (nullable for backward compat with existing messages)
alter table astra_chat_messages
  add column if not exists session_id uuid references astra_chat_sessions(id) on delete cascade;

create index idx_chat_messages_session on astra_chat_messages(session_id, created_at);
