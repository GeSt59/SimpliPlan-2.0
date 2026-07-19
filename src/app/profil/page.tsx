"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, KeyRound, ListChecks, Pencil, Power, Settings, UserRound } from "lucide-react";
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

const PICTURE_BUCKET = "adalo-media";
const MAX_PICTURE_BYTES = 2 * 1024 * 1024;
const ALLOWED_PICTURE_TYPES = ["image/png", "image/jpeg", "image/svg+xml"];

type Profile = {
  id: number;
  vorname: string | null;
  nachname: string | null;
  email: string | null;
  telefonnummer: string | null;
  mitgliedsnumer: string | null;
  geburtstag: string | null;
  vorher_titel: string | null;
  titel_nachher: string | null;
  profile_picture_url: string | null;
  verein: number[] | null;
  admin: boolean | null;
};

const profileSchema = z.object({
  vorname: z.string().min(1, "Vorname ist erforderlich"),
  nachname: z.string().min(1, "Nachname ist erforderlich"),
  email: z.string().min(1, "E-Mail ist erforderlich").email("Ungültige E-Mail-Adresse"),
  telefonnummer: z.string(),
  mitgliedsnumer: z.string(),
  geburtstag: z.string(),
  vorherTitel: z.string(),
  titelNachher: z.string(),
});
type ProfileValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    password: z.string().min(6, "Mindestens 6 Zeichen"),
    passwordConfirm: z.string().min(6, "Mindestens 6 Zeichen"),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwörter stimmen nicht überein",
    path: ["passwordConfirm"],
  });
type PasswordValues = z.infer<typeof passwordSchema>;

