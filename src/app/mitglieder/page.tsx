"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LayoutGrid, List, Plus, Trash2, UserRound } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
const VIEW_STORAGE_KEY = "mitglieder-view";

type Mitglied = {
  id: number;
  adalo_id: number | null;
  auth_user_id: string | null;
  vorname: string | null;
  nachname: string | null;
  email: string | null;
  mitgliedsnumer: string | null;
  geburtstag: string | null;
  vorher_titel: string | null;
  titel_nachher: string | null;
  aktiv: boolean | null;
  admin: boolean | null;
  profile_picture_url: string | null;
};

type View = "karten" | "liste";

type Verein = { id: number; vereinsname: string | null };

type StatusFilter = "alle" | "aktiv" | "inaktiv";

const editSchema = z.object({
  vorname: z.string().min(1, "Vorname ist erforderlich"),
  nachname: z.string().min(1, "Nachname ist erforderlich"),
  email: z.string().min(1, "E-Mail ist erforderlich").email("Ungültige E-Mail-Adresse"),
  mitgliedsnumer: z.string(),
  geburtstag: z.string(),
  vorherTitel: z.string(),
  titelNachher: z.string(),
  aktiv: z.boolean(),
  admin: z.boolean(),
});
type EditValues = z.infer<typeof editSchema>;

const createSchema = z.object({
  vorname: z.string().min(1, "Vorname ist erforderlich"),
  nachname: z.string().min(1, "Nachname ist erforderlich"),
  email: z.string().min(1, "E-Mail ist erforderlich").email("Ungültige E-Mail-Adresse"),
  password: z.string().min(6, "Mindestens 6 Zeichen"),
});
type CreateValues = z.infer<typeof createSchema>;

