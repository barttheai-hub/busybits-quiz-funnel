-- Central Brain schema (MVP)
-- Run in Supabase SQL editor.

-- Businesses
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

-- Notes / Docs
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete set null,
  title text not null,
  body text not null default '',
  source text,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tasks
-- Postgres does not support CREATE TYPE IF NOT EXISTS, so we guard with DO blocks.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'task_owner') then
    create type public.task_owner as enum ('ziga','bart');
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'task_status') then
    create type public.task_status as enum ('backlog','next','doing','blocked','done');
  end if;
end$$;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete set null,
  owner public.task_owner not null,
  status public.task_status not null default 'backlog',
  title text not null,
  description text not null default '',
  priority int not null default 2, -- 1 high, 2 medium, 3 low
  due_date date,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Research topics (threads)
create table if not exists public.research_topics (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete set null,
  topic text not null,
  status text not null default 'open',
  created_by uuid not null,
  created_at timestamptz not null default now()
);

create table if not exists public.research_messages (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.research_topics(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_by uuid not null,
  created_at timestamptz not null default now()
);

-- updated_at triggers
create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'set_notes_updated_at' and tgrelid = 'public.notes'::regclass
  ) then
    create trigger set_notes_updated_at before update on public.notes
    for each row execute function public.set_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'set_tasks_updated_at' and tgrelid = 'public.tasks'::regclass
  ) then
    create trigger set_tasks_updated_at before update on public.tasks
    for each row execute function public.set_updated_at();
  end if;
end$$;

-- RLS (lock everything to a whitelist of two emails)
alter table public.businesses enable row level security;
alter table public.notes enable row level security;
alter table public.tasks enable row level security;
alter table public.research_topics enable row level security;
alter table public.research_messages enable row level security;

-- helper: allow only specific emails
create or replace function public.is_allowed_user() returns boolean as $$
  select exists (
    select 1
    from auth.users u
    where u.id = auth.uid()
      and lower(u.email) = any (array[
        lower('barttheai@gmail.com'),
        lower('REPLACE_ZIGA_EMAIL')
      ])
  );
$$ language sql stable;

-- policies (guarded; Postgres doesn't support CREATE POLICY IF NOT EXISTS)
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='businesses' and policyname='allow_read_businesses') then
    create policy "allow_read_businesses" on public.businesses
    for select using (public.is_allowed_user());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='businesses' and policyname='allow_write_businesses') then
    create policy "allow_write_businesses" on public.businesses
    for all using (public.is_allowed_user()) with check (public.is_allowed_user());
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='notes' and policyname='allow_read_notes') then
    create policy "allow_read_notes" on public.notes
    for select using (public.is_allowed_user());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='notes' and policyname='allow_write_notes') then
    create policy "allow_write_notes" on public.notes
    for all using (public.is_allowed_user()) with check (public.is_allowed_user());
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='tasks' and policyname='allow_read_tasks') then
    create policy "allow_read_tasks" on public.tasks
    for select using (public.is_allowed_user());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='tasks' and policyname='allow_write_tasks') then
    create policy "allow_write_tasks" on public.tasks
    for all using (public.is_allowed_user()) with check (public.is_allowed_user());
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='research_topics' and policyname='allow_read_research_topics') then
    create policy "allow_read_research_topics" on public.research_topics
    for select using (public.is_allowed_user());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='research_topics' and policyname='allow_write_research_topics') then
    create policy "allow_write_research_topics" on public.research_topics
    for all using (public.is_allowed_user()) with check (public.is_allowed_user());
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='research_messages' and policyname='allow_read_research_messages') then
    create policy "allow_read_research_messages" on public.research_messages
    for select using (public.is_allowed_user());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='research_messages' and policyname='allow_write_research_messages') then
    create policy "allow_write_research_messages" on public.research_messages
    for all using (public.is_allowed_user()) with check (public.is_allowed_user());
  end if;
end$$;

-- seed businesses
insert into public.businesses (slug, name)
values
  ('aiugc','AIUGC'),
  ('hairloss','Hair Loss'),
  ('newsletter','Newsletter'),
  ('app','App'),
  ('tickets','Tickets')
on conflict (slug) do nothing;


-- =========================
-- Central Brain v2 (user-owned data)
-- =========================

