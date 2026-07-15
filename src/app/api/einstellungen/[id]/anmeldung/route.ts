import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { scopedClientFromRequest } from "@/lib/supabase-scoped";

const bodySchema = z.object({
  action: z.enum(["anmelden", "abmelden"]),
});

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const zeitbereichId = Number(id);

  if (!Number.isInteger(zeitbereichId) || zeitbereichId <= 0) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  const scoped = scopedClientFromRequest(request);
  if (!scoped) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  const { data: authData, error: authError } = await scoped.auth.getUser();
  if (authError || !authData?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: me, error: meError } = await scoped
    .from("users")
    .select("id, adalo_id")
    .eq("auth_user_id", authData.user.id)
    .maybeSingle();

  if (meError) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
  if (!me) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // RLS scopes this SELECT to Zeitbereiche des eigenen Vereins (einstellungen_select_own).
  // Keine sichtbare Zeile bedeutet "nicht berechtigt", nicht "existiert nicht".
  const { data: zeitbereich, error: zeitbereichError } = await scoped
    .from("einstellungen")
    .select("id, ben, rollen, eingeteilte_users")
    .eq("id", zeitbereichId)
    .maybeSingle();

  if (zeitbereichError) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
  if (!zeitbereich) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!zeitbereich.rollen || zeitbereich.rollen.length === 0 || (zeitbereich.ben ?? 0) <= 0) {
    return NextResponse.json({ error: "not_signupable" }, { status: 400 });
  }

  const current: (string | number)[] = zeitbereich.eingeteilte_users ?? [];
  const isMe = (ref: string | number) =>
    String(ref) === String(me.id) || (me.adalo_id != null && String(ref) === String(me.adalo_id));

  const updated =
    parsed.data.action === "anmelden"
      ? current.some(isMe)
        ? current
        : [...current, me.id]
      : current.filter((ref) => !isMe(ref));

  // Schreibt per Service-Role: keine Mitglieder-UPDATE-Policy auf einstellungen nötig,
  // da die Berechtigung (nur die eigene ID) bereits serverseitig oben berechnet wurde.
  const { error: updateError } = await supabaseAdmin
    .from("einstellungen")
    .update({ eingeteilte_users: updated })
    .eq("id", zeitbereichId);

  if (updateError) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, eingeteilteUsers: updated }, { status: 200 });
}
