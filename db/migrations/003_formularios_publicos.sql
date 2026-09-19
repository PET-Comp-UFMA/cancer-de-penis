create index if not exists admin_forms_published_updated_idx
  on app_private.admin_forms (updated_at desc, id desc)
  where status = 'published';

do $$
begin
  if not exists (
    select 1
      from pg_policy
     where polname = 'admin_forms_public_published_select'
       and polrelid = 'app_private.admin_forms'::regclass
  ) then
    create policy admin_forms_public_published_select on app_private.admin_forms
      for select
      using (status = 'published');
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
