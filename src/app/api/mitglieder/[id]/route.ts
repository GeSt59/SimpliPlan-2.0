import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { scopedClientFromRequest } from "@/lib/supabase-scoped";

const patchSchema = z.object({
  vorname: z.string().min(1),
  nachname: z.string().min(1),
  email: z.string().email(),
  mitgliedsnumer: z.string().nullable().optional(),
  geburtstag: z.string().nullable().optional(),
  vorherTitel: z.string().nullable().optional(),
  titelNachher: z.string().nullable().optional(),
  aktiv: z.boolean(),
  admin: z.boolean(),
});

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const targetId = Number(id);

  if (!Number.isInteger(targetId) || targetId <= 0) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  const scoped = scopedClientFromRequest(request);
  if (!scoped) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  const values = parsed.data;

  const { data: authData, error: authError } = await scoped.auth.getUser();
  if (authError || !authData?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // RLS scopes this SELECT to rows the caller is allowed to see (own verein
  // as admin, or any verein as SU). No visible row means "not authorized",
  // which we report as 403 rather than 404 to avoid leaking existence.
  const { data: target, error: targetError } = await scoped
    .from("users")
    .select("id, auth_user_id, email")
    .eq("id", targetId)
    .maybeSingle();

  if (targetError) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
  if (!target) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const trimmedEmail = values.email.trim();
  const previousEmail = target.email ?? "";
  const emailChanged = previousEmail.trim().toLowerCase() !== trimmedEmail.toLowerCase();

  if (emailChanged && target.auth_user_id) {
    // supabaseAdmin.auth.admin.updateUserById() does not surface a
    // distinguishable error for a duplicate email the way createUser() does
    // (GoTrue wraps the underlying unique-constraint violation into a
    // generic 500 "Error updating user" / code "unexpected_failure").
    // Check for an existing account with this email up front instead of
    // relying on error-message matching for the update path.
    const { data: existing } = await supabaseAdmin
      .from("users")
      .select("id")
      .ilike("email", trimmedEmail)
      .neq("id", targetId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "email_taken" }, { status: 400 });
    }

    const { error: emailUpdateError } = await supabaseAdmin.auth.admin.updateUserById(target.auth_user_id, {
      email: trimmedEmail,
      email_confirm: true,
    });

    if (emailUpdateError) {
      const alreadyRegistered = /already.*registered|email.*exists/i.test(emailUpdateError.message);
      return NextResponse.json(
        { error: alreadyRegistered ? "email_taken" : "server_error" },
        { status: alreadyRegistered ? 400 : 500 }
      );
    }
  }

  const { data: updatedRows, error: updateError } = await scoped
    .from("users")
    .update({
      vorname: values.vorname.trim(),
      nachname: values.nachname.trim(),
      email: trimmedEmail,
      mitgliedsnumer: values.mitgliedsnumer?.trim() || null,
      geburtstag: values.geburtstag?.trim() || null,
      vorher_titel: values.vorherTitel?.trim() || null,
      titel_nachher: values.titelNachher?.trim() || null,
      aktiv: values.aktiv,
      admin: values.admin,
    })
    .eq("id", targetId)
    .select("id");

  if (updateError || !updatedRows || updatedRows.length === 0) {
    if (emailChanged && target.auth_user_id) {
      await supabaseAdmin.auth.admin.updateUserById(target.auth_user_id, { email: previousEmail || undefined });
    }

    if (updateError && /LETZTER_ADMIN_SCHUTZ/i.test(updateError.message)) {
      return NextResponse.json({ error: "last_admin" }, { status: 400 });
    }
    if (updateError) {
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
