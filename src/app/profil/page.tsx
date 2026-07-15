"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export default function ProfilPage() {
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!session) {
        window.location.href = "/";
        return;
      }

      const { data: userRow } = await supabase
        .from("users")
        .select("admin")
        .eq("auth_user_id", session.user.id)
        .maybeSingle();

      if (!active) return;

      setEmail(session.user.email ?? null);
      setIsAdmin(!!userRow?.admin);
      setChecking(false);
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (checking) {
    return <main className="min-h-screen bg-background" />;
  }

  return (
    <main className="flex min-h-screen justify-center bg-background">
      <div className="flex w-full max-w-[600px] flex-col pb-16">
        <div className="bg-brand-blue px-4 py-3 text-center">
          <h1 className="font-heading text-[21px] font-medium text-white">Profil</h1>
        </div>

        <div className="flex w-full flex-1 flex-col gap-5 border border-gray-400 bg-gray-100 px-4 py-6">
          <p className="text-sm text-foreground">Eingeloggt als {email}</p>

          {isAdmin && (
            <Button asChild variant="outline" className="h-12 w-full font-semibold uppercase tracking-wide">
              <Link href="/voreinstellung">Vereinseinstellungen</Link>
            </Button>
          )}

          <Button
            onClick={handleLogout}
            className="h-12 w-full bg-brand-blue font-semibold uppercase tracking-wide text-white hover:bg-brand-blue/90"
          >
            Logout
          </Button>
        </div>
      </div>
    </main>
  );
}
