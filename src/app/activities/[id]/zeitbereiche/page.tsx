"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { findRole, normalizeTimeValue } from "@/lib/activities";
import type { ZeitbereichRole } from "@/lib/activities";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const LABEL_MAX_LENGTH = 30;

type ZeitbereichRow = {
  key: string;
  id: number | null; // null = neu, noch nicht gespeichert
  label: string;
  benoetigt: number;
  roleId: string; // Select-Wert = Supabase-id der Rolle als String, "" = keine gewählt
  von: string;
  bis: string;
  eingeteilteCount: number;
  saving: boolean;
  error: string | null;
};

type DeleteTarget = { id: number; label: string; eingeteilteCount: number };

export default function ZeitbereichePage() {
  const params = useParams<{ id: string }>();
  const activityId = Number(params.id);

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [vereinId, setVereinId] = useState<number | null>(null);

  const [activityName, setActivityName] = useState<string>("");
  const [notFound, setNotFound] = useState(false);

  const [roles, setRoles] = useState<ZeitbereichRole[]>([]);
  const [rows, setRows] = useState<ZeitbereichRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteSaving, setBulkDeleteSaving] = useState(false);

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
    void (async () => {
      const loadedRoles = await loadRoles(vereinId);
      await loadActivityAndZeitbereiche(loadedRoles);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vereinId, activityId]);

  async function loadRoles(vId: number): Promise<ZeitbereichRole[]> {
    const { data } = await supabase
      .from("rollen")
      .select("id, adalo_id, name, gleich_angemeldet")
      .contains("vereine", [vId])
      .order("name", { ascending: true });

    const loadedRoles = data ?? [];
    setRoles(loadedRoles);
    return loadedRoles;
  }

  /** Alle aktuell aktiven Mitglieder-IDs des Vereins, für die einmalige Auto-Anmeldung bei "automatisch angemeldet"-Rollen (PROJ-10). */
  async function fetchActiveMemberIds(vId: number): Promise<number[]> {
    const { data } = await supabase.from("users").select("id").contains("verein", [vId]).eq("aktiv", true);
    return (data ?? []).map((u) => u.id);
  }

  async function loadActivityAndZeitbereiche(rolesOverride?: ZeitbereichRole[]) {
    const currentRoles = rolesOverride ?? roles;
    setListLoading(true);
    setListError(null);
    setNotFound(false);

    const { data: activity, error: activityError } = await supabase
      .from("activities")
      .select("id, adalo_id, name")
      .eq("id", activityId)
      .maybeSingle();

    if (activityError) {
      setListError("Activity konnte nicht geladen werden.");
      setListLoading(false);
      return;
    }

    if (!activity) {
      setNotFound(true);
      setListLoading(false);
      return;
    }

    setActivityName(activity.name ?? "");

    const activityFilters = [`activity.cs.{${activity.id}}`];
    if (activity.adalo_id != null) {
      activityFilters.push(`activity.cs.{${activity.adalo_id}}`);
    }

    const { data, error } = await supabase
      .from("einstellungen")
      .select("id, zeitbereich, ben, rollen, von, bis, eingeteilte_users")
      .or(activityFilters.join(","))
      .order("id", { ascending: true });

    if (error) {
      setListError("Zeitbereiche konnten nicht geladen werden.");
      setListLoading(false);
      return;
    }

    setRows(
      (data ?? []).map((z) => ({
        key: String(z.id),
        id: z.id,
        label: z.zeitbereich ?? "",
        benoetigt: z.ben ?? 0,
        roleId: findRole(currentRoles, z.rollen)?.id != null ? String(findRole(currentRoles, z.rollen)!.id) : "",
        von: normalizeTimeValue(z.von),
        bis: normalizeTimeValue(z.bis),
        eingeteilteCount: z.eingeteilte_users?.length ?? 0,
        saving: false,
        error: null,
      }))
    );
    setListLoading(false);
  }

  function updateRow(key: string, patch: Partial<ZeitbereichRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch, error: null } : r)));
  }

  function handleAddRow() {
    setRows((prev) => [
      ...prev,
      {
        key: `new-${Date.now()}`,
        id: null,
        label: "",
        benoetigt: 0,
        roleId: "",
        von: "",
        bis: "",
        eingeteilteCount: 0,
        saving: false,
        error: null,
      },
    ]);
  }

  async function handleSaveRow(row: ZeitbereichRow) {
    const trimmedLabel = row.label.trim();
    if (!trimmedLabel) {
      updateRow(row.key, { error: "Zeitbereich-Label ist erforderlich" });
      return;
    }
    if (!row.von || !row.bis) {
      updateRow(row.key, { error: "Von und bis sind erforderlich" });
      return;
    }
    if (row.benoetigt < 0) {
      updateRow(row.key, { error: "Benötigt darf nicht negativ sein" });
      return;
    }
    if (row.benoetigt > 0 && !row.roleId) {
      updateRow(row.key, { error: "Rolle ist erforderlich, sobald benötigt > 0 ist" });
      return;
    }

    updateRow(row.key, { saving: true, error: null });

    const payload: {
      zeitbereich: string;
      ben: number;
      rollen: number[] | null;
      von: string;
      bis: string;
      eingeteilte_users?: number[];
    } = {
      zeitbereich: trimmedLabel,
      ben: row.benoetigt,
      rollen: row.roleId ? [Number(row.roleId)] : null,
      von: row.von,
      bis: row.bis,
    };

    // Einmalige Auto-Anmeldung (PROJ-10): eine Rolle mit "automatisch angemeldet" trägt beim
    // ersten Speichern mit noch leerer Zusagenliste alle aktuell aktiven Mitglieder ein. Bereits
    // befüllte Zeitbereiche werden nicht erneut überschrieben (abgemeldete Mitglieder bleiben ab).
    const selectedRole = row.roleId ? roles.find((r) => String(r.id) === row.roleId) : undefined;
    if (selectedRole?.gleich_angemeldet && row.eingeteilteCount === 0 && vereinId) {
      const memberIds = await fetchActiveMemberIds(vereinId);
      if (memberIds.length > 0) {
        payload.eingeteilte_users = memberIds;
      }
    }

    try {
      if (row.id == null) {
        const { error } = await supabase.from("einstellungen").insert({ ...payload, activity: [activityId] });

        if (error) {
          updateRow(row.key, { saving: false, error: "Speichern fehlgeschlagen. Bitte versuche es erneut." });
          return;
        }
      } else {
        const { error } = await supabase.from("einstellungen").update(payload).eq("id", row.id);

        if (error) {
          updateRow(row.key, { saving: false, error: "Speichern fehlgeschlagen. Bitte versuche es erneut." });
          return;
        }
      }

      await loadActivityAndZeitbereiche();
    } catch {
      updateRow(row.key, { saving: false, error: "Server nicht erreichbar. Bitte versuche es später erneut." });
    }
  }

  function handleDeleteClick(row: ZeitbereichRow) {
    if (row.id == null) {
      setRows((prev) => prev.filter((r) => r.key !== row.key));
      return;
    }
    setDeleteTarget({ id: row.id, label: row.label, eingeteilteCount: row.eingeteilteCount });
    setDeleteError(null);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteSaving(true);
    setDeleteError(null);

    const { error } = await supabase.from("einstellungen").delete().eq("id", deleteTarget.id);

    if (error) {
      setDeleteError("Löschen fehlgeschlagen. Bitte versuche es erneut.");
      setDeleteSaving(false);
      return;
    }

    setDeleteTarget(null);
    setDeleteSaving(false);
    await loadActivityAndZeitbereiche();
  }

  async function confirmBulkDelete() {
    setBulkDeleteSaving(true);

    const idsToDelete = rows.filter((r) => r.id != null && r.benoetigt === 0).map((r) => r.id as number);

    if (idsToDelete.length > 0) {
      await supabase.from("einstellungen").delete().in("id", idsToDelete);
    }

    setBulkDeleteOpen(false);
    setBulkDeleteSaving(false);
    await loadActivityAndZeitbereiche();
  }

  if (checking || (!notFound && listLoading)) {
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

  const zeroCount = rows.filter((r) => r.id != null && r.benoetigt === 0).length;

  return (
    <main className="flex min-h-screen justify-center bg-background">
      <div className="flex w-full max-w-[600px] flex-col pb-16">
        <div className="relative bg-brand-blue px-4 py-3 text-center">
          <Link
            href={`/activities/${activityId}`}
            aria-label="Zurück zur Activity"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="font-heading text-[21px] font-medium text-white">{activityName}</h1>
        </div>

        <div className="flex w-full flex-1 flex-col gap-4 border border-gray-400 bg-gray-100 px-4 py-6">
        {listError && (
          <Alert variant="destructive">
            <AlertDescription>{listError}</AlertDescription>
          </Alert>
        )}

        <Button
          type="button"
          onClick={() => setBulkDeleteOpen(true)}
          disabled={zeroCount === 0}
          className="w-full bg-brand-gold font-semibold uppercase tracking-wide text-black hover:bg-brand-gold/90 disabled:opacity-50"
        >
          Alle mit &quot;0 benötigt&quot; löschen
        </Button>

        {rows.length > 0 && (
          <div className="grid grid-cols-[1fr_4rem_1fr] gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Zeitbereich</span>
            <span>benötigt</span>
            <span>Rolle</span>
          </div>
        )}

        {rows.length === 0 && (
          <p className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
            Noch keine Zeitbereiche vorhanden. Über den Button unten kannst du einen neuen Zeitbereich anlegen.
          </p>
        )}

        <ul className="flex flex-col gap-3">
          {rows.map((row) => (
            <li key={row.key} className="flex flex-col gap-2 rounded-lg border bg-white p-3 shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleSaveRow(row)}
                  disabled={row.saving}
                  aria-label="Änderungen speichern"
                  className="flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-brand-blue px-3 text-sm font-semibold uppercase tracking-wide text-white hover:bg-brand-blue/90 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  Änderungen speichern
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteClick(row)}
                  aria-label="Zeitbereich löschen"
                  className="shrink-0 text-brand-gold hover:opacity-80"
                >
                  <Trash2 className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-[1fr_4rem_1fr] gap-2">
                <Input
                  type="text"
                  value={row.label}
                  onChange={(e) => updateRow(row.key, { label: e.target.value })}
                  maxLength={LABEL_MAX_LENGTH}
                  placeholder="18-24"
                  className="min-w-0"
                />
                <Input
                  type="number"
                  min={0}
                  value={row.benoetigt}
                  onChange={(e) => updateRow(row.key, { benoetigt: Number(e.target.value) })}
                  className="min-w-0"
                />
                <Select value={row.roleId} onValueChange={(value) => updateRow(row.key, { roleId: value })}>
                  <SelectTrigger className="min-w-0">
                    <SelectValue placeholder="Rolle wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {r.name ?? `Rolle #${r.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                von
                <Input
                  type="time"
                  value={row.von}
                  onChange={(e) => updateRow(row.key, { von: e.target.value })}
                  className="w-28"
                />
                bis
                <Input
                  type="time"
                  value={row.bis}
                  onChange={(e) => updateRow(row.key, { bis: e.target.value })}
                  className="w-28"
                />
                Uhr
              </div>

              {row.eingeteilteCount > 0 && (
                <p className="text-sm text-muted-foreground">{row.eingeteilteCount} zugesagt</p>
              )}

              {row.error && <p className="text-sm text-destructive">{row.error}</p>}
            </li>
          ))}
        </ul>

        <Button asChild variant="outline" className="h-12 w-full shadow-[0_2px_4px_rgba(0,0,0,0.3)] font-semibold uppercase tracking-wide">
          <Link href={`/activities/${activityId}`}>Zurück zur Activity</Link>
        </Button>
        </div>
      </div>

      <button
        type="button"
        onClick={handleAddRow}
        aria-label="Neuer Zeitbereich"
        className="fixed bottom-24 left-1/2 z-40 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-brand-gold text-black shadow-lg hover:bg-brand-gold/90"
      >
        <Plus className="h-7 w-7" />
      </button>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {(deleteTarget?.eingeteilteCount ?? 0) > 0 ? "Zeitbereich hat bereits Zusagen" : "Zeitbereich löschen?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteError
                ? deleteError
                : (deleteTarget?.eingeteilteCount ?? 0) > 0
                  ? `„${deleteTarget?.label}" hat bereits ${deleteTarget?.eingeteilteCount} zugesagte Mitglieder. Beim Löschen gehen diese Zuordnungen unwiderruflich verloren.`
                  : `„${deleteTarget?.label}" wird unwiderruflich gelöscht.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction disabled={deleteSaving} onClick={() => void confirmDelete()}>
              {deleteSaving ? "Wird gelöscht..." : (deleteTarget?.eingeteilteCount ?? 0) > 0 ? "Trotzdem löschen" : "Löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alle mit &quot;0 benötigt&quot; löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              {zeroCount} Zeitbereich(e) mit benötigt = 0 werden unwiderruflich gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction disabled={bulkDeleteSaving} onClick={() => void confirmBulkDelete()}>
              {bulkDeleteSaving ? "Wird gelöscht..." : "Löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
