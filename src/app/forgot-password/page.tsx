"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { AuthShell } from "@/components/auth-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setSubmitted(true);
    } catch {
      setError("Server nicht erreichbar. Bitte versuche es später erneut.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <AuthShell title="Passwort vergessen">
        <div className="flex w-full flex-col items-center gap-5 text-center">
          <p className="text-sm text-foreground">
            Falls diese E-Mail existiert, wurde ein Link zum Zurücksetzen des Passworts gesendet.
          </p>
          <Button asChild className="h-12 w-full bg-brand-blue font-semibold uppercase tracking-wide text-white hover:bg-brand-blue/90">
            <Link href="/">Zurück zum Login</Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Passwort vergessen">
      <form className="flex w-full flex-col gap-5" onSubmit={handleSubmit}>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">E-Mail</Label>
          <Input id="email" name="email" type="email" placeholder="E-Mail eingeben..." required />
        </div>

        <div className="mt-2 flex flex-col gap-3">
          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full bg-brand-blue font-semibold uppercase tracking-wide text-white hover:bg-brand-blue/90"
          >
            {loading ? "Wird gesendet..." : "Link senden"}
          </Button>

          <Button asChild variant="outline" className="h-12 w-full font-semibold uppercase tracking-wide">
            <Link href="/">Zurück zum Login</Link>
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}
