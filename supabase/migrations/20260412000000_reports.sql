create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  brands text[] not null default '{}',
  results jsonb not null,
  duration integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_reports_created_at on reports (created_at desc);

alter table reports enable row level security;

create policy "Reports are publicly readable"
  on reports for select
  using (true);

create policy "Reports are insertable by service role"
  on reports for insert
  with check (true);
