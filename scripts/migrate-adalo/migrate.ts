/**
 * One-off / repeatable Adalo -> Supabase data migration.
 *
 * Usage:
 *   npm run migrate:adalo            # only migrate records newer than the last run
 *   npm run migrate:adalo -- --full  # re-upsert everything (cursor is ignored, then updated)
 *
 * Requires (in .env.local, never committed):
 *   ADALO_APP_ID, ADALO_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Requires (scripts/migrate-adalo/tables.config.json):
 *   [{ "adaloCollectionId": "...", "tableName": "..." }, ...]
 * Collection IDs come from Adalo's own generated API docs
 * (App Settings -> API Access, after enabling public API access per collection).
 *
 * Target Supabase tables must already exist with an `adalo_id` bigint UNIQUE column
 * used as the upsert conflict key (see scripts/migrate-adalo/README.md).
 */
import { config as loadEnv } from "dotenv";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

loadEnv({ path: path.join(__dirname, "..", "..", ".env.local") });

const CONFIG_PATH = path.join(__dirname, "tables.config.json");
const STATE_PATH = path.join(__dirname, "migration-state.json");
const ADALO_PAGE_SIZE = 100;

interface TableConfig {
  adaloCollectionId: string;
  tableName: string;
  excludeFields?: string[]; // Adalo field names (as returned by the API) to skip entirely
}

type MigrationState = Record<string, number>; // tableName -> last migrated adalo id

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var ${name}. Set it in .env.local (see .env.local.example).`);
  }
  return value;
}

function loadTableConfigs(): TableConfig[] {
  const raw = JSON.parse(readFileSync(CONFIG_PATH, "utf-8")) as TableConfig[];
  for (const entry of raw) {
    if (!entry.adaloCollectionId || entry.adaloCollectionId.startsWith("REPLACE_")) {
      throw new Error(`tables.config.json is not filled in yet (found placeholder for "${entry.tableName}").`);
    }
  }
  return raw;
}

function loadState(): MigrationState {
  if (!existsSync(STATE_PATH)) return {};
  return JSON.parse(readFileSync(STATE_PATH, "utf-8"));
}

function saveState(state: MigrationState) {
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

function toSnakeCase(key: string): string {
  return key
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .replace(/^_+|_+$/g, "");
}

interface AdaloRecord {
  id: number;
  [field: string]: unknown;
}

async function fetchAllAdaloRecords(collectionId: string, appId: string, apiKey: string): Promise<AdaloRecord[]> {
  const records: AdaloRecord[] = [];
  let offset = 0;

  for (;;) {
    const url = `https://api.adalo.com/v0/apps/${appId}/collections/${collectionId}?offset=${offset}&limit=${ADALO_PAGE_SIZE}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      throw new Error(`Adalo API error for collection ${collectionId}: ${res.status} ${res.statusText}`);
    }

    const body = (await res.json()) as { records: AdaloRecord[] };
    records.push(...body.records);

    if (body.records.length < ADALO_PAGE_SIZE) break;
    offset += ADALO_PAGE_SIZE;
  }

  return records;
}

function transformRecord(record: AdaloRecord, excludeFields: string[]): Record<string, unknown> {
  const row: Record<string, unknown> = { adalo_id: record.id };
  for (const [key, value] of Object.entries(record)) {
    if (key === "id" || excludeFields.includes(key)) continue;
    let column = toSnakeCase(key);
    // "id" is reserved for Supabase's own primary key - an Adalo field that
    // snake_cases to "id" (e.g. a field literally named "ID") must not collide.
    if (column === "id") column = "adalo_id_field";
    row[column] = value;
  }
  return row;
}

async function migrateTable(
  config: TableConfig,
  appId: string,
  apiKey: string,
  supabase: ReturnType<typeof createClient>,
  state: MigrationState,
  full: boolean
) {
  const cursor = full ? 0 : state[config.tableName] ?? 0;
  console.log(`\n[${config.tableName}] fetching from Adalo collection ${config.adaloCollectionId} (cursor=${cursor})...`);

  const allRecords = await fetchAllAdaloRecords(config.adaloCollectionId, appId, apiKey);
  const newOrUpdated = allRecords.filter((r) => r.id > cursor);

  console.log(`[${config.tableName}] ${allRecords.length} total records, ${newOrUpdated.length} to upsert`);

  if (newOrUpdated.length === 0) return;

  const rows = newOrUpdated.map((r) => transformRecord(r, config.excludeFields ?? []));
  const { error } = await supabase.from(config.tableName).upsert(rows, { onConflict: "adalo_id" });

  if (error) {
    throw new Error(`Supabase upsert failed for ${config.tableName}: ${error.message}`);
  }

  const maxId = Math.max(...allRecords.map((r) => r.id));
  state[config.tableName] = maxId;
  console.log(`[${config.tableName}] done, cursor advanced to ${maxId}`);
}

async function main() {
  const full = process.argv.includes("--full");

  const appId = requireEnv("ADALO_APP_ID");
  const apiKey = requireEnv("ADALO_API_KEY");
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const configs = loadTableConfigs();
  const state = loadState();

  for (const config of configs) {
    await migrateTable(config, appId, apiKey, supabase, state, full);
    saveState(state); // persist after each table so a later failure doesn't lose earlier progress
  }

  console.log("\nMigration run complete.");
}

main().catch((err) => {
  console.error("\nMigration failed:", err.message);
  process.exit(1);
});
