-- Correos autorizados como socios: al crear su usuario en Authentication se agregan solos a partners.
-- Para agregar un socio nuevo: insert into private.partner_invites (email, name) values ('correo', 'Nombre');
create table private.partner_invites (
  email text primary key,
  name  text not null
);

insert into private.partner_invites (email, name) values
  ('rterango91@gmail.com', 'Ricardo'),
  ('lugoadrianc@gmail.com', 'Adrián');

create or replace function private.link_partner()
returns trigger language plpgsql security definer set search_path = public, private as $$
begin
  insert into public.partners (user_id, name)
  select new.id, i.name from private.partner_invites i where lower(i.email) = lower(new.email)
  on conflict (user_id) do nothing;
  return new;
end $$;

create trigger on_auth_user_link_partner
after insert on auth.users
for each row execute function private.link_partner();

insert into public.partners (user_id, name)
select u.id, i.name from auth.users u join private.partner_invites i on lower(i.email) = lower(u.email)
on conflict (user_id) do nothing;
