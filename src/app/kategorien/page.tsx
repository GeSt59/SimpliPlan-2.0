"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const PICTURE_BUCKET = "adalo-media";
const MAX_PICTURE_BYTES = 2 * 1024 * 1024;
const ALLOWED_PICTURE_TYPES = ["image/png", "image/jpeg", "image/svg+xml"];
const NAME_MAX_LENGTH = 50;

type Kategorie = {
  id: number;
  name: string;
  picture_url: string | null;
  adalo_id: number | null;
};

const kategorieSchema = z.object({
  name: z
    .string()
    .min(1, "Name ist erforderlich")
    .max(NAME_MAX_LENGTH, `Maximal ${NAME_MAX_LENGTH} Zeichen`),
});

type KategorieValues = z.infer<typeof kategorieSchema>;

export default function KategorienPage() {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [vereinId, setVereinId] = useState<number | null>(null);

  const [kategorien, setKategorien] = useState<Kategorie[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [pictureUrl, setPictureUrl] = useState<string | null>(null);
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [picturePreview, setPicturePreview] = useState<string | null>(null);
  const [pictureError, setPictureError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Kategorie | null>(null);
  const [deleteBlocked, setDeleteBlocked] = useState(false);
  const [deleteChecking, setDeleteChecking] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const form = useForm<KategorieValues>({
    resolver: zodResolver(kategorieSchema),
    defaultValues: { name: "" },
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
    void loadKategorien(vereinId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vereinId]);

  async function loadKategorien(vId: number) {
    setListLoading(true);
    setListError(null);

    const { data, error } = await supabase
      .from("categories")
      .select("id, name, picture_url, adalo_id")
      .contains("vereine", [vId])
      .order("name", { ascending: true });

    if (error) {
      setListError("Kategorien konnten nicht geladen werden.");
      setListLoading(false);
      return;
    }

    setKategorien(data ?? []);
    setListLoading(false);
  }

  function openCreateDialog() {
    setEditingId(null);
    setFormError(null);
    setPictureUrl(null);
    setPictureFile(null);
    setPicturePreview(null);
    setPictureError(null);
    form.reset({ name: "" });
    setDialogOpen(true);
  }

  function openEditDialog(kategorie: Kategorie) {
    setEditingId(kategorie.id);
    setFormError(null);
    setPictureUrl(kategorie.picture_url);
    setPictureFile(null);
    setPicturePreview(null);
    setPictureError(null);
    form.reset({ name: kategorie.name });
    setDialogOpen(true);
  }

  function handlePictureChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ALLOWED_PICTURE_TYPES.includes(file.type)) {
      setPictureError("Nur PNG-, JPG- oder SVG-Dateien sind erlaubt.");
      return;
    }
    if (file.size > MAX_PICTURE_BYTES) {
      setPictureError("Die Datei darf maximal 2 MB groß sein.");
      return;
    }

    setPictureError(null);
    setPictureFile(file);
    setPicturePreview(URL.createObjectURL(file));
  }

  async function onSubmit(values: KategorieValues) {
    if (!vereinId) return;
    setSaving(true);
    setFormError(null);

    const trimmedName = values.name.trim();
    const duplicate = kategorien.some(
      (k) => k.id !== editingId && k.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );

    if (duplicate) {
      setFormError("Diese Kategorie existiert bereits.");
      setSaving(false);
      return;
    }

    try {
      let newPictureUrl = pictureUrl;

      if (pictureFile) {
        const path = `kategorien/${vereinId}-${Date.now()}-${pictureFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from(PICTURE_BUCKET)
          .upload(path, pictureFile, { upsert: true, contentType: pictureFile.type });

        if (uploadError) {
          setFormError("Bild-Upload fehlgeschlagen. Bitte versuche es erneut.");
          setSaving(false);
          return;
        }

        const { data: publicUrlData } = supabase.storage.from(PICTURE_BUCKET).getPublicUrl(path);
        newPictureUrl = publicUrlData.publicUrl;
      }

      if (editingId) {
        const { error: updateError } = await supabase
          .from("categories")
          .update({ name: trimmedName, picture_url: newPictureUrl })
          .eq("id", editingId);

        if (updateError) {
          setFormError("Speichern fehlgeschlagen. Bitte versuche es erneut.");
          setSaving(false);
          return;
        }
      } else {
        const { error: insertError } = await supabase
          .from("categories")
          .insert({ name: trimmedName, picture_url: newPictureUrl, vereine: [vereinId] });

        if (insertError) {
          setFormError("Speichern fehlgeschlagen. Bitte versuche es erneut.");
          setSaving(false);
          return;
        }
      }

      setDialogOpen(false);
      await loadKategorien(vereinId);
    } catch {
      setFormError("Server nicht erreichbar. Bitte versuche es später erneut.");
    } finally {
      setSaving(false);
    }
  }

  async function openDeleteDialog(kategorie: Kategorie) {
    setDeleteTarget(kategorie);
    setDeleteError(null);
    setDeleteChecking(true);
    setDeleteBlocked(false);

    // Migrierte Activities referenzieren Kategorien über deren Adalo-`adalo_id`
    // (1:1 aus Adalo kopiertes Relations-Array), neu angelegte Activities (PROJ-8)
    // werden dagegen die Supabase-`id` verwenden, da neue Kategorien keine
    // `adalo_id` mehr haben. Beide Räume müssen daher geprüft werden.
    const usageFilters = [`category.cs.{${kategorie.id}}`];
    if (kategorie.adalo_id != null) {
      usageFilters.push(`category.cs.{${kategorie.adalo_id}}`);
    }

    const { count, error } = await supabase
      .from("activities")
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

    const { error } = await supabase.from("categories").delete().eq("id", deleteTarget.id);

    if (error) {
      setDeleteError("Löschen fehlgeschlagen. Bitte versuche es erneut.");
      return;
    }

    setDeleteTarget(null);
    await loadKategorien(vereinId);
  }

  if (checking) {
    return <main className="min-h-screen bg-background" />;
  }

  if (!allowed) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background pb-40">
      <header className="grid grid-cols-[2rem_1fr_2rem] items-center gap-3 bg-brand-blue px-4 py-4 text-white">
        <Link href="/" aria-label="Zurück">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-center font-heading text-lg font-bold">Kategorien ändern</h1>
        <span />
      </header>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-6">
        {listError && (
          <Alert variant="destructive">
            <AlertDescription>{listError}</AlertDescription>
          </Alert>
        )}

        {!listLoading && !listError && kategorien.length === 0 && (
          <p className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
            Noch keine Kategorien vorhanden. Über den Button unten kannst du eine neue Kategorie anlegen.
          </p>
        )}

        {!listLoading && kategorien.length > 0 && (
          <ul className="flex flex-col gap-3">
            {kategorien.map((kategorie) => (
              <li
                key={kategorie.id}
                className="flex items-center gap-3 rounded-lg border bg-white p-3 shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => openEditDialog(kategorie)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  {kategorie.picture_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={kategorie.picture_url}
                      alt={kategorie.name}
                      className="h-10 w-10 shrink-0 rounded-md border object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 shrink-0 rounded-md border bg-muted" />
                  )}
                  <span className="min-w-0 truncate text-sm font-medium text-foreground">{kategorie.name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => void openDeleteDialog(kategorie)}
                  aria-label="Löschen"
                  className="shrink-0 text-brand-gold hover:opacity-80"
                >
                  <Trash2 className="h-6 w-6" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={openCreateDialog}
        aria-label="Neue Kategorie"
        className="fixed bottom-24 left-1/2 z-40 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-brand-gold text-black shadow-lg hover:bg-brand-gold/90"
      >
        <Plus className="h-7 w-7" />
      </button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Kategorie bearbeiten" : "Kategorie anlegen"}</DialogTitle>
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

              <div className="flex flex-col gap-2">
                <Label htmlFor="picture">Bild (optional)</Label>
                {(picturePreview || pictureUrl) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={picturePreview ?? pictureUrl ?? undefined}
                    alt="Kategorie-Bild"
                    className="h-20 w-20 rounded-lg border object-cover"
                  />
                )}
                <Input
                  id="picture"
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={handlePictureChange}
                />
                {pictureError && <p className="text-sm text-destructive">{pictureError}</p>}
              </div>

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
            <AlertDialogTitle>
              {deleteBlocked ? "Kategorie wird noch verwendet" : "Kategorie löschen?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteChecking && "Verwendung wird geprüft..."}
              {!deleteChecking && deleteError && deleteError}
              {!deleteChecking &&
                !deleteError &&
                (deleteBlocked
                  ? `„${deleteTarget?.name}" ist noch mindestens einer Activity zugeordnet und kann deshalb nicht gelöscht werden.`
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
