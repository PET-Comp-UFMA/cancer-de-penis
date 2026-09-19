create table if not exists app_private.admin_forms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references app_private.admin_users(id) on delete cascade,
  catalog_key text not null,
  title text not null,
  description text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  definition_state text not null default 'incomplete' check (definition_state in ('incomplete', 'complete')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_forms_owner_catalog_key_unique unique (owner_id, catalog_key)
);

create index if not exists admin_forms_owner_updated_idx
  on app_private.admin_forms (owner_id, updated_at desc, id desc);

alter table app_private.admin_forms enable row level security;

do $$
begin
  if not exists (
    select 1
      from pg_policy
     where polname = 'admin_forms_owner_select'
       and polrelid = 'app_private.admin_forms'::regclass
  ) then
    create policy admin_forms_owner_select on app_private.admin_forms
      for select
      using (
        owner_id = nullif(current_setting('app.current_user_id', true), '')::uuid
      );
  end if;
end $$;

revoke all on app_private.admin_forms from public;

do $$
declare web_role text;
begin
  foreach web_role in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = web_role) then
      execute format('revoke all on app_private.admin_forms from %I', web_role);
    end if;
  end loop;
  if exists (select 1 from pg_roles where rolname = 'avaliapen_runtime') then
    grant select on app_private.admin_forms to avaliapen_runtime;
  end if;
end $$;
