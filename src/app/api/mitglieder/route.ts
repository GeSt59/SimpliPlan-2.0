import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { scopedClientFromRequest } from "@/lib/supabase-scoped";

const createMemberSchema = z.object({
  vorname: z.string().min(1),
  nachname: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  vereinId: z.number().int().positive(),
});

export async function POST(request: NextRequest) {
  const scoped = scopedClientFromRequest(request);
  if (!scoped) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createMemberSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  const { vorname, nachname, email, password, vereinId } = parsed.data;

  const { data: authData, error: authError } = await scoped.auth.getUser();
  if (authError || !authData?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: callerRow, error: callerError } = await scoped
    .from("users")
    .select("admin, su, verein")
    .eq("auth_user_id", authData.user.id)
    .maybeSingle();

  if (callerError) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  const isSu = !!callerRow?.su;
  const isAdminOfTarget = !!callerRow?.admin && (callerRow.verein ?? []).includes(vereinId);

  if (!isSu && !isAdminOfTarget) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { data: createdAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: `${vorname} ${nachname}` },
  });

  if (createError) {
    const alreadyRegistered = /already.*registered|email.*exists/i.test(createError.message);
    return NextResponse.json(
      { error: alreadyRegistered ? "email_taken" : "server_error" },
      { status: alreadyRegistered ? 400 : 500 }
    );
  }

  const { error: insertError } = await supabaseAdmin.from("users").insert({
    vorname,
    nachname,
    email,
    verein: [vereinId],
    auth_user_id: createdAuthUser.user.id,
    admin: false,
    aktiv: true,
  });

  if (insertError) {
    await supabaseAdmin.auth.admin.deleteUser(createdAuthUser.user.id);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
