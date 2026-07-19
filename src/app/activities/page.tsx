"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { List, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { resolveCategoryPicture, formatActivityDateTime, startOfTodayIso } from "@/lib/activities";
import type { ActivityCategory } from "@/lib/activities";
import type { ActivityRecord } from "@/lib/activity-form-schema";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ACTIVITY_COLUMNS = "id, adalo_id, name, category, du_z, du_zbis, ort, beschreibung";

export default function ActivitiesPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [vereinId, setVereinId] = useState<number | null>(null);

  const [categories, setCategories] = useState<ActivityCategory[]>([]);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<ActivityRecord | null>(null);
  const [deleteChecking, setDeleteChecking] = useState(false);
  const [hasEinteilungen, setHasEinteilungen] = useState(false);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

      setVereinId(vId);
      setIsAdmin(!!userRow?.admin);
      setAllowed(true);
      setChecking(false);
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!vereinId) return;
    void loadCategories(vereinId);
    void loadActivities(vereinId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vereinId]);

  async function loadCategories(vId: number) {
    const { data } = await supabase
      .from("categories")
      .select("id, adalo_id, name, picture_url")
      .contains("vereine", [vId])
      .order("name", { ascending: true });

    setCategories(data ?? []);
  }

  async function loadActivities(vId: number) {
    setListLoading(true);
    setListError(null);

    const { data, error } = await supabase
      .from("activities")
      .select(ACTIVITY_COLUMNS)
      .contains("vereine", [vId])
      .gte("du_zbis", startOfTodayIso())
      .order("du_zbis", { ascending: true });

    if (error) {
      setListError("Activities konnten nicht geladen werden.");
      setListLoading(false);
      return;
    }

    setActivities(data ?? []);
    setListLoading(false);
  }

  const filteredActivities = activities.filter((a) => {
    if (!search.trim()) return true;
    const term = search.trim().toLowerCase();
    const haystack = `${a.name ?? ""} ${a.ort ?? ""} ${a.beschreibung ?? ""}`.toLowerCase();
    return haystack.includes(term);
  });

  async function openDeleteDialog(activity: ActivityRecord) {
    setDeleteTarget(activity);
    setDeleteError(null);
    setDeleteChecking(true);
    setHasEinteilungen(false);

    // Prüft live gegen die einstellungen-Zeilen dieser Activity, ob mindestens eine
    // bereits eingeteilte Mitglieder hat. activities.einteilungens selbst wird von
    // PROJ-9 nicht gepflegt (nur bei der Adalo-Migration befüllt) und ist daher als
    // Quelle nicht mehr verlässlich, sobald Zeitbereiche über PROJ-9 entstehen.
    const activityFilters = [`activity.cs.{${activity.id}}`];
    if (activity.adalo_id != null) {
      activityFilters.push(`activity.cs.{${activity.adalo_id}}`);
    }

    const { data, error } = await supabase
      .from("einstellungen")
      .select("eingeteilte_users")
      .or(activityFilters.join(","));

    if (error) {
      setDeleteError("Verwendung konnte nicht geprüft werden. Bitte versuche es erneut.");
      setDeleteChecking(false);
      return;
    }

    setHasEinteilungen(!!data?.some((row) => (row.eingeteilte_users?.length ?? 0) > 0));
    setDeleteChecking(false);
  }

  async function confirmDelete() {
    if (!deleteTarget || !vereinId) return;
    setDeleteSaving(true);
    setDeleteError(null);

    // Cascade: zugehörige Zeitbereiche (PROJ-9) zuerst entfernen, damit keine verwaisten
    // einstellungen-Zeilen zurückbleiben (activity-Spalte referenziert id ODER adalo_id).
    const activityFilters = [`activity.cs.{${deleteTarget.id}}`];
    if (deleteTarget.adalo_id != null) {
      activityFilters.push(`activity.cs.{${deleteTarget.adalo_id}}`);
    }
    await supabase.from("einstellungen").delete().or(activityFilters.join(","));

    const { error } = await supabase.from("activities").delete().eq("id", deleteTarget.id);

    if (error) {
      setDeleteError("Löschen fehlgeschlagen. Bitte versuche es erneut.");
      setDeleteSaving(false);
      return;
    }

    setDeleteTarget(null);
    setDeleteSaving(false);
    await loadActivities(vereinId);
  }

  if (checking) {
    return <main className="min-h-screen bg-background" />;
  }

  if (!allowed) {
    return null;
  }

  return (
    <main className="flex min-h-screen justify-center bg-background">
      <div className="flex w-full max-w-[600px] flex-col pb-16">
        <div className="bg-brand-blue px-4 py-3 text-center">
          <h1 className="font-heading text-[21px] font-medium text-white">Activities</h1>
        </div>

        <div className="flex w-full flex-1 flex-col gap-6 border border-gray-400 bg-gray-100 px-4 py-6">
        <Input
          placeholder="Suche nach Titel, Ort oder Beschreibung..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {listError && (
          <Alert variant="destructive">
            <AlertDescription>{listError}</AlertDescription>
          </Alert>
        )}

        {!listLoading && !listError && activities.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-10 text-center">
            <p className="text-sm text-muted-foreground">Noch keine kommenden Activities vorhanden.</p>
            {isAdmin && (
              <Button asChild variant="outline" className="font-semibold uppercase tracking-wide">
                <Link href="/activities/neu">Neue Activity anlegen</Link>
              </Button>
            )}
          </div>
        )}

        {!listLoading && activities.length > 0 && filteredActivities.length === 0 && (
          <p className="text-sm text-muted-foreground">Keine Activities gefunden.</p>
        )}

        {!listLoading && filteredActivities.length > 0 && (
          <ul className="flex flex-col gap-3">
            {filteredActivities.map((a) => {
              const pictureUrl = resolveCategoryPicture(categories, a.category);
              return (
                <li
                  key={a.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => router.push(`/activities/${a.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") router.push(`/activities/${a.id}`);
                  }}
                  className="flex cursor-pointer items-stretch gap-3 rounded-lg border bg-card p-3 shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
                >
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-md bg-white">
                    {pictureUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={pictureUrl} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                    <span className="min-w-0 truncate border-b border-brand-blue text-base font-medium text-brand-blue">
                      {a.name}
                    </span>
                    <span className="text-sm text-foreground">{formatActivityDateTime(a.du_z)}</span>
                    <span className="truncate text-sm text-muted-foreground">{a.ort}</span>
                  </div>

                  <div className="flex shrink-0 flex-col items-center justify-center gap-3">
                    {isAdmin && (
                      <button
                        type="button"
                        aria-label="Activity löschen"
                        onClick={(e) => {
                          e.stopPropagation();
                          void openDeleteDialog(a);
                        }}
                        className="text-brand-gold hover:opacity-80"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        type="button"
                        aria-label="Activity bearbeiten"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/activities/${a.id}/bearbeiten`);
                        }}
                        className="text-brand-blue hover:opacity-80"
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label="Zur Übersicht"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/activities/${a.id}/uebersicht`);
                      }}
                      className="text-brand-blue hover:opacity-80"
                    >
                      <List className="h-5 w-5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <Button asChild className="bg-brand-gold font-semibold uppercase tracking-wide text-black shadow-[0_2px_4px_rgba(0,0,0,0.3)] hover:bg-brand-gold/90">
          <Link href="/activities/archiv">Archiv anzeigen</Link>
        </Button>
        </div>
      </div>

      {isAdmin && (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center">
          <div className="flex w-full max-w-[600px] justify-center px-6">
            <Link
              href="/activities/neu"
              aria-label="Neue Activity anlegen"
              className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-gold text-black shadow-lg hover:bg-brand-gold/90"
            >
              <Plus className="h-6 w-6" />
            </Link>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {hasEinteilungen ? "Activity hat bereits eingeteilte Helfer" : "Activity löschen?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteChecking
                ? "Verwendung wird geprüft..."
                : deleteError
                  ? deleteError
                  : hasEinteilungen
                    ? `„${deleteTarget?.name}" hat bereits eingeteilte Helfer. Beim Löschen gehen diese Zuordnungen unwiderruflich verloren.`
                    : `„${deleteTarget?.name}" wird unwiderruflich gelöscht.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction disabled={deleteSaving || deleteChecking} onClick={() => void confirmDelete()}>
              {deleteSaving ? "Wird gelöscht..." : hasEinteilungen ? "Trotzdem löschen" : "Löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
