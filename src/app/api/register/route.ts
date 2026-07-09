import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";

const registerSchema = z.object({
  vorname: z.string().min(1),
  nachname: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  freischaltcode: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  const { vorname, nachname, email, password, freischaltcode } = parsed.data;

  const { data: verein, error: vereinError } = await supabaseAdmin
    .from("vereine")
    .select("id")
    .ilike("freischaltcode", freischaltcode)
    .maybeSingle();

  if (vereinError) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  if (!verein) {
    return NextResponse.json({ error: "invalid_code" }, { status: 400 });
  }

  const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
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
    verein: [verein.id],
    auth_user_id: authUser.user.id,
    admin: false,
    aktiv: true,
  });

  if (insertError) {
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
