-- Tabla mensual del Arcade (ya aplicado en la base)
create table arcade_scores (
  id           uuid primary key default gen_random_uuid(),
  game         text not null default 'pinball',
  ig_user      text not null check (ig_user ~ '^[a-z0-9._]{1,30}$'),
  score        int  not null check (score between 1 and 5000000),
  duration_ms  int  not null check (duration_ms between 0 and 7200000),
  period       text not null,
  status       text not null default 'pendiente' check (status in ('pendiente', 'validado', 'descalificado')),
  created_at   timestamptz not null default now(),
  constraint arcade_plausible check (duration_ms >= 15000 and score <= duration_ms * 3)
);
create index on arcade_scores (period, score desc);
create index on arcade_scores (ig_user, created_at desc);

create or replace function private.arcade_before_insert()
returns trigger language plpgsql security definer set search_path = public, private as $$
begin
  new.ig_user := lower(regexp_replace(trim(new.ig_user), '^@', ''));
  new.period := to_char(now() at time zone 'America/Mexico_City', 'YYYY-MM');
  new.status := 'pendiente';
  new.created_at := now();
  new.game := 'pinball';
  if (select count(*) from public.arcade_scores
       where ig_user = new.ig_user and created_at > now() - interval '1 hour') >= 30 then
    raise exception 'Demasiadas partidas registradas en la última hora. Intenta más tarde.';
  end if;
  return new;
end $$;
create trigger arcade_before_insert before insert on arcade_scores
for each row execute function private.arcade_before_insert();

alter table arcade_scores enable row level security;
create policy arcade_public_insert on arcade_scores for insert to anon, authenticated with check (true);
create policy arcade_public_read on arcade_scores for select using (status <> 'descalificado' or private.is_partner());
create policy arcade_partner_update on arcade_scores for update using (private.is_partner()) with check (private.is_partner());
create policy arcade_partner_delete on arcade_scores for delete using (private.is_partner());

revoke insert, update, delete on arcade_scores from anon, authenticated;
grant insert (ig_user, score, duration_ms) on arcade_scores to anon, authenticated;
grant update (status) on arcade_scores to authenticated;
grant delete on arcade_scores to authenticated;

create view arcade_leaderboard with (security_invoker = true) as
select ig_user, score, status, created_at
from (
  select distinct on (ig_user) ig_user, score, status, created_at
  from arcade_scores
  where period = to_char(now() at time zone 'America/Mexico_City', 'YYYY-MM')
    and status <> 'descalificado'
  order by ig_user, score desc, created_at asc
) t
order by score desc, created_at asc;
