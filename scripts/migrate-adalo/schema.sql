-- Adalo -> Supabase migration: target table schema
-- Generated from live Adalo sample records (scripts/migrate-adalo/tables.config.json).
-- Safe to commit: no credentials, just structure.
--
-- Conventions:
--   * Supabase manages its own `id` (bigint identity) primary key.
--   * `adalo_id` is the original Adalo record id, UNIQUE, used as the upsert key.
--   * Adalo relation fields (arrays of related record ids) are stored as bigint[].
--   * Adalo file/image fields are stored as jsonb (url/filename/size/etc.).
--   * `created_at` / `updated_at` are Adalo's own timestamps, carried over as-is.
--   * RLS is enabled with no policies yet - only the service role (this migration
--     script) can read/write until policies are added for the app's real access needs.

create table if not exists videos (
  id bigint generated always as identity primary key,
  adalo_id bigint not null unique,
  name text,
  link text,
  created_at timestamptz,
  updated_at timestamptz
);
alter table videos enable row level security;

create table if not exists einstellungen (
  id bigint generated always as identity primary key,
  adalo_id bigint not null unique,
  zeitbereich text,
  activity bigint[],
  ben integer,
  rollen bigint[],
  von text,
  bis text,
  von_zeit text,
  bis_zeit text,
  eingeteilte_users bigint[],
  created_at timestamptz,
  updated_at timestamptz
);
alter table einstellungen enable row level security;

create table if not exists rollen (
  id bigint generated always as identity primary key,
  adalo_id bigint not null unique,
  name text,
  gleich_angemeldet boolean,
  vereine bigint[],
  einteilungens bigint[],
  created_at timestamptz,
  updated_at timestamptz
);
alter table rollen enable row level security;

create table if not exists gemeinde (
  id bigint generated always as identity primary key,
  adalo_id bigint not null unique,
  gemeindename text,
  gemeindelizenz boolean,
  vereines bigint[],
  created_at timestamptz,
  updated_at timestamptz
);
alter table gemeinde enable row level security;

create table if not exists zeitbereiche (
  id bigint generated always as identity primary key,
  adalo_id bigint not null unique,
  name text,
  created_at timestamptz,
  updated_at timestamptz
);
alter table zeitbereiche enable row level security;

create table if not exists vereine (
  id bigint generated always as identity primary key,
  adalo_id bigint not null unique,
  vereinsname text,
  gemeinde bigint[],
  vereinslogo jsonb,
  vereinsnummer text,
  freigeschaltet boolean,
  freischaltcode text,
  tab1 text,
  tab2 text,
  tab3 text,
  tab4 text,
  tab5 text,
  rollens bigint[],
  activities bigint[],
  categories bigint[],
  users bigint[],
  created_at timestamptz,
  updated_at timestamptz
);
alter table vereine enable row level security;

-- Adalo collection currently has 0 records, so its fields could not be inferred.
-- Re-run scripts/migrate-adalo introspection (or add columns manually) once
-- real data exists in Adalo.
create table if not exists notofication (
  id bigint generated always as identity primary key,
  adalo_id bigint not null unique,
  created_at timestamptz,
  updated_at timestamptz
);
alter table notofication enable row level security;

create table if not exists activities (
  id bigint generated always as identity primary key,
  adalo_id bigint not null unique,
  name text,
  vereine bigint[],
  du_z timestamptz,
  du_zbis timestamptz,
  datum timestamptz,
  uhrzeit text,
  category bigint[],
  ort text,
  beschreibung text,
  created_by bigint[],
  einteilungens bigint[],
  created_at timestamptz,
  updated_at timestamptz
);
alter table activities enable row level security;

create table if not exists categories (
  id bigint generated always as identity primary key,
  adalo_id bigint not null unique,
  name text,
  picture jsonb,
  vereine bigint[],
  events bigint[],
  created_at timestamptz,
  updated_at timestamptz
);
alter table categories enable row level security;

-- Note: Adalo's public API always masks the Password field ("[hidden]"), so it
-- carries no real data and is intentionally NOT migrated. User authentication
-- into Supabase needs a separate strategy (e.g. Supabase Auth invite + reset).
-- The Adalo field literally named "ID" collides with our own `id` primary key
-- column, so it is migrated as `adalo_id_field` instead.
create table if not exists users (
  id bigint generated always as identity primary key,
  adalo_id bigint not null unique,
  voller_name text,
  verein bigint[],
  adalo_id_field text,
  email text,
  aktiv boolean,
  vorname text,
  eingeschrieben boolean,
  vorher_titel text,
  admin boolean,
  profile_picture jsonb,
  mitgliedsnumer text,
  berechtigung text,
  nachname text,
  username text,
  geburtstag text,
  titel_nachher text,
  agbs_und_dsvgo boolean,
  su text,
  einteilungens bigint[],
  created_dates bigint[],
  created_at timestamptz,
  updated_at timestamptz
);
alter table users enable row level security;
