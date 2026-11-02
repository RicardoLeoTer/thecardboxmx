-- Blog + material privado para reels (ya aplicado en la base)
create type post_status as enum ('borrador', 'publicado');

create table blog_posts (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null,
  excerpt       text,
  body_md       text not null,
  cover_url     text,
  category      text default 'Top 5 semanal',
  sources       jsonb not null default '[]',
  status        post_status not null default 'borrador',
  week_of       date,
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on blog_posts (status, published_at desc);

create table blog_reel_kits (
  post_id      uuid primary key references blog_posts(id) on delete cascade,
  script       text not null,
  caption      text,
  hashtags     text,
  story_ideas  text,
  created_at   timestamptz not null default now()
);

create or replace function trg_blog_touch()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  if new.status = 'publicado' and old.status is distinct from 'publicado' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end $$;
create trigger blog_touch before update on blog_posts for each row execute function trg_blog_touch();

alter table blog_posts enable row level security;
alter table blog_reel_kits enable row level security;
create policy pub_read_blog on blog_posts for select using (status = 'publicado' or private.is_partner());
create policy partner_all_blog on blog_posts for all using (private.is_partner()) with check (private.is_partner());
create policy partner_all_reel_kits on blog_reel_kits for all using (private.is_partner()) with check (private.is_partner());
