import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { scopedClientFromRequest } from "@/lib/supabase-scoped";

const patchSchema = z.object({
  vorname: z.string().min(1),
  nachname: z.string().min(1),
  email: z.string().email(),
  telefonnummer: z.string().nullable().optional(),
  mitgliedsnumer: z.string().nullable().optional(),
  geburtstag: z.string().nullable().optional(),
  vorherTitel: z.string().nullable().optional(),
  titelNachher: z.string().nullable().optional(),
  profilePictureUrl: z.string().nullable().optional(),
});

export async function PATCH(request: NextRequest) {
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

  // Target is always the caller's own row - no id param, unlike the
  // admin-facing PATCH /api/mitglieder/[id] route.
  const { data: target, error: targetError } = await scoped
    .from("users")
    .select("id, auth_user_id, email")
    .eq("auth_user_id", authData.user.id)
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
    // Same pre-check pattern as PATCH /api/mitglieder/[id]: updateUserById()
    // doesn't surface a distinguishable duplicate-email error, so check
    // first instead of relying on error-message matching alone.
    const { data: existing } = await supabaseAdmin
      .from("users")
      .select("id")
      .ilike("email", trimmedEmail)
      .neq("id", target.id)
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
      telefonnummer: values.telefonnummer?.trim() || null,
      mitgliedsnumer: values.mitgliedsnumer?.trim() || null,
      geburtstag: values.geburtstag?.trim() || null,
      vorher_titel: values.vorherTitel?.trim() || null,
      titel_nachher: values.titelNachher?.trim() || null,
      ...(values.profilePictureUrl !== undefined ? { profile_picture_url: values.profilePictureUrl } : {}),
    })
    .eq("id", target.id)
    .select("id");

  if (updateError || !updatedRows || updatedRows.length === 0) {
    if (emailChanged && target.auth_user_id) {
      await supabaseAdmin.auth.admin.updateUserById(target.auth_user_id, { email: previousEmail || undefined });
    }

    if (updateError) {
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
