"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
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

const NAME_MAX_LENGTH = 50;

type RolleRow = {
  key: string;
  id: number | null; // null = neu, noch nicht gespeichert
  name: string;
  gleichAngemeldet: boolean;
  adaloId: number | null;
  saving: boolean;
  error: string | null;
};

type DeleteTarget = { id: number; name: string; adaloId: number | null };

export default function RollenPage() {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [vereinId, setVereinId] = useState<number | null>(null);

  const [rows, setRows] = useState<RolleRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleteBlocked, setDeleteBlocked] = useState(false);
  const [deleteChecking, setDeleteChecking] = useState(false);
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
    if (!vereinId) return;
    void loadRollen(vereinId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vereinId]);

  async function loadRollen(vId: number) {
    setListLoading(true);
    setListError(null);

    const { data, error } = await supabase
      .from("rollen")
      .select("id, name, gleich_angemeldet, adalo_id")
      .contains("vereine", [vId])
      .order("name", { ascending: true });

    if (error) {
      setListError("Rollen konnten nicht geladen werden.");
      setListLoading(false);
      return;
    }

    setRows(
      (data ?? []).map((r) => ({
        key: String(r.id),
        id: r.id,
        name: r.name,
        gleichAngemeldet: !!r.gleich_angemeldet,
        adaloId: r.adalo_id,
        saving: false,
        error: null,
      }))
    );
    setListLoading(false);
  }

  function updateRow(key: string, patch: Partial<RolleRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch, error: null } : r)));
  }

  function handleAddRow() {
    setRows((prev) => {
      if (prev.some((r) => r.id === null)) return prev;
      return [
        { key: `new-${Date.now()}`, id: null, name: "", gleichAngemeldet: false, adaloId: null, saving: false, error: null },
        ...prev,
      ];
    });
  }

  async function handleSaveRow(row: RolleRow) {
    if (!vereinId) return;

    const trimmedName = row.name.trim();
    if (!trimmedName) {
      updateRow(row.key, { error: "Name ist erforderlich" });
      return;
    }

    const duplicate = rows.some(
      (r) => r.key !== row.key && r.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) {
      updateRow(row.key, { error: "Diese Rolle existiert bereits." });
      return;
    }

    updateRow(row.key, { saving: true, error: null });

    try {
      if (row.id == null) {
        const { error } = await supabase
          .from("rollen")
          .insert({ name: trimmedName, gleich_angemeldet: row.gleichAngemeldet, vereine: [vereinId] });

        if (error) {
          updateRow(row.key, { saving: false, error: "Speichern fehlgeschlagen. Bitte versuche es erneut." });
          return;
        }
      } else {
        const { error } = await supabase
          .from("rollen")
          .update({ name: trimmedName, gleich_angemeldet: row.gleichAngemeldet })
          .eq("id", row.id);

        if (error) {
          updateRow(row.key, { saving: false, error: "Speichern fehlgeschlagen. Bitte versuche es erneut." });
          return;
        }
      }

      await loadRollen(vereinId);
    } catch {
      updateRow(row.key, { saving: false, error: "Server nicht erreichbar. Bitte versuche es später erneut." });
    }
  }

  async function handleDeleteClick(row: RolleRow) {
    if (row.id == null) {
      setRows((prev) => prev.filter((r) => r.key !== row.key));
      return;
    }
    await openDeleteDialog({ id: row.id, name: row.name, adaloId: row.adaloId });
  }

  async function openDeleteDialog(target: DeleteTarget) {
    setDeleteTarget(target);
    setDeleteError(null);
    setDeleteChecking(true);
    setDeleteBlocked(false);

    // Legacy einstellungen-Zeilen referenzieren Rollen über deren Adalo-`adalo_id`,
    // neu angelegte Zeitbereiche (PROJ-9) werden dagegen die Supabase-`id`
    // verwenden, da neue Rollen keine `adalo_id` mehr haben. Beide Räume
    // müssen daher geprüft werden (siehe PROJ-5-Erkenntnis, hier vorab übernommen).
    const usageFilters = [`rollen.cs.{${target.id}}`];
    if (target.adaloId != null) {
      usageFilters.push(`rollen.cs.{${target.adaloId}}`);
    }

    const { count, error } = await supabase
      .from("einstellungen")
      .select("id", { count: "exact", head: true })
      .or(usageFilters.join(","));

    if (error) {
      setDeleteError("Verwendung konnte nicht geprüft werden. Bitte versuche es erneut.");
      setDeleteChecking(false);
      return;
    }

    setDeleteBlocked(!!count && count > 0);
    setDeleteChecking(false);
  }

  async function confirmDelete() {
    if (!deleteTarget || !vereinId) return;

    const { error } = await supabase.from("rollen").delete().eq("id", deleteTarget.id);

    if (error) {
      setDeleteError("Löschen fehlgeschlagen. Bitte versuche es erneut.");
      return;
    }

    setDeleteTarget(null);
    await loadRollen(vereinId);
  }

  if (checking) {
    return <main className="min-h-screen bg-background" />;
  }

  if (!allowed) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background pb-28">
      <header className="grid grid-cols-[2rem_1fr_2rem] items-center gap-3 bg-brand-blue px-4 py-4 text-white">
        <Link href="/" aria-label="Zurück">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-center font-heading text-lg font-bold">Rolle ändern/löschen</h1>
        <span />
      </header>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-6">
        {listError && (
          <Alert variant="destructive">
            <AlertDescription>{listError}</AlertDescription>
          </Alert>
        )}

        {!listLoading && !listError && rows.length === 0 && (
          <p className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
            Noch keine Rollen vorhanden. Über den Button unten kannst du eine neue Rolle anlegen.
          </p>
        )}

        {!listLoading && rows.length > 0 && (
          <ul className="flex flex-col gap-3">
            {rows.map((row) => (
              <li key={row.key} className="rounded-lg border bg-white p-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void handleSaveRow(row)}
                    disabled={row.saving}
                    aria-label="Speichern"
                    className="flex h-10 w-14 shrink-0 items-center justify-center rounded-md bg-brand-blue text-white hover:bg-brand-blue/90 disabled:opacity-50"
                  >
                    <Check className="h-5 w-5" />
                  </button>
                  <Input
                    value={row.name}
                    onChange={(e) => updateRow(row.key, { name: e.target.value })}
                    maxLength={NAME_MAX_LENGTH}
                    placeholder="Name eingeben..."
                    className="min-w-0 flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => void handleDeleteClick(row)}
                    aria-label="Löschen"
                    className="shrink-0 text-brand-gold hover:opacity-80"
                  >
                    <Trash2 className="h-6 w-6" />
                  </button>
                </div>
                <label className="mt-2 flex items-center gap-2 pl-1 text-sm text-muted-foreground">
                  <Checkbox
                    checked={row.gleichAngemeldet}
                    onCheckedChange={(checked) => updateRow(row.key, { gleichAngemeldet: !!checked })}
                  />
                  Automatisch angemeldet
                </label>
                {row.error && <p className="mt-1 pl-1 text-sm text-destructive">{row.error}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={handleAddRow}
        aria-label="Neue Rolle"
        className="fixed bottom-8 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-brand-gold text-black shadow-lg hover:bg-brand-gold/90"
      >
        <Plus className="h-7 w-7" />
      </button>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteBlocked ? "Rolle wird noch verwendet" : "Rolle löschen?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteChecking && "Verwendung wird geprüft..."}
              {!deleteChecking && deleteError && deleteError}
              {!deleteChecking &&
                !deleteError &&
                (deleteBlocked
                  ? `„${deleteTarget?.name}" ist noch mindestens einem Zeitbereich zugeordnet und kann deshalb nicht gelöscht werden.`
                  : `„${deleteTarget?.name}" wird unwiderruflich gelöscht.`)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{deleteBlocked ? "Schließen" : "Abbrechen"}</AlertDialogCancel>
            {!deleteBlocked && !deleteChecking && !deleteError && (
              <AlertDialogAction onClick={() => void confirmDelete()}>Löschen</AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
