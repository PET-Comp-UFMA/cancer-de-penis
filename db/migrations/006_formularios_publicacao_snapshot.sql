alter table app_private.admin_forms
  add column if not exists published_definition jsonb,
  add column if not exists published_revision bigint,
  add column if not exists published_at timestamptz;

update app_private.admin_forms
   set published_definition = case
     when definition is not null and definition <> '{}'::jsonb then definition
     else jsonb_build_object('schemaVersion', 1, 'title', title, 'description', description,
       'imageDataUrl', null, 'authors', '[]'::jsonb, 'questions', '[]'::jsonb, 'resultBands', '[]'::jsonb)
   end,
       published_revision = revision,
       published_at = coalesce(updated_at, now())
 where status = 'published' and published_definition is null;

create index if not exists admin_forms_published_snapshot_idx
  on app_private.admin_forms (published_at desc, id desc)
  where status = 'published' and published_definition is not null;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'avaliapen_runtime') then
    grant select on app_private.admin_forms to avaliapen_runtime;
  end if;
end $$;