-- Tasks (user-owned)
create table if not exists public.cb_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  notes text,
  status text not null default 'todo' check (status in ('todo','doing','done','blocked')),
  priority int not null default 2 check (priority between 1 and 3),
  due_at timestamptz,
  board_id uuid,
  column_id uuid,
  position int not null default 1,
  assignee text check (assignee in ('ziga','bart')),
  recurrence_rule text check (recurrence_rule in ('daily','weekly','monthly','yearly')),
  recurrence_interval int not null default 1 check (recurrence_interval >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ensure new cb_tasks columns exist for existing installs
alter table public.cb_tasks add column if not exists board_id uuid;
alter table public.cb_tasks add column if not exists column_id uuid;
alter table public.cb_tasks add column if not exists position int not null default 1;
alter table public.cb_tasks add column if not exists assignee text check (assignee in ('ziga','bart'));
alter table public.cb_tasks add column if not exists recurrence_rule text check (recurrence_rule in ('daily','weekly','monthly','yearly'));
alter table public.cb_tasks add column if not exists recurrence_interval int not null default 1 check (recurrence_interval >= 1);

create index if not exists cb_tasks_user_id_idx on public.cb_tasks (user_id);
create index if not exists cb_tasks_status_idx on public.cb_tasks (user_id, status);
create index if not exists cb_tasks_due_at_idx on public.cb_tasks (user_id, due_at);
create index if not exists cb_tasks_board_idx on public.cb_tasks (user_id, board_id, column_id, position);

-- Notes (user-owned)
create table if not exists public.cb_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cb_notes_user_id_idx on public.cb_notes (user_id);

-- Link notes to tasks
create table if not exists public.cb_task_note_links (
  task_id uuid not null references public.cb_tasks(id) on delete cascade,
  note_id uuid not null references public.cb_notes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (task_id, note_id)
);

create index if not exists cb_task_note_links_user_id_idx on public.cb_task_note_links (user_id);

-- Kanban board
create table if not exists public.cb_kanban_columns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  position int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cb_kanban_columns_user_id_idx on public.cb_kanban_columns (user_id, position);

create table if not exists public.cb_kanban_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  column_id uuid not null references public.cb_kanban_columns(id) on delete cascade,
  item_type text not null check (item_type in ('note','task')),
  item_id uuid not null,
  position int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cb_kanban_cards_user_id_idx on public.cb_kanban_cards (user_id, column_id, position);
create index if not exists cb_kanban_cards_item_idx on public.cb_kanban_cards (user_id, item_type, item_id);

-- Boards (user-owned)
create table if not exists public.cb_boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cb_boards_user_id_idx on public.cb_boards (user_id, created_at desc);
create index if not exists cb_boards_default_idx on public.cb_boards (user_id, is_default);

-- Board columns (user-owned)
create table if not exists public.cb_board_columns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  board_id uuid not null references public.cb_boards(id) on delete cascade,
  title text not null,
  position int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cb_board_columns_user_id_idx on public.cb_board_columns (user_id, board_id, position);

-- foreign keys for board-aware tasks (guarded for idempotency)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'cb_tasks_board_id_fkey'
  ) then
    alter table public.cb_tasks
      add constraint cb_tasks_board_id_fkey foreign key (board_id)
      references public.cb_boards(id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'cb_tasks_column_id_fkey'
  ) then
    alter table public.cb_tasks
      add constraint cb_tasks_column_id_fkey foreign key (column_id)
      references public.cb_board_columns(id) on delete set null;
  end if;
end$$;

-- Activity log (user-owned)
create table if not exists public.cb_activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists cb_activity_log_user_id_idx on public.cb_activity_log (user_id, created_at desc);

-- Invites (admin-managed). No RLS policies by default; app uses service-role.
create table if not exists public.cb_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null default 'user' check (role in ('user','admin')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

-- updated_at triggers for new tables
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'set_cb_tasks_updated_at'
  ) then
    create trigger set_cb_tasks_updated_at before update on public.cb_tasks
    for each row execute function public.set_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'set_cb_notes_updated_at'
  ) then
    create trigger set_cb_notes_updated_at before update on public.cb_notes
    for each row execute function public.set_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'set_cb_kanban_columns_updated_at'
  ) then
    create trigger set_cb_kanban_columns_updated_at before update on public.cb_kanban_columns
    for each row execute function public.set_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'set_cb_kanban_cards_updated_at'
  ) then
    create trigger set_cb_kanban_cards_updated_at before update on public.cb_kanban_cards
    for each row execute function public.set_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'set_cb_boards_updated_at'
  ) then
    create trigger set_cb_boards_updated_at before update on public.cb_boards
    for each row execute function public.set_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'set_cb_board_columns_updated_at'
  ) then
    create trigger set_cb_board_columns_updated_at before update on public.cb_board_columns
    for each row execute function public.set_updated_at();
  end if;
end$$;

-- RLS
alter table public.cb_tasks enable row level security;
alter table public.cb_notes enable row level security;
alter table public.cb_task_note_links enable row level security;
alter table public.cb_kanban_columns enable row level security;
alter table public.cb_kanban_cards enable row level security;
alter table public.cb_activity_log enable row level security;
alter table public.cb_invites enable row level security;
alter table public.cb_boards enable row level security;
alter table public.cb_board_columns enable row level security;

