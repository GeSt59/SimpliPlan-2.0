"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { resolveCategoryName, resolveCategoryPicture, formatActivityRange } from "@/lib/activities";
import type { ActivityCategory } from "@/lib/activities";
import { ActivityFormDialog } from "@/components/activity-form-dialog";
import type { ActivityRecord } from "@/components/activity-form-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ACTIVITY_COLUMNS = "id, name, category, du_z, du_zbis, ort, beschreibung, einteilungens";

export default function ActivityDetailPage() {
  const params = useParams<{ id: string }>();
  const activityId = Number(params.id);

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [vereinId, setVereinId] = useState<number | null>(null);

  const [categories, setCategories] = useState<ActivityCategory[]>([]);
  const [activity, setActivity] = useState<ActivityRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);

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

      const vId = userRow?.admin ? userRow.verein?.[0] : undefined;

      if (!vId) {
        window.location.href = "/";
        return;
      }

      setVereinId(vId);
      setAllowed(true);
      setChecking(false);
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!vereinId || !Number.isInteger(activityId)) return;
    void loadCategories(vereinId);
    void loadActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vereinId, activityId]);

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
    setLoading(false);
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

  return (
    <main className="min-h-screen bg-background pb-16">
      <div className="relative bg-brand-blue px-4 py-6 text-center">
        <Link
          href="/activities"
          aria-label="Zurück zu Activities"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="font-heading text-2xl font-bold text-white">{activity?.name}</h1>
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6">
        {loadError && (
          <Alert variant="destructive">
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        )}

        {activity && (
          <>
            <div className="flex flex-col gap-3 rounded-lg border p-4">
              <div className="flex flex-wrap items-center gap-3">
                {resolveCategoryPicture(categories, activity.category) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolveCategoryPicture(categories, activity.category) ?? undefined}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-md object-cover"
                  />
                )}
                <Badge variant="secondary">{resolveCategoryName(categories, activity.category)}</Badge>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Datum &amp; Uhrzeit
                </p>
                <p className="text-sm text-foreground">{formatActivityRange(activity.du_z, activity.du_zbis)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ort</p>
                <p className="text-sm text-foreground">{activity.ort}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Beschreibung</p>
                <p className="whitespace-pre-wrap text-sm text-foreground">
                  {activity.beschreibung || "Keine Beschreibung hinterlegt."}
                </p>
              </div>

              <Button
                onClick={() => setDialogOpen(true)}
                variant="outline"
                className="mt-2 font-semibold uppercase tracking-wide"
              >
                Bearbeiten
              </Button>
            </div>

            <div className="flex flex-col gap-3 rounded-lg border border-dashed p-4">
              <p className="text-sm font-semibold text-foreground">Zeitbereiche</p>
              <p className="text-sm text-muted-foreground">
                Zeitbereiche sind noch nicht verfügbar und folgen mit einem späteren Update.
              </p>
              <Button
                type="button"
                variant="outline"
                disabled
                title="Verfügbar, sobald Zeitbereiche implementiert sind"
                className="w-fit font-semibold uppercase tracking-wide"
              >
                Zeitbereich hinzufügen
              </Button>
            </div>
          </>
        )}

        <Button asChild variant="outline" className="h-12 w-full font-semibold uppercase tracking-wide">
          <Link href="/activities">Zurück zu Activities</Link>
        </Button>
      </div>

      {activity && vereinId && (
        <ActivityFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          vereinId={vereinId}
          createdByUserId={null}
          categories={categories}
          activity={activity}
          onSaved={loadActivity}
        />
      )}
    </main>
  );
}
