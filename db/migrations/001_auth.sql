create schema if not exists app_private;

create table if not exists app_private.admin_users (
  id uuid primary key default gen_random_uuid(),
  username_display text not null,
  username_normalized text not null unique,
  roles text[] not null default array['admin']::text[] check (roles <@ array['admin','responsavel']::text[] and cardinality(roles) > 0),
  status text not null default 'active' check (status in ('active','disabled')),
  password_hash text not null,
  must_change_password boolean not null default true,
  temporary_credential_expires_at timestamptz,
  temporary_credential_used_at timestamptz,
  created_at timestamptz not null default now(),
  password_changed_at timestamptz
);

create table if not exists app_private.admin_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_private.admin_users(id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz
);
create index if not exists admin_sessions_user_idx on app_private.admin_sessions(user_id);

create table if not exists app_private.auth_rate_limits (
  bucket_key text primary key,
  attempts integer not null default 0,
  window_started_at timestamptz not null default now(),
  blocked_until timestamptz
);

revoke all on schema app_private from public;
revoke all on all tables in schema app_private from public;

-- Supabase web roles must never access password hashes or session tables.
do $$
declare web_role text;
begin
  foreach web_role in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = web_role) then
      execute format('revoke all on schema app_private from %I', web_role);
      execute format('revoke all on all tables in schema app_private from %I', web_role);
    end if;
  end loop;
end $$;