-- Policies: user can only access their own rows (guarded because Postgres lacks CREATE POLICY IF NOT EXISTS)
do $$
begin
  -- cb_tasks
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cb_tasks' and policyname='cb_tasks_own_select') then
    create policy cb_tasks_own_select on public.cb_tasks for select to authenticated using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cb_tasks' and policyname='cb_tasks_own_insert') then
    create policy cb_tasks_own_insert on public.cb_tasks for insert to authenticated with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cb_tasks' and policyname='cb_tasks_own_update') then
    create policy cb_tasks_own_update on public.cb_tasks for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cb_tasks' and policyname='cb_tasks_own_delete') then
    create policy cb_tasks_own_delete on public.cb_tasks for delete to authenticated using (user_id = auth.uid());
  end if;

  -- cb_notes
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cb_notes' and policyname='cb_notes_own_select') then
    create policy cb_notes_own_select on public.cb_notes for select to authenticated using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cb_notes' and policyname='cb_notes_own_insert') then
    create policy cb_notes_own_insert on public.cb_notes for insert to authenticated with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cb_notes' and policyname='cb_notes_own_update') then
    create policy cb_notes_own_update on public.cb_notes for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cb_notes' and policyname='cb_notes_own_delete') then
    create policy cb_notes_own_delete on public.cb_notes for delete to authenticated using (user_id = auth.uid());
  end if;

  -- cb_task_note_links
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cb_task_note_links' and policyname='cb_task_note_links_own_select') then
    create policy cb_task_note_links_own_select on public.cb_task_note_links for select to authenticated using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cb_task_note_links' and policyname='cb_task_note_links_own_insert') then
    create policy cb_task_note_links_own_insert on public.cb_task_note_links for insert to authenticated with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cb_task_note_links' and policyname='cb_task_note_links_own_update') then
    create policy cb_task_note_links_own_update on public.cb_task_note_links for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cb_task_note_links' and policyname='cb_task_note_links_own_delete') then
    create policy cb_task_note_links_own_delete on public.cb_task_note_links for delete to authenticated using (user_id = auth.uid());
  end if;

  -- cb_kanban_columns
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cb_kanban_columns' and policyname='cb_kanban_columns_own_select') then
    create policy cb_kanban_columns_own_select on public.cb_kanban_columns for select to authenticated using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cb_kanban_columns' and policyname='cb_kanban_columns_own_insert') then
    create policy cb_kanban_columns_own_insert on public.cb_kanban_columns for insert to authenticated with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cb_kanban_columns' and policyname='cb_kanban_columns_own_update') then
    create policy cb_kanban_columns_own_update on public.cb_kanban_columns for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cb_kanban_columns' and policyname='cb_kanban_columns_own_delete') then
    create policy cb_kanban_columns_own_delete on public.cb_kanban_columns for delete to authenticated using (user_id = auth.uid());
  end if;

  -- cb_kanban_cards
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cb_kanban_cards' and policyname='cb_kanban_cards_own_select') then
    create policy cb_kanban_cards_own_select on public.cb_kanban_cards for select to authenticated using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cb_kanban_cards' and policyname='cb_kanban_cards_own_insert') then
    create policy cb_kanban_cards_own_insert on public.cb_kanban_cards for insert to authenticated with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cb_kanban_cards' and policyname='cb_kanban_cards_own_update') then
    create policy cb_kanban_cards_own_update on public.cb_kanban_cards for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cb_kanban_cards' and policyname='cb_kanban_cards_own_delete') then
    create policy cb_kanban_cards_own_delete on public.cb_kanban_cards for delete to authenticated using (user_id = auth.uid());
  end if;

  -- cb_activity_log
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cb_activity_log' and policyname='cb_activity_log_own_select') then
    create policy cb_activity_log_own_select on public.cb_activity_log for select to authenticated using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cb_activity_log' and policyname='cb_activity_log_own_insert') then
    create policy cb_activity_log_own_insert on public.cb_activity_log for insert to authenticated with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cb_activity_log' and policyname='cb_activity_log_own_update') then
    create policy cb_activity_log_own_update on public.cb_activity_log for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cb_activity_log' and policyname='cb_activity_log_own_delete') then
    create policy cb_activity_log_own_delete on public.cb_activity_log for delete to authenticated using (user_id = auth.uid());
  end if;

  -- cb_boards
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cb_boards' and policyname='cb_boards_own_select') then
    create policy cb_boards_own_select on public.cb_boards for select to authenticated using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cb_boards' and policyname='cb_boards_own_insert') then
    create policy cb_boards_own_insert on public.cb_boards for insert to authenticated with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cb_boards' and policyname='cb_boards_own_update') then
    create policy cb_boards_own_update on public.cb_boards for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cb_boards' and policyname='cb_boards_own_delete') then
    create policy cb_boards_own_delete on public.cb_boards for delete to authenticated using (user_id = auth.uid());
  end if;

  -- cb_board_columns
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cb_board_columns' and policyname='cb_board_columns_own_select') then
    create policy cb_board_columns_own_select on public.cb_board_columns for select to authenticated using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cb_board_columns' and policyname='cb_board_columns_own_insert') then
    create policy cb_board_columns_own_insert on public.cb_board_columns for insert to authenticated with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cb_board_columns' and policyname='cb_board_columns_own_update') then
    create policy cb_board_columns_own_update on public.cb_board_columns for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='cb_board_columns' and policyname='cb_board_columns_own_delete') then
    create policy cb_board_columns_own_delete on public.cb_board_columns for delete to authenticated using (user_id = auth.uid());
  end if;
end$$;

-- cb_invites: intentionally no RLS policies; access via service role only
