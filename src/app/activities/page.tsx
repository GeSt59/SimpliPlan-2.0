"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { List, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { resolveCategoryPicture, formatActivityDateTime, startOfTodayIso } from "@/lib/activities";
import type { ActivityCategory } from "@/lib/activities";
import { ActivityFormDialog } from "@/components/activity-form-dialog";
import type { ActivityRecord } from "@/components/activity-form-dialog";
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

const ACTIVITY_COLUMNS = "id, name, category, du_z, du_zbis, ort, beschreibung, einteilungens";

export default function ActivitiesPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <ActivitiesPageContent />
    </Suspense>
  );
}

function ActivitiesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [vereinId, setVereinId] = useState<number | null>(null);
  const [ownUserId, setOwnUserId] = useState<number | null>(null);

  const [categories, setCategories] = useState<ActivityCategory[]>([]);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityRecord | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<ActivityRecord | null>(null);
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
        .select("id, admin, verein")
        .eq("auth_user_id", session.user.id)
        .maybeSingle();

      if (!active) return;

      const vId = userRow?.verein?.[0];

      if (!vId) {
        window.location.href = "/";
        return;
      }

      setVereinId(vId);
      setOwnUserId(userRow?.id ?? null);
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
    if (allowed && isAdmin && searchParams.get("new") === "1") {
      openCreateDialog();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed, isAdmin, searchParams]);

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

  function openCreateDialog() {
    setEditingActivity(null);
    setDialogOpen(true);
  }

  function openEditDialog(activity: ActivityRecord) {
    setEditingActivity(activity);
    setDialogOpen(true);
  }

  async function handleSaved(savedId: number) {
    if (!vereinId) return;
    const wasCreate = editingActivity === null;
    await loadActivities(vereinId);
    if (wasCreate) {
      router.push(`/activities/${savedId}`);
    }
  }

  function openDeleteDialog(activity: ActivityRecord) {
    setDeleteTarget(activity);
    setDeleteError(null);
  }

  async function confirmDelete() {
    if (!deleteTarget || !vereinId) return;
    setDeleteSaving(true);
    setDeleteError(null);

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

  const hasEinteilungen = (deleteTarget?.einteilungens?.length ?? 0) > 0;

  return (
    <main className="min-h-screen bg-background pb-40">
      <div className="bg-brand-blue px-4 py-6 text-center">
        <h1 className="font-heading text-2xl font-bold text-white">Activities</h1>
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6">
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
              <Button onClick={openCreateDialog} variant="outline" className="font-semibold uppercase tracking-wide">
                Neue Activity anlegen
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
                <li key={a.id} className="flex items-stretch gap-3 rounded-lg border bg-card p-3 shadow-sm">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
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
                        onClick={() => openDeleteDialog(a)}
                        className="text-brand-gold hover:opacity-80"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        type="button"
                        aria-label="Activity bearbeiten"
                        onClick={() => openEditDialog(a)}
                        className="text-brand-blue hover:opacity-80"
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label="Zu Zeitbereichen"
                      onClick={() => router.push(`/activities/${a.id}`)}
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

        <Button asChild variant="outline" className="font-semibold uppercase tracking-wide">
          <Link href="/activities/archiv">Archiv anzeigen</Link>
        </Button>
      </div>

      {isAdmin && (
        <button
          type="button"
          onClick={openCreateDialog}
          aria-label="Neue Activity anlegen"
          className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-gold text-black shadow-lg hover:bg-brand-gold/90"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {vereinId && (
        <ActivityFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          vereinId={vereinId}
          createdByUserId={ownUserId}
          categories={categories}
          activity={editingActivity}
          onSaved={handleSaved}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {hasEinteilungen ? "Activity hat bereits eingeteilte Helfer" : "Activity löschen?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteError
                ? deleteError
                : hasEinteilungen
                  ? `„${deleteTarget?.name}" hat bereits eingeteilte Helfer. Beim Löschen gehen diese Zuordnungen unwiderruflich verloren.`
                  : `„${deleteTarget?.name}" wird unwiderruflich gelöscht.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction disabled={deleteSaving} onClick={() => void confirmDelete()}>
              {deleteSaving ? "Wird gelöscht..." : hasEinteilungen ? "Trotzdem löschen" : "Löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
