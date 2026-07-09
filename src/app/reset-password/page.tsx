"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { AuthShell } from "@/components/auth-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const resetSchema = z
  .object({
    password: z.string().min(6, "Passwort muss mindestens 6 Zeichen haben"),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwörter stimmen nicht überein",
    path: ["passwordConfirm"],
  });

type ResetValues = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const [checked, setChecked] = useState(false);
  const [linkValid, setLinkValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", passwordConfirm: "" },
  });

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setLinkValid(true);
        setChecked(true);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setLinkValid(true);
      setChecked(true);
    });

    const timeout = setTimeout(() => setChecked(true), 3000);

    return () => {
      listener.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function onSubmit(values: ResetValues) {
    setLoading(true);
    setError(null);

    const { error: updateError } = await supabase.auth.updateUser({ password: values.password });

    if (updateError) {
      setError("Passwort konnte nicht gesetzt werden. Bitte versuche es erneut.");
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <AuthShell title="Passwort zurücksetzen">
        <div className="flex w-full flex-col items-center gap-5 text-center">
          <p className="text-sm text-foreground">
            Dein Passwort wurde geändert. Du kannst dich jetzt einloggen.
          </p>
          <Button asChild className="h-12 w-full bg-brand-blue font-semibold uppercase tracking-wide text-white hover:bg-brand-blue/90">
            <Link href="/">Zum Login</Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  if (checked && !linkValid) {
    return (
      <AuthShell title="Passwort zurücksetzen">
        <div className="flex w-full flex-col items-center gap-5 text-center">
          <p className="text-sm text-foreground">
            Dieser Link ist abgelaufen oder ungültig. Bitte fordere einen neuen Link an.
          </p>
          <Button asChild className="h-12 w-full bg-brand-blue font-semibold uppercase tracking-wide text-white hover:bg-brand-blue/90">
            <Link href="/forgot-password">Neuen Link anfordern</Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  if (!checked) {
    return <main className="min-h-screen bg-background" />;
  }

  return (
    <AuthShell title="Passwort zurücksetzen">
      <Form {...form}>
        <form className="flex w-full flex-col gap-5" onSubmit={form.handleSubmit(onSubmit)}>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Neues Passwort</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Neues Passwort eingeben..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="passwordConfirm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Passwort wiederholen</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Passwort wiederholen..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={loading}
            className="mt-2 h-12 w-full bg-brand-blue font-semibold uppercase tracking-wide text-white hover:bg-brand-blue/90"
          >
            {loading ? "Wird gespeichert..." : "Passwort speichern"}
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
}
