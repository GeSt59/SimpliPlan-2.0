import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { scopedClientFromRequest } from "@/lib/supabase-scoped";

const bodySchema = z.object({
  action: z.enum(["hinzufuegen", "entfernen"]),
  mitgliedId: z.number().int().positive(),
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
    .select("id, admin")
    .eq("auth_user_id", authData.user.id)
    .maybeSingle();

  if (meError) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
  if (!me?.admin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // RLS scopes this SELECT to Zeitbereiche des eigenen Vereins (einstellungen_select_own).
  // Keine sichtbare Zeile bedeutet "nicht berechtigt", nicht "existiert nicht".
  const { data: zeitbereich, error: zeitbereichError } = await scoped
    .from("einstellungen")
    .select("id, eingeteilte_users")
    .eq("id", zeitbereichId)
    .maybeSingle();

  if (zeitbereichError) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
  if (!zeitbereich) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // mitglieder_namen ist bereits über current_user_verein() auf den eigenen Verein beschränkt
  // (PROJ-10); kein sichtbarer Treffer bedeutet, das Ziel-Mitglied gehört nicht zum eigenen Verein.
  const { data: target, error: targetError } = await scoped
    .from("mitglieder_namen")
    .select("id, adalo_id")
    .eq("id", parsed.data.mitgliedId)
    .maybeSingle();

  if (targetError) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
  if (!target) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const current: (string | number)[] = zeitbereich.eingeteilte_users ?? [];
  const isTarget = (ref: string | number) =>
    String(ref) === String(target.id) || (target.adalo_id != null && String(ref) === String(target.adalo_id));

  const updated =
    parsed.data.action === "hinzufuegen"
      ? current.some(isTarget)
        ? current
        : [...current, target.id]
      : current.filter((ref) => !isTarget(ref));

  const { error: updateError } = await supabaseAdmin
    .from("einstellungen")
    .update({ eingeteilte_users: updated })
    .eq("id", zeitbereichId);

  if (updateError) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, eingeteilteUsers: updated }, { status: 200 });
}
