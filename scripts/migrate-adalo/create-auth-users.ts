/**
 * Creates a Supabase Auth account (email + password) for every migrated user
 * that doesn't have one yet, and links it back via users.auth_user_id.
 *
 * Real Adalo passwords could not be migrated (Adalo's API always masks them),
 * so each user gets a freshly generated temporary password. Users should be
 * told to change it after first login (this script does not enforce that -
 * enforce it in the app's login flow if needed).
 *
 * Usage:
 *   npm run migrate:adalo:auth
 *
 * Output: scripts/migrate-adalo/temp-passwords.json (gitignored)
 *   [{ "email": "...", "tempPassword": "..." }, ...]
 * Handle this file carefully - it's a one-time list of live credentials.
 * Distribute it to users through a secure channel, then delete it.
 */
import { config as loadEnv } from "dotenv";
import path from "node:path";
import { writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

loadEnv({ path: path.join(__dirname, "..", "..", ".env.local") });

const OUTPUT_PATH = path.join(__dirname, "temp-passwords.json");

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var ${name}. Set it in .env.local.`);
  return value;
}

function generateTempPassword(): string {
  return randomBytes(12).toString("base64url"); // ~16 chars, mixed case + digits + -/_
}

async function main() {
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: users, error } = await supabase
    .from("users")
    .select("adalo_id, email, voller_name, auth_user_id")
    .is("auth_user_id", null);

  if (error) throw new Error(`Could not read users: ${error.message}`);
  console.log(`${users.length} user(s) without an auth account yet`);

  const created: { email: string; tempPassword: string }[] = [];

  for (const user of users as any[]) {
    const tempPassword = generateTempPassword();
    const { data, error: createError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: user.voller_name, adalo_id: user.adalo_id },
    });

    if (createError) {
      console.warn(`  skip ${user.email}: ${createError.message}`);
      continue;
    }

    const { error: linkError } = await supabase
      .from("users")
      .update({ auth_user_id: data.user.id })
      .eq("adalo_id", user.adalo_id);

    if (linkError) {
      console.warn(`  created auth user for ${user.email} but failed to link: ${linkError.message}`);
      continue;
    }

    created.push({ email: user.email, tempPassword });
    console.log(`  created + linked ${user.email}`);
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(created, null, 2));
  console.log(`\n${created.length} auth account(s) created. Temp passwords written to ${OUTPUT_PATH}`);
  console.log("Distribute these via a secure channel, then delete the file.");
}

main().catch((err) => {
  console.error("\nAuth user creation failed:", err.message);
  process.exit(1);
});
