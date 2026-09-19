do $$
declare
  status_constraint text;
begin
  select conname
    into status_constraint
    from pg_constraint
   where conrelid = 'app_private.admin_forms'::regclass
     and contype = 'c'
     and pg_get_constraintdef(oid) like '%status%';

  if status_constraint is not null then
    execute format('alter table app_private.admin_forms drop constraint %I', status_constraint);
  end if;
end $$;

update app_private.admin_forms
   set status = 'unpublished'
 where status = 'draft';

alter table app_private.admin_forms
  alter column status set default 'unpublished';

alter table app_private.admin_forms
  add constraint admin_forms_status_check
  check (status in ('unpublished', 'published'));

do $$
begin
  if not exists (
    select 1
      from pg_policy
     where polname = 'admin_forms_owner_update'
       and polrelid = 'app_private.admin_forms'::regclass
  ) then
    create policy admin_forms_owner_update on app_private.admin_forms
      for update
      using (
        owner_id = nullif(current_setting('app.current_user_id', true), '')::uuid
      )
      with check (
        owner_id = nullif(current_setting('app.current_user_id', true), '')::uuid
      );
  end if;

  if not exists (
    select 1
      from pg_policy
     where polname = 'admin_forms_owner_delete'
       and polrelid = 'app_private.admin_forms'::regclass
  ) then
    create policy admin_forms_owner_delete on app_private.admin_forms
      for delete
      using (
        owner_id = nullif(current_setting('app.current_user_id', true), '')::uuid
      );
  end if;
end $$;

update app_private.admin_forms
   set status = 'published',
       definition_state = 'complete',
       updated_at = now()
 where upper(catalog_key) in ('PENRISK', 'QUALIPEN');

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'avaliapen_runtime') then
    grant select, update, delete on app_private.admin_forms to avaliapen_runtime;
  end if;
end $$;
