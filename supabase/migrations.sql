
-- Optional long-form copy shown on /fest/:id.
alter table if exists public.fests
  add column if not exists description text;

create table if not exists fest_removals (
  id uuid primary key,
  fest_name text not null,
  reason text not null check (reason in ('rejected', 'unlisted')),
  removed_at timestamptz not null default now()
);


alter table fest_removals enable row level security;

create or replace function get_fest_status(fest_id uuid)
returns table (
  fest_name text,
  status text,
  college_name text,
  start_date date,
  end_date date
)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Still in the main table — pending or approved.
  return query
    select f.fest_name, f.status, f.college_name, f.start_date, f.end_date
    from fests f
    where f.id = fest_id;

  if found then
    return;
  end if;

  -- Not in fests — check if it was rejected or unlisted.
  return query
    select r.fest_name, r.reason as status, null::text, null::date, null::date
    from fest_removals r
    where r.id = fest_id;

end;
$$;

grant execute on function get_fest_status(uuid) to anon;
