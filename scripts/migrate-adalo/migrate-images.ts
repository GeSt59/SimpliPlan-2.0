/**
 * Copies file/image fields (already migrated as jsonb metadata by migrate.ts)
 * from Adalo's CDN into Supabase Storage, and fills in a matching *_url column
 * with the resulting public Supabase Storage link.
 *
 * Usage:
 *   npm run migrate:adalo:images
 *
 * Adalo file fields only store a bare filename (e.g. "abc123.jpg"), served at
 * https://cdn-uploads.adalo.com/{filename} - confirmed working 2026-07-08.
 */
import { config as loadEnv } from "dotenv";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

loadEnv({ path: path.join(__dirname, "..", "..", ".env.local") });

const BUCKET = "adalo-media";
const ADALO_CDN_BASE = "https://cdn-uploads.adalo.com/";

interface ImageMigrationTarget {
  table: string;
  jsonbColumn: string; // source column holding { url, filename, ... }
  urlColumn: string; // destination column to fill with the Supabase Storage URL
}

const TARGETS: ImageMigrationTarget[] = [
  { table: "users", jsonbColumn: "profile_picture", urlColumn: "profile_picture_url" },
  { table: "vereine", jsonbColumn: "vereinslogo", urlColumn: "vereinslogo_url" },
  { table: "categories", jsonbColumn: "picture", urlColumn: "picture_url" },
];

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var ${name}. Set it in .env.local.`);
  return value;
}

async function ensureBucket(supabase: ReturnType<typeof createClient>) {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw new Error(`Could not list storage buckets: ${error.message}`);
  if (buckets.some((b) => b.name === BUCKET)) return;

  const { error: createError } = await supabase.storage.createBucket(BUCKET, { public: true });
  if (createError) throw new Error(`Could not create bucket ${BUCKET}: ${createError.message}`);
  console.log(`Created public storage bucket "${BUCKET}"`);
}

async function migrateTarget(supabase: ReturnType<typeof createClient>, target: ImageMigrationTarget) {
  const { data: rows, error } = await supabase
    .from(target.table)
    .select(`adalo_id, ${target.jsonbColumn}, ${target.urlColumn}`)
    .not(target.jsonbColumn, "is", null)
    .is(target.urlColumn, null);

  if (error) throw new Error(`Could not read ${target.table}: ${error.message}`);
  console.log(`\n[${target.table}.${target.jsonbColumn}] ${rows.length} image(s) to copy`);

  for (const row of rows as any[]) {
    const meta = row[target.jsonbColumn] as { url?: string; filename?: string };
    if (!meta?.url) continue;

    const res = await fetch(`${ADALO_CDN_BASE}${meta.url}`);
    if (!res.ok) {
      console.warn(`  skip adalo_id=${row.adalo_id}: fetch failed ${res.status}`);
      continue;
    }
    const bytes = new Uint8Array(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") ?? "application/octet-stream";
    const storagePath = `${target.table}/${row.adalo_id}-${meta.url}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, bytes, { contentType, upsert: true });
    if (uploadError) {
      console.warn(`  skip adalo_id=${row.adalo_id}: upload failed ${uploadError.message}`);
      continue;
    }

    const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

    const { error: updateError } = await supabase
      .from(target.table)
      .update({ [target.urlColumn]: publicUrl.publicUrl })
      .eq("adalo_id", row.adalo_id);
    if (updateError) {
      console.warn(`  skip adalo_id=${row.adalo_id}: db update failed ${updateError.message}`);
      continue;
    }

    console.log(`  adalo_id=${row.adalo_id} -> ${storagePath}`);
  }
}

async function main() {
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  await ensureBucket(supabase);
  for (const target of TARGETS) {
    await migrateTarget(supabase, target);
  }
  console.log("\nImage migration complete.");
}

main().catch((err) => {
  console.error("\nImage migration failed:", err.message);
  process.exit(1);
});
