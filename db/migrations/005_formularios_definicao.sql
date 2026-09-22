alter table app_private.admin_forms
  add column if not exists definition jsonb not null default '{}'::jsonb;

alter table app_private.admin_forms
  add column if not exists revision bigint not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_policy
     where polname = 'admin_forms_owner_insert'
       and polrelid = 'app_private.admin_forms'::regclass
  ) then
    create policy admin_forms_owner_insert on app_private.admin_forms
      for insert
      with check (
        owner_id = nullif(current_setting('app.current_user_id', true), '')::uuid
      );
  end if;
end $$;

revoke all on app_private.admin_forms from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'avaliapen_runtime') then
    grant insert on app_private.admin_forms to avaliapen_runtime;
  end if;
end $$;