export default function MitgliederPage() {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [isSu, setIsSu] = useState(false);
  const [ownAuthUserId, setOwnAuthUserId] = useState<string | null>(null);

  const [vereine, setVereine] = useState<Verein[]>([]);
  const [vereineError, setVereineError] = useState<string | null>(null);
  const [vereinId, setVereinId] = useState<number | null>(null);

  const [mitglieder, setMitglieder] = useState<Mitglied[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("alle");

  const [createOpen, setCreateOpen] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editTarget, setEditTarget] = useState<Mitglied | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [pictureUrl, setPictureUrl] = useState<string | null>(null);
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [picturePreview, setPicturePreview] = useState<string | null>(null);
  const [pictureError, setPictureError] = useState<string | null>(null);

  const [view, setView] = useState<View>("karten");

  const [deleteTarget, setDeleteTarget] = useState<Mitglied | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { vorname: "", nachname: "", email: "", password: "" },
  });

  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      vorname: "",
      nachname: "",
      email: "",
      mitgliedsnumer: "",
      geburtstag: "",
      vorherTitel: "",
      titelNachher: "",
      aktiv: true,
      admin: false,
    },
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
        .select("admin, verein, su, auth_user_id")
        .eq("auth_user_id", session.user.id)
        .maybeSingle();

      if (!active) return;

      const su = !!userRow?.su;
      const admin = !!userRow?.admin;

      if (!admin && !su) {
        window.location.href = "/";
        return;
      }

      setOwnAuthUserId(session.user.id);
      setIsSu(su);
      setAllowed(true);
      setChecking(false);

      if (su) {
        const { data: vereineData, error: vereineErr } = await supabase
          .from("vereine")
          .select("id, vereinsname")
          .order("vereinsname", { ascending: true });

        if (!active) return;

        if (vereineErr) {
          setVereineError("Vereine konnten nicht geladen werden.");
        } else {
          setVereine(vereineData ?? []);
        }
      } else {
        setVereinId(userRow?.verein?.[0] ?? null);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!vereinId) return;
    void loadMitglieder(vereinId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vereinId]);

  useEffect(() => {
    const stored = window.localStorage.getItem(VIEW_STORAGE_KEY);
    if (stored === "karten" || stored === "liste") {
      setView(stored);
    }
  }, []);

  function toggleView() {
    setView((prev) => {
      const next: View = prev === "karten" ? "liste" : "karten";
      window.localStorage.setItem(VIEW_STORAGE_KEY, next);
      return next;
    });
  }

  async function loadMitglieder(vId: number) {
    setListLoading(true);
    setListError(null);

    const { data, error } = await supabase
      .from("users")
      .select(
        "id, adalo_id, auth_user_id, vorname, nachname, email, mitgliedsnumer, geburtstag, vorher_titel, titel_nachher, aktiv, admin, profile_picture_url"
      )
      .contains("verein", [vId])
      .order("nachname", { ascending: true });

    if (error) {
      setListError("Mitglieder konnten nicht geladen werden.");
      setListLoading(false);
      return;
    }

    setMitglieder(data ?? []);
    setListLoading(false);
  }

  const filteredMitglieder = mitglieder.filter((m) => {
    if (statusFilter === "aktiv" && !m.aktiv) return false;
    if (statusFilter === "inaktiv" && m.aktiv) return false;

    if (search.trim()) {
      const term = search.trim().toLowerCase();
      const haystack = `${m.vorname ?? ""} ${m.nachname ?? ""} ${m.email ?? ""}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }

    return true;
  });

  const hasOtherMitglieder = mitglieder.some((m) => m.auth_user_id !== ownAuthUserId);

  function openCreateDialog() {
    setCreateError(null);
    createForm.reset({ vorname: "", nachname: "", email: "", password: "" });
    setCreateOpen(true);
  }

  async function onCreateSubmit(values: CreateValues) {
    if (!vereinId) return;
    setCreateSaving(true);
    setCreateError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch("/api/mitglieder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...values, vereinId }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        if (body?.error === "email_taken") {
          setCreateError("Diese E-Mail ist bereits registriert.");
        } else {
          setCreateError("Anlegen fehlgeschlagen. Bitte versuche es erneut.");
        }
        setCreateSaving(false);
        return;
      }

      setCreateOpen(false);
      await loadMitglieder(vereinId);
    } catch {
      setCreateError("Server nicht erreichbar. Bitte versuche es später erneut.");
    } finally {
      setCreateSaving(false);
    }
  }

  function openEditDialog(m: Mitglied) {
    setEditTarget(m);
    setEditError(null);
    setPictureUrl(m.profile_picture_url);
    setPictureFile(null);
    setPicturePreview(null);
    setPictureError(null);
    editForm.reset({
      vorname: m.vorname ?? "",
      nachname: m.nachname ?? "",
      email: m.email ?? "",
      mitgliedsnumer: m.mitgliedsnumer ?? "",
      geburtstag: m.geburtstag ?? "",
      vorherTitel: m.vorher_titel ?? "",
      titelNachher: m.titel_nachher ?? "",
      aktiv: !!m.aktiv,
      admin: !!m.admin,
    });
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

  async function onEditSubmit(values: EditValues) {
    if (!editTarget || !vereinId) return;
    setEditSaving(true);
    setEditError(null);

    try {
      let newPictureUrl = pictureUrl;

      if (pictureFile) {
        const path = `users/${vereinId}-${editTarget.id}-${Date.now()}-${pictureFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from(PICTURE_BUCKET)
          .upload(path, pictureFile, { upsert: true, contentType: pictureFile.type });

        if (uploadError) {
          setEditError("Bild-Upload fehlgeschlagen. Bitte versuche es erneut.");
          setEditSaving(false);
          return;
        }

        const { data: publicUrlData } = supabase.storage.from(PICTURE_BUCKET).getPublicUrl(path);
        newPictureUrl = publicUrlData.publicUrl;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch(`/api/mitglieder/${editTarget.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          vorname: values.vorname.trim(),
          nachname: values.nachname.trim(),
          email: values.email.trim(),
          mitgliedsnumer: values.mitgliedsnumer.trim() || null,
          geburtstag: values.geburtstag.trim() || null,
          vorherTitel: values.vorherTitel.trim() || null,
          titelNachher: values.titelNachher.trim() || null,
          aktiv: values.aktiv,
          admin: values.admin,
          profilePictureUrl: newPictureUrl,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        if (body?.error === "email_taken") {
          setEditError("Diese E-Mail ist bereits registriert.");
        } else if (body?.error === "last_admin") {
          setEditError("Du bist der einzige Admin dieses Vereins. Diese Änderung ist nicht möglich.");
        } else if (body?.error === "forbidden") {
          setEditError("Keine Berechtigung für diese Änderung.");
        } else {
          setEditError("Speichern fehlgeschlagen. Bitte versuche es erneut.");
        }
        setEditSaving(false);
        return;
      }

      setEditTarget(null);
      await loadMitglieder(vereinId);
    } catch {
      setEditError("Server nicht erreichbar. Bitte versuche es später erneut.");
    } finally {
      setEditSaving(false);
    }
  }

  function openDeleteDialog(m: Mitglied) {
    setDeleteTarget(m);
    setDeleteError(null);
  }

  async function confirmDelete() {
    if (!deleteTarget || !vereinId) return;
    setDeleteSaving(true);
    setDeleteError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch(`/api/mitglieder/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        if (body?.error === "in_use") {
          setDeleteError("Dieses Mitglied ist bereits einer Einteilung zugeordnet und kann deshalb nicht gelöscht werden.");
        } else if (body?.error === "self_delete") {
          setDeleteError("Du kannst dich nicht selbst löschen.");
        } else if (body?.error === "forbidden") {
          setDeleteError("Keine Berechtigung für diese Aktion.");
        } else {
          setDeleteError("Löschen fehlgeschlagen. Bitte versuche es erneut.");
        }
        setDeleteSaving(false);
        return;
      }

      setDeleteTarget(null);
      await loadMitglieder(vereinId);
    } catch {
      setDeleteError("Server nicht erreichbar. Bitte versuche es später erneut.");
    } finally {
      setDeleteSaving(false);
    }
  }

  if (checking) {
    return <main className="min-h-screen bg-background" />;
  }

  if (!allowed) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background pb-40">
      <div className="bg-brand-blue px-4 py-6 text-center">
        <h1 className="font-heading text-2xl font-bold text-white">Mitgliederverwaltung</h1>
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6">
        {vereinId && (
          <Button
            onClick={toggleView}
            className="h-12 w-full gap-2 bg-brand-blue font-semibold uppercase tracking-wide text-white hover:bg-brand-blue/90"
          >
            {view === "karten" ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
            {view === "karten" ? "In Listenform" : "In Kartenform"}
          </Button>
        )}

        {isSu && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="verein-switcher">Verein</Label>
            {vereineError && (
              <Alert variant="destructive">
                <AlertDescription>{vereineError}</AlertDescription>
              </Alert>
            )}
            <Select
              value={vereinId ? String(vereinId) : undefined}
              onValueChange={(v) => setVereinId(Number(v))}
            >
              <SelectTrigger id="verein-switcher">
                <SelectValue placeholder="Verein wählen..." />
              </SelectTrigger>
              <SelectContent>
                {vereine.map((v) => (
                  <SelectItem key={v.id} value={String(v.id)}>
                    {v.vereinsname ?? `Verein #${v.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {isSu && !vereinId && (
          <p className="text-sm text-muted-foreground">
            Bitte wähle oben einen Verein aus, um dessen Mitglieder zu verwalten.
          </p>
        )}

        {vereinId && (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                placeholder={
                  mitglieder.length > 0
                    ? `eines von den ${mitglieder.length} Mitgliedern suchen...`
                    : "Suche nach Name oder E-Mail..."
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="sm:flex-1"
              />
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle</SelectItem>
                  <SelectItem value="aktiv">Nur aktiv</SelectItem>
                  <SelectItem value="inaktiv">Nur inaktiv</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {listError && (
              <Alert variant="destructive">
                <AlertDescription>{listError}</AlertDescription>
              </Alert>
            )}

            {!listLoading && !listError && !hasOtherMitglieder && (
              <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-10 text-center">
                <p className="text-sm text-muted-foreground">Noch keine weiteren Mitglieder vorhanden.</p>
                <Button
                  onClick={openCreateDialog}
                  variant="outline"
                  className="font-semibold uppercase tracking-wide"
                >
                  Neues Mitglied anlegen
                </Button>
              </div>
            )}

            {!listLoading && hasOtherMitglieder && filteredMitglieder.length === 0 && (
              <p className="text-sm text-muted-foreground">Keine Mitglieder gefunden.</p>
            )}

            {!listLoading && hasOtherMitglieder && filteredMitglieder.length > 0 && view === "liste" && (
              <ul className="flex flex-col gap-3">
                {filteredMitglieder.map((m) => (
                  <li
                    key={m.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="min-w-0 truncate text-sm font-medium text-foreground">
                          {m.vorname} {m.nachname}
                        </span>
                        {m.auth_user_id === ownAuthUserId && (
                          <Badge variant="secondary" className="shrink-0">
                            Du
                          </Badge>
                        )}
                        {m.admin && (
                          <Badge variant="secondary" className="shrink-0">
                            Admin
                          </Badge>
                        )}
                        {!m.aktiv && (
                          <Badge variant="outline" className="shrink-0 text-muted-foreground">
                            Inaktiv
                          </Badge>
                        )}
                      </div>
                      <span className="truncate text-xs text-muted-foreground">
                        {m.email}
                        {m.mitgliedsnumer ? ` · Mitgliedsnr. ${m.mitgliedsnumer}` : ""}
                      </span>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(m)}>
                        Bearbeiten
                      </Button>
                      {m.auth_user_id !== ownAuthUserId && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => openDeleteDialog(m)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {!listLoading && hasOtherMitglieder && filteredMitglieder.length > 0 && view === "karten" && (
              <div className="grid grid-cols-4 gap-2">
                {filteredMitglieder.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => openEditDialog(m)}
                    className="group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-lg bg-muted"
                  >
                    {m.profile_picture_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.profile_picture_url}
                        alt={`${m.vorname ?? ""} ${m.nachname ?? ""}`}
                        className={`h-full w-full object-cover ${!m.aktiv ? "grayscale" : ""}`}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <UserRound className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}

                    <div className="absolute left-1 top-1 flex flex-wrap gap-0.5">
                      {m.auth_user_id === ownAuthUserId && (
                        <Badge variant="secondary" className="h-4 shrink-0 px-1 text-[9px] leading-none">
                          Du
                        </Badge>
                      )}
                      {m.admin && (
                        <Badge variant="secondary" className="h-4 shrink-0 px-1 text-[9px] leading-none">
                          Admin
                        </Badge>
                      )}
                      {!m.aktiv && (
                        <Badge
                          variant="outline"
                          className="h-4 shrink-0 bg-background/80 px-1 text-[9px] leading-none text-muted-foreground"
                        >
                          Inaktiv
                        </Badge>
                      )}
                    </div>

                    {m.auth_user_id !== ownAuthUserId && (
                      <button
                        type="button"
                        aria-label="Mitglied löschen"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteDialog(m);
                        }}
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-gold text-black shadow"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-1.5 pt-6">
                      <p className="truncate text-[11px] font-semibold leading-tight text-white">
                        {m.nachname} {m.vorname}
                      </p>
                      <p className="truncate text-[9px] leading-tight text-white/80">{m.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <Button asChild variant="outline" className="h-12 w-full font-semibold uppercase tracking-wide">
          <Link href="/">Zurück</Link>
        </Button>
      </div>

      {vereinId && (
        <button
          type="button"
          onClick={openCreateDialog}
          aria-label="Neues Mitglied anlegen"
          className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-gold text-black shadow-lg hover:bg-brand-gold/90"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neues Mitglied anlegen</DialogTitle>
          </DialogHeader>

          <Form {...createForm}>
            <form className="flex flex-col gap-4" onSubmit={createForm.handleSubmit(onCreateSubmit)}>
              {createError && (
                <Alert variant="destructive">
                  <AlertDescription>{createError}</AlertDescription>
                </Alert>
              )}

              <FormField
                control={createForm.control}
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
                control={createForm.control}
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
                control={createForm.control}
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
                control={createForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial-Passwort</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Passwort eingeben..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="submit"
                  disabled={createSaving}
                  className="bg-brand-blue font-semibold uppercase tracking-wide text-white hover:bg-brand-blue/90"
                >
                  {createSaving ? "Wird angelegt..." : "Anlegen"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mitglied bearbeiten</DialogTitle>
          </DialogHeader>

          <Form {...editForm}>
            <form className="flex flex-col gap-4" onSubmit={editForm.handleSubmit(onEditSubmit)}>
              {editError && (
                <Alert variant="destructive">
                  <AlertDescription>{editError}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col items-center gap-2">
                {picturePreview || pictureUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={picturePreview ?? pictureUrl ?? undefined}
                    alt="Profilbild"
                    className="h-24 w-24 rounded-full border object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border bg-muted">
                    <UserRound className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                <Label htmlFor="profilbild" className="cursor-pointer text-sm text-brand-blue underline">
                  Profilbild ändern
                </Label>
                <Input
                  id="profilbild"
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  className="hidden"
                  onChange={handlePictureChange}
                />
                {pictureError && <p className="text-sm text-destructive">{pictureError}</p>}
              </div>

              <FormField
                control={editForm.control}
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
                control={editForm.control}
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
                control={editForm.control}
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
                control={editForm.control}
                name="mitgliedsnumer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mitgliedsnummer (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Mitgliedsnummer eingeben..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="geburtstag"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Geburtstag (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="z.B. 01.01.1990" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="vorherTitel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titel, vorangestellt (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="z.B. Dr." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="titelNachher"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titel, nachgestellt (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="z.B. MSc" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="aktiv"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between gap-2 space-y-0">
                    <FormLabel className="font-normal">Aktiv</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="admin"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between gap-2 space-y-0">
                    <FormLabel className="font-normal">Admin</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="submit"
                  disabled={editSaving}
                  className="bg-brand-blue font-semibold uppercase tracking-wide text-white hover:bg-brand-blue/90"
                >
                  {editSaving ? "Wird gespeichert..." : "Speichern"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mitglied löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteError
                ? deleteError
                : `„${deleteTarget?.vorname} ${deleteTarget?.nachname}" wird unwiderruflich gelöscht, inklusive Login-Zugang. Diese Aktion kann nicht rückgängig gemacht werden.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction disabled={deleteSaving} onClick={() => void confirmDelete()}>
              {deleteSaving ? "Wird gelöscht..." : "Löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
