"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { AuthShell } from "@/components/auth-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// SU-Accounts sind keinem Verein zugeordnet - /activities kann für sie nicht laden,
// daher landen sie stattdessen auf /mitglieder (ihr einziger heutiger Einstiegspunkt).
async function resolveLandingPath(authUserId: string) {
  const { data: userRow } = await supabase
    .from("users")
    .select("verein")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  return userRow?.verein?.[0] ? "/activities" : "/mitglieder";
}

export default function Home() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        window.location.href = await resolveLandingPath(data.session.user.id);
        return;
      }
      setCheckingSession(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (newSession) {
        void resolveLandingPath(newSession.user.id).then((path) => {
          window.location.href = path;
        });
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

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

    window.location.href = vereinId ? "/activities" : "/mitglieder";
  }

  if (checkingSession) {
    return <main className="min-h-screen bg-background" />;
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
