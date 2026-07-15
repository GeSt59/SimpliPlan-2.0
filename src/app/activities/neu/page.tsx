"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, PlayCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { buildDefaultZeitbereichSlots } from "@/lib/activities";
import type { ActivityCategory } from "@/lib/activities";
import {
  activityFormSchema,
  activityFormValuesToPayload,
  emptyActivityFormValues,
  type ActivityFormValues,
} from "@/lib/activity-form-schema";
import { ActivityFormFields } from "@/components/activity-form-fields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";

const ANLEITUNGSVIDEOS = [
  { label: "Activity anlegen", href: "https://www.youtube.com/watch?v=YYjBDaz1buk" },
  { label: "Clubabend anlegen", href: "https://www.youtube.com/watch?v=TpcaR6ix5_4" },
];

export default function ActivityNeuPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [vereinId, setVereinId] = useState<number | null>(null);
  const [ownUserId, setOwnUserId] = useState<number | null>(null);

  const [categories, setCategories] = useState<ActivityCategory[]>([]);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: emptyActivityFormValues,
  });

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
        .select("id, admin, verein")
        .eq("auth_user_id", session.user.id)
        .maybeSingle();

      if (!active) return;

      const vId = userRow?.verein?.[0];

      if (!vId) {
        window.location.href = "/";
        return;
      }

      if (!userRow?.admin) {
        window.location.href = "/activities";
        return;
      }

      setVereinId(vId);
      setOwnUserId(userRow?.id ?? null);
      setAllowed(true);
      setChecking(false);

      void loadCategories(vId);
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  async function loadCategories(vId: number) {
    const { data } = await supabase
      .from("categories")
      .select("id, adalo_id, name, picture_url")
      .contains("vereine", [vId])
      .order("name", { ascending: true });

    setCategories(data ?? []);
  }

  async function onSubmit(values: ActivityFormValues) {
    if (!vereinId) return;
    setSaving(true);
    setFormError(null);

    const payload = activityFormValuesToPayload(values);

    try {
      const { data: inserted, error } = await supabase
        .from("activities")
        .insert({
          ...payload,
          vereine: [vereinId],
          created_by: ownUserId ? [ownUserId] : null,
        })
        .select("id")
        .single();

      if (error) {
        setFormError("Speichern fehlgeschlagen. Bitte versuche es erneut.");
        setSaving(false);
        return;
      }

      // Automatische Standard-Zeitbereiche (PROJ-9); schlägt das fehl, bleibt die
      // Activity trotzdem gespeichert - der Admin kann Zeitbereiche manuell nachlegen.
      await supabase.from("einstellungen").insert(
        buildDefaultZeitbereichSlots().map((slot) => ({
          zeitbereich: slot.label,
          von: slot.von,
          bis: slot.bis,
          ben: 0,
          activity: [inserted.id],
        }))
      );

      router.push(`/activities/${inserted.id}/zeitbereiche`);
    } catch {
      setFormError("Server nicht erreichbar. Bitte versuche es später erneut.");
      setSaving(false);
    }
  }

  if (checking) {
    return <main className="min-h-screen bg-background" />;
  }

  if (!allowed) {
    return null;
  }

  const hasCategories = categories.length > 0;

  return (
    <main className="min-h-screen bg-background pb-32">
      <div className="relative bg-brand-blue px-4 py-6 text-center">
        <Link
          href="/activities"
          aria-label="Zurück zu Activities"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="font-heading text-2xl font-bold text-white">Activities anlegen</h1>
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6">
        <div className="grid grid-cols-2 gap-2">
          {ANLEITUNGSVIDEOS.map((video) => (
            <a
              key={video.href}
              href={video.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md bg-brand-gold p-3 text-black hover:bg-brand-gold/90"
            >
              <PlayCircle className="h-6 w-6 shrink-0" />
              <span className="flex flex-col">
                <span className="text-xs">Anleitungsvideo</span>
                <span className="text-sm font-semibold">{video.label}</span>
              </span>
            </a>
          ))}
        </div>

        {formError && (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            <ActivityFormFields form={form} categories={categories} />

            <Button
              type="submit"
              disabled={saving || !hasCategories}
              className="h-12 w-full bg-brand-blue font-semibold uppercase tracking-wide text-white hover:bg-brand-blue/90"
            >
              {saving ? "Wird gespeichert..." : "Weiter zu den Zeitbereichen"}
            </Button>
          </form>
        </Form>
      </div>
    </main>
  );
}
