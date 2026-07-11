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

type Mitglied = {
  id: number;
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
};

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

  async function loadMitglieder(vId: number) {
    setListLoading(true);
    setListError(null);

    const { data, error } = await supabase
      .from("users")
      .select(
        "id, auth_user_id, vorname, nachname, email, mitgliedsnumer, geburtstag, vorher_titel, titel_nachher, aktiv, admin"
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

  async function onEditSubmit(values: EditValues) {
    if (!editTarget || !vereinId) return;
    setEditSaving(true);
    setEditError(null);

    try {
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

  if (checking) {
    return <main className="min-h-screen bg-background" />;
  }

  if (!allowed) {
    return null;
  }

  return (
    <main className="flex min-h-screen justify-center bg-background px-4 py-10">
      <div className="flex w-full max-w-2xl flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold text-brand-blue">Mitglieder</h1>
          {vereinId && (
            <Button
              onClick={openCreateDialog}
              className="bg-brand-blue font-semibold uppercase tracking-wide text-white hover:bg-brand-blue/90"
            >
              Neues Mitglied
            </Button>
          )}
        </div>

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
                placeholder="Suche nach Name oder E-Mail..."
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

            {!listLoading && hasOtherMitglieder && filteredMitglieder.length > 0 && (
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
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        <Button asChild variant="outline" className="h-12 w-full font-semibold uppercase tracking-wide">
          <Link href="/">Zurück</Link>
        </Button>
      </div>

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
    </main>
  );
}
