"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { AuthShell } from "@/components/auth-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSu, setIsSu] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCheckingSession(false);
      if (data.session) void loadAdminFlag(data.session.user.id);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        void loadAdminFlag(newSession.user.id);
      } else {
        setIsAdmin(false);
        setIsSu(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadAdminFlag(authUserId: string) {
    const { data } = await supabase
      .from("users")
      .select("admin, su")
      .eq("auth_user_id", authUserId)
      .maybeSingle();
    setIsAdmin(!!data?.admin);
    setIsSu(!!data?.su);
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });

    if (loginError || !data.session) {
      setError("E-Mail oder Passwort ist falsch.");
      setLoading(false);
      return;
    }

    const { data: userRow } = await supabase
      .from("users")
      .select("verein")
      .eq("auth_user_id", data.session.user.id)
      .maybeSingle();

    const vereinId = userRow?.verein?.[0];

    if (vereinId) {
      const { data: vereinRow } = await supabase
        .from("vereine")
        .select("freigeschaltet")
        .eq("id", vereinId)
        .maybeSingle();

      if (vereinRow && vereinRow.freigeschaltet === false) {
        await supabase.auth.signOut();
        setError("Dein Verein ist noch nicht freigeschaltet. Bitte wende dich an den SimpliPlan-Betreiber.");
        setLoading(false);
        return;
      }
    }

    window.location.href = "/";
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (checkingSession) {
    return <main className="min-h-screen bg-background" />;
  }

  if (session) {
    return (
      <AuthShell title="Willkommen">
        <div className="flex w-full flex-col items-center gap-5">
          <p className="text-sm text-foreground">Eingeloggt als {session.user.email}</p>
          {isAdmin && (
            <Button asChild variant="outline" className="h-12 w-full font-semibold uppercase tracking-wide">
              <Link href="/voreinstellung">Vereinseinstellungen</Link>
            </Button>
          )}
          {isAdmin && (
            <Button asChild variant="outline" className="h-12 w-full font-semibold uppercase tracking-wide">
              <Link href="/kategorien">Kategorien</Link>
            </Button>
          )}
          {isAdmin && (
            <Button asChild variant="outline" className="h-12 w-full font-semibold uppercase tracking-wide">
              <Link href="/rollen">Rollen</Link>
            </Button>
          )}
          {(isAdmin || isSu) && (
            <Button asChild variant="outline" className="h-12 w-full font-semibold uppercase tracking-wide">
              <Link href="/mitglieder">Mitglieder</Link>
            </Button>
          )}
          {isAdmin && (
            <Button asChild variant="outline" className="h-12 w-full font-semibold uppercase tracking-wide">
              <Link href="/activities">Activities</Link>
            </Button>
          )}
          <Button
            onClick={handleLogout}
            className="h-12 w-full bg-brand-blue font-semibold uppercase tracking-wide text-white hover:bg-brand-blue/90"
          >
            Logout
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Login">
      <form className="flex w-full flex-col gap-5" onSubmit={handleLogin}>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">E-Mail</Label>
          <Input id="email" name="email" type="email" placeholder="E-Mail eingeben..." required />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Passwort</Label>
          <Input id="password" name="password" type="password" placeholder="Passwort eingeben..." required />
        </div>

        <div className="mt-2 flex flex-col gap-3">
          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full bg-brand-blue font-semibold uppercase tracking-wide text-white hover:bg-brand-blue/90"
          >
            {loading ? "Wird eingeloggt..." : "Login"}
          </Button>

          <Button asChild variant="accent" className="h-12 w-full font-semibold uppercase tracking-wide">
            <Link href="/register">Registrieren</Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="h-12 w-full border-brand-gold font-semibold uppercase tracking-wide text-black hover:bg-brand-gold/10"
          >
            <Link href="/forgot-password">Passwort vergessen</Link>
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}
