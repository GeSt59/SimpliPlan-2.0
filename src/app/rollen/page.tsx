"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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

type Rolle = {
  id: number;
  name: string;
  gleich_angemeldet: boolean | null;
  adalo_id: number | null;
};

const rolleSchema = z.object({
  name: z
    .string()
    .min(1, "Name ist erforderlich")
    .max(NAME_MAX_LENGTH, `Maximal ${NAME_MAX_LENGTH} Zeichen`),
  gleichAngemeldet: z.boolean(),
});

type RolleValues = z.infer<typeof rolleSchema>;

export default function RollenPage() {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [vereinId, setVereinId] = useState<number | null>(null);

  const [rollen, setRollen] = useState<Rolle[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Rolle | null>(null);
  const [deleteBlocked, setDeleteBlocked] = useState(false);
  const [deleteChecking, setDeleteChecking] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const form = useForm<RolleValues>({
    resolver: zodResolver(rolleSchema),
    defaultValues: { name: "", gleichAngemeldet: false },
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

    setRollen(data ?? []);
    setListLoading(false);
  }

  function openCreateDialog() {
    setEditingId(null);
    setFormError(null);
    form.reset({ name: "", gleichAngemeldet: false });
    setDialogOpen(true);
  }

  function openEditDialog(rolle: Rolle) {
    setEditingId(rolle.id);
    setFormError(null);
    form.reset({ name: rolle.name, gleichAngemeldet: !!rolle.gleich_angemeldet });
    setDialogOpen(true);
  }

  async function onSubmit(values: RolleValues) {
    if (!vereinId) return;
    setSaving(true);
    setFormError(null);

    const trimmedName = values.name.trim();
    const duplicate = rollen.some(
      (r) => r.id !== editingId && r.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );

    if (duplicate) {
      setFormError("Diese Rolle existiert bereits.");
      setSaving(false);
      return;
    }

    try {
      if (editingId) {
        const { error: updateError } = await supabase
          .from("rollen")
          .update({ name: trimmedName, gleich_angemeldet: values.gleichAngemeldet })
          .eq("id", editingId);

        if (updateError) {
          setFormError("Speichern fehlgeschlagen. Bitte versuche es erneut.");
          setSaving(false);
          return;
        }
      } else {
        const { error: insertError } = await supabase
          .from("rollen")
          .insert({ name: trimmedName, gleich_angemeldet: values.gleichAngemeldet, vereine: [vereinId] });

        if (insertError) {
          setFormError("Speichern fehlgeschlagen. Bitte versuche es erneut.");
          setSaving(false);
          return;
        }
      }

      setDialogOpen(false);
      await loadRollen(vereinId);
    } catch {
      setFormError("Server nicht erreichbar. Bitte versuche es später erneut.");
    } finally {
      setSaving(false);
    }
  }

  async function openDeleteDialog(rolle: Rolle) {
    setDeleteTarget(rolle);
    setDeleteError(null);
    setDeleteChecking(true);
    setDeleteBlocked(false);

    // Legacy einstellungen-Zeilen referenzieren Rollen über deren Adalo-`adalo_id`,
    // neu angelegte Zeitbereiche (PROJ-9) werden dagegen die Supabase-`id`
    // verwenden, da neue Rollen keine `adalo_id` mehr haben. Beide Räume
    // müssen daher geprüft werden (siehe PROJ-5-Erkenntnis, hier vorab übernommen).
    const usageFilters = [`rollen.cs.{${rolle.id}}`];
    if (rolle.adalo_id != null) {
      usageFilters.push(`rollen.cs.{${rolle.adalo_id}}`);
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
    <main className="flex min-h-screen justify-center bg-background px-4 py-10">
      <div className="flex w-full max-w-lg flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold text-brand-blue">Rollen</h1>
          <Button
            onClick={openCreateDialog}
            className="bg-brand-blue font-semibold uppercase tracking-wide text-white hover:bg-brand-blue/90"
          >
            Neue Rolle
          </Button>
        </div>

        {listError && (
          <Alert variant="destructive">
            <AlertDescription>{listError}</AlertDescription>
          </Alert>
        )}

        {!listLoading && !listError && rollen.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-10 text-center">
            <p className="text-sm text-muted-foreground">Noch keine Rollen vorhanden.</p>
            <Button
              onClick={openCreateDialog}
              variant="outline"
              className="font-semibold uppercase tracking-wide"
            >
              Neue Rolle anlegen
            </Button>
          </div>
        )}

        {!listLoading && rollen.length > 0 && (
          <ul className="flex flex-col gap-3">
            {rollen.map((rolle) => (
              <li
                key={rolle.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="min-w-0 truncate text-sm font-medium text-foreground">{rolle.name}</span>
                  {rolle.gleich_angemeldet && (
                    <Badge variant="secondary" className="shrink-0">
                      Automatisch angemeldet
                    </Badge>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(rolle)}>
                    Bearbeiten
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => void openDeleteDialog(rolle)}
                  >
                    Löschen
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <Button asChild variant="outline" className="h-12 w-full font-semibold uppercase tracking-wide">
          <Link href="/">Zurück</Link>
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Rolle bearbeiten" : "Rolle anlegen"}</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
              {formError && (
                <Alert variant="destructive">
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Name eingeben..." maxLength={NAME_MAX_LENGTH} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gleichAngemeldet"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} id="gleichAngemeldet" />
                    </FormControl>
                    <FormLabel htmlFor="gleichAngemeldet" className="font-normal">
                      Automatisch angemeldet
                    </FormLabel>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-brand-blue font-semibold uppercase tracking-wide text-white hover:bg-brand-blue/90"
                >
                  {saving ? "Wird gespeichert..." : "Speichern"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

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
    </main>
  );
}
