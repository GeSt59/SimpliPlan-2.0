"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

const registerSchema = z
  .object({
    vorname: z.string().min(1, "Vorname ist erforderlich"),
    nachname: z.string().min(1, "Nachname ist erforderlich"),
    email: z.string().email("Ungültige E-Mail-Adresse"),
    password: z.string().min(6, "Passwort muss mindestens 6 Zeichen haben"),
    passwordConfirm: z.string(),
    freischaltcode: z.string().min(1, "Freischaltcode ist erforderlich"),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwörter stimmen nicht überein",
    path: ["passwordConfirm"],
  });

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      vorname: "",
      nachname: "",
      email: "",
      password: "",
      passwordConfirm: "",
      freischaltcode: "",
    },
  });

  async function onSubmit(values: RegisterValues) {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        if (body?.error === "invalid_code") {
          setError("Ungültiger Freischaltcode.");
        } else if (body?.error === "email_taken") {
          setError("Diese E-Mail ist bereits registriert.");
        } else {
          setError("Registrierung fehlgeschlagen. Bitte versuche es erneut.");
        }
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Server nicht erreichbar. Bitte versuche es später erneut.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <AuthShell title="Registrieren">
        <div className="flex w-full flex-col items-center gap-5 text-center">
          <p className="text-sm text-foreground">
            Registrierung erfolgreich! Du kannst dich jetzt einloggen.
          </p>
          <Button asChild className="h-12 w-full bg-brand-blue font-semibold uppercase tracking-wide text-white hover:bg-brand-blue/90">
            <Link href="/">Zum Login</Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Registrieren">
      <Form {...form}>
        <form className="flex w-full flex-col gap-5" onSubmit={form.handleSubmit(onSubmit)}>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <FormField
            control={form.control}
            name="vorname"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vorname</FormLabel>
                <FormControl>
                  <Input placeholder="Vorname eingeben..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nachname"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nachname</FormLabel>
                <FormControl>
                  <Input placeholder="Nachname eingeben..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-Mail</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="E-Mail eingeben..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Passwort</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Passwort eingeben..." {...field} />
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

          <FormField
            control={form.control}
            name="freischaltcode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Freischaltcode</FormLabel>
                <FormControl>
                  <Input placeholder="Freischaltcode eingeben..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="mt-2 flex flex-col gap-3">
            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full bg-brand-blue font-semibold uppercase tracking-wide text-white hover:bg-brand-blue/90"
            >
              {loading ? "Wird registriert..." : "Registrieren"}
            </Button>

            <Button asChild variant="outline" className="h-12 w-full font-semibold uppercase tracking-wide">
              <Link href="/">Zurück zum Login</Link>
            </Button>
          </div>
        </form>
      </Form>
    </AuthShell>
  );
}
