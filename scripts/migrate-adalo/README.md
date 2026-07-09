# Adalo -> Supabase migration

Migrates data from the Adalo app "Simpliplan" into the Supabase project, and can be
re-run at any time to pull only newly created records since the last run.

## One-time setup

1. In Adalo: **App Settings -> API Access**, enable "Public API access" for every
   collection you want to migrate, and generate an API key.
   This reveals each collection's ID in Adalo's auto-generated API docs.
2. Fill in `scripts/migrate-adalo/tables.config.json` with the real
   `adaloCollectionId` / `tableName` pairs (this file is safe to commit — it
   contains no credentials).
3. Add these to `.env.local` (never commit this file):
   - `ADALO_APP_ID`
   - `ADALO_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL` (already present if Supabase is set up)
   - `SUPABASE_SERVICE_ROLE_KEY` (Supabase dashboard -> Project Settings -> API ->
     `service_role` secret). This key bypasses Row Level Security — it is only
     ever read by this Node script, never shipped to the browser.
4. Create the target tables in Supabase first (via a reviewed SQL migration).
   Every table needs a unique `adalo_id bigint` column — it's the upsert key
   used to avoid duplicate records on reruns.

## Running

```bash
npm run migrate:adalo            # only migrate records newer than last run
npm run migrate:adalo -- --full  # re-check/re-upsert everything
```

Progress is tracked per table in `scripts/migrate-adalo/migration-state.json`
(gitignored, local to this machine). Delete it to force a full re-sync.

## Security notes

- `ADALO_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` must only ever live in
  `.env.local` (gitignored) — never in this repo, never in chat/logs.
- `tables.config.json` and `migrate.ts` contain no secrets and are safe to commit.
- `migration-state.json` contains no secrets either (just table names and
  numeric cursors) but is gitignored anyway since it's machine-local state.