export default function ProfilPage() {
  const [checking, setChecking] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [vereinsname, setVereinsname] = useState<string | null>(null);
  const [vereinslogoUrl, setVereinslogoUrl] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [pictureUrl, setPictureUrl] = useState<string | null>(null);
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [picturePreview, setPicturePreview] = useState<string | null>(null);
  const [pictureError, setPictureError] = useState<string | null>(null);

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const editForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      vorname: "",
      nachname: "",
      email: "",
      telefonnummer: "",
      mitgliedsnumer: "",
      geburtstag: "",
      vorherTitel: "",
      titelNachher: "",
    },
  });

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", passwordConfirm: "" },
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
        .select(
          "id, vorname, nachname, email, telefonnummer, mitgliedsnumer, geburtstag, vorher_titel, titel_nachher, profile_picture_url, verein, admin"
        )
        .eq("auth_user_id", session.user.id)
        .maybeSingle();

      if (!active) return;

      setProfile(userRow ?? null);
      setChecking(false);

      const vereinId = userRow?.verein?.[0];
      if (vereinId) {
        const { data: vereinRow } = await supabase
          .from("vereine")
          .select("vereinsname, vereinslogo_url")
          .eq("id", vereinId)
          .maybeSingle();

        if (!active) return;
        setVereinsname(vereinRow?.vereinsname ?? null);
        setVereinslogoUrl(vereinRow?.vereinslogo_url ?? null);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  function openEditDialog() {
    if (!profile) return;
    setEditError(null);
    setPictureUrl(profile.profile_picture_url);
    setPictureFile(null);
    setPicturePreview(null);
    setPictureError(null);
    editForm.reset({
      vorname: profile.vorname ?? "",
      nachname: profile.nachname ?? "",
      email: profile.email ?? "",
      telefonnummer: profile.telefonnummer ?? "",
      mitgliedsnumer: profile.mitgliedsnumer ?? "",
      geburtstag: profile.geburtstag ?? "",
      vorherTitel: profile.vorher_titel ?? "",
      titelNachher: profile.titel_nachher ?? "",
    });
    setEditOpen(true);
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

  async function onEditSubmit(values: ProfileValues) {
    if (!profile) return;
    setEditSaving(true);
    setEditError(null);

    try {
      let newPictureUrl = pictureUrl;
      const vereinId = profile.verein?.[0];

      if (pictureFile && vereinId) {
        const path = `users/${vereinId}-${profile.id}-${Date.now()}-${pictureFile.name}`;
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

      const res = await fetch("/api/profil", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          vorname: values.vorname.trim(),
          nachname: values.nachname.trim(),
          email: values.email.trim(),
          telefonnummer: values.telefonnummer.trim() || null,
          mitgliedsnumer: values.mitgliedsnumer.trim() || null,
          geburtstag: values.geburtstag.trim() || null,
          vorherTitel: values.vorherTitel.trim() || null,
          titelNachher: values.titelNachher.trim() || null,
          profilePictureUrl: newPictureUrl,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        if (body?.error === "email_taken") {
          setEditError("Diese E-Mail ist bereits registriert.");
        } else {
          setEditError("Speichern fehlgeschlagen. Bitte versuche es erneut.");
        }
        setEditSaving(false);
        return;
      }

      setProfile({
        ...profile,
        vorname: values.vorname.trim(),
        nachname: values.nachname.trim(),
        email: values.email.trim(),
        telefonnummer: values.telefonnummer.trim() || null,
        mitgliedsnumer: values.mitgliedsnumer.trim() || null,
        geburtstag: values.geburtstag.trim() || null,
        vorher_titel: values.vorherTitel.trim() || null,
        titel_nachher: values.titelNachher.trim() || null,
        profile_picture_url: newPictureUrl,
      });
      setEditOpen(false);
    } catch {
      setEditError("Server nicht erreichbar. Bitte versuche es später erneut.");
    } finally {
      setEditSaving(false);
    }
  }

  function openPasswordDialog() {
    setPasswordError(null);
    passwordForm.reset({ password: "", passwordConfirm: "" });
    setPasswordOpen(true);
  }

  async function onPasswordSubmit(values: PasswordValues) {
    setPasswordSaving(true);
    setPasswordError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password: values.password });

      if (error) {
        setPasswordError("Passwort konnte nicht geändert werden. Bitte versuche es erneut.");
        setPasswordSaving(false);
        return;
      }

      setPasswordOpen(false);
    } catch {
      setPasswordError("Server nicht erreichbar. Bitte versuche es später erneut.");
    } finally {
      setPasswordSaving(false);
    }
  }

  if (checking) {
    return <main className="min-h-screen bg-background" />;
  }

  const isAdmin = !!profile?.admin;

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
          <h1 className="font-heading text-[21px] font-medium text-white">Profil</h1>
        </div>

        <div className="flex w-full flex-1 flex-col gap-5 border border-gray-400 bg-gray-100 px-4 py-6">
          <div className="relative flex flex-col items-center gap-2 overflow-hidden rounded-lg border bg-white p-6 text-center shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
            {vereinslogoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={vereinslogoUrl}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full object-contain opacity-10 grayscale"
              />
            )}

            <div className="relative flex flex-col items-center gap-2">
              {profile?.profile_picture_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.profile_picture_url}
                  alt={`${profile.vorname ?? ""} ${profile.nachname ?? ""}`}
                  className="h-[122px] w-[122px] rounded-full border object-cover"
                />
              ) : (
                <div className="flex h-[122px] w-[122px] items-center justify-center rounded-full border bg-muted">
                  <UserRound className="h-12 w-12 text-muted-foreground" />
                </div>
              )}

              <p className="font-heading text-lg font-semibold text-brand-gold">
                {profile?.vorname} {profile?.nachname}
              </p>
              <p className="text-sm text-foreground">{profile?.email}</p>
              {vereinsname && <p className="text-sm font-medium text-muted-foreground">{vereinsname}</p>}
            </div>
          </div>

          <Button
            onClick={openEditDialog}
            className="h-12 w-full shadow-[0_2px_4px_rgba(0,0,0,0.3)] gap-2 bg-brand-blue font-semibold uppercase tracking-wide text-white hover:bg-brand-blue/90"
          >
            <Pencil className="h-4 w-4" />
            Profil ändern
          </Button>

          <Button
            asChild
            className="h-12 w-full shadow-[0_2px_4px_rgba(0,0,0,0.3)] gap-2 bg-brand-gold font-semibold uppercase tracking-wide text-black hover:bg-brand-gold/90"
          >
            <Link href="/meine-einteilungen">
              <ListChecks className="h-4 w-4" />
              Meine Einteilungen
            </Link>
          </Button>

          <Button
            onClick={openPasswordDialog}
            variant="outline"
            className="h-12 w-full shadow-[0_2px_4px_rgba(0,0,0,0.3)] gap-2 font-semibold uppercase tracking-wide"
          >
            <KeyRound className="h-4 w-4" />
            Passwort ändern
          </Button>

          {isAdmin && (
            <Button
              asChild
              className="h-12 w-full shadow-[0_2px_4px_rgba(0,0,0,0.3)] gap-2 bg-brand-blue font-semibold uppercase tracking-wide text-white hover:bg-brand-blue/90"
            >
              <Link href="/voreinstellung">
                <Settings className="h-4 w-4" />
                Vereinseinstellungen
              </Link>
            </Button>
          )}

          <Button
            onClick={handleLogout}
            variant="outline"
            className="h-12 w-full shadow-[0_2px_4px_rgba(0,0,0,0.3)] gap-2 border-brand-gold font-semibold uppercase tracking-wide text-brand-gold hover:bg-brand-gold/10"
          >
            <Power className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Profil ändern</DialogTitle>
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
                name="telefonnummer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefonnummer (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Telefonnummer eingeben..." {...field} />
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

              <DialogFooter>
                <Button
                  type="submit"
                  disabled={editSaving}
                  className="bg-brand-blue font-semibold uppercase tracking-wide text-white shadow-[0_2px_4px_rgba(0,0,0,0.3)] hover:bg-brand-blue/90"
                >
                  {editSaving ? "Wird gespeichert..." : "Speichern"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Passwort ändern</DialogTitle>
          </DialogHeader>

          <Form {...passwordForm}>
            <form className="flex flex-col gap-4" onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
              {passwordError && (
                <Alert variant="destructive">
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              )}

              <FormField
                control={passwordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Neues Passwort</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Neues Passwort eingeben..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="passwordConfirm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passwort wiederholen</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Passwort wiederholen..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="submit"
                  disabled={passwordSaving}
                  className="bg-brand-blue font-semibold uppercase tracking-wide text-white shadow-[0_2px_4px_rgba(0,0,0,0.3)] hover:bg-brand-blue/90"
                >
                  {passwordSaving ? "Wird geändert..." : "Ändern"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
