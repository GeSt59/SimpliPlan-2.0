"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { ActivityCategory } from "@/lib/activities";
import {
  activityFormSchema,
  activityFormValuesToPayload,
  activityRecordToFormValues,
  emptyActivityFormValues,
  type ActivityFormValues,
  type ActivityRecord,
} from "@/lib/activity-form-schema";
import { ActivityFormFields } from "@/components/activity-form-fields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";

const ACTIVITY_COLUMNS = "id, name, category, du_z, du_zbis, ort, beschreibung";

export default function ActivityBearbeitenPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const activityId = Number(params.id);

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  const [categories, setCategories] = useState<ActivityCategory[]>([]);
  const [activity, setActivity] = useState<ActivityRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

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
        .select("admin, verein")
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

      setAllowed(true);
      setChecking(false);

      void loadCategories(vId);
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!allowed || !Number.isInteger(activityId)) return;
    void loadActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed, activityId]);

  async function loadCategories(vId: number) {
    const { data } = await supabase
      .from("categories")
      .select("id, adalo_id, name, picture_url")
      .contains("vereine", [vId])
      .order("name", { ascending: true });

    setCategories(data ?? []);
  }

  async function loadActivity() {
    setLoading(true);
    setLoadError(null);
    setNotFound(false);

    const { data, error } = await supabase
      .from("activities")
      .select(ACTIVITY_COLUMNS)
      .eq("id", activityId)
      .maybeSingle();

    if (error) {
      setLoadError("Activity konnte nicht geladen werden.");
      setLoading(false);
      return;
    }

    if (!data) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setActivity(data);
    form.reset(activityRecordToFormValues(data));
    setLoading(false);
  }

  async function onSubmit(values: ActivityFormValues) {
    if (!activity) return;
    setSaving(true);
    setFormError(null);

    const payload = activityFormValuesToPayload(values);

    try {
      const { error } = await supabase.from("activities").update(payload).eq("id", activity.id);
      if (error) {
        setFormError("Speichern fehlgeschlagen. Bitte versuche es erneut.");
        setSaving(false);
        return;
      }

      router.push(`/activities/${activity.id}/zeitbereiche`);
    } catch {
      setFormError("Server nicht erreichbar. Bitte versuche es später erneut.");
      setSaving(false);
    }
  }

  if (checking || (!notFound && loading)) {
    return <main className="min-h-screen bg-background" />;
  }

  if (!allowed) {
    return null;
  }

  if (notFound) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <p className="text-sm text-muted-foreground">Diese Activity wurde nicht gefunden.</p>
        <Button asChild variant="outline" className="font-semibold uppercase tracking-wide">
          <Link href="/activities">Zurück zu Activities</Link>
        </Button>
      </main>
    );
  }

  const hasCategories = categories.length > 0;

  return (
    <main className="flex min-h-screen justify-center bg-background">
      <div className="flex w-full max-w-[600px] flex-col pb-16">
        <div className="relative bg-brand-blue px-4 py-3 text-center">
          <Link
            href="/activities"
            aria-label="Zurück zu Activities"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="font-heading text-[21px] font-medium text-white">{activity?.name}</h1>
        </div>

        <div className="flex w-full flex-1 flex-col gap-6 border border-gray-400 bg-gray-100 px-4 py-6">
        {loadError && (
          <Alert variant="destructive">
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <ActivityFormFields form={form} categories={categories} />

            <Button
              type="submit"
              disabled={saving || !hasCategories}
              className="h-12 w-full bg-brand-gold font-semibold uppercase tracking-wide text-black hover:bg-brand-gold/90"
            >
              {saving ? "Wird gespeichert..." : "Speichern und weiter zu den Zeitbereichen"}
            </Button>
          </form>
        </Form>
        </div>
      </div>
    </main>
  );
}
