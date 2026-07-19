"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const LOGO_BUCKET = "adalo-media";
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/svg+xml"];
const TAB_MAX_LENGTH = 20;

const TAB_FIELDS = ["tab1", "tab2", "tab3", "tab4", "tab5"] as const;

const TAB_LABELS: Record<(typeof TAB_FIELDS)[number], string> = {
  tab1: "Tab 1 (z.B. Activities)",
  tab2: "Tab 2 (z.B. Lions)",
  tab3: "Tab 3 (z.B. Activity)",
  tab4: "Tab 4 (z.B. Kategorien)",
  tab5: "Tab 5 (z.B. Profil)",
};

const settingsSchema = z.object({
  vereinsname: z.string().min(1, "Vereinsname ist erforderlich"),
  tab1: z.string().max(TAB_MAX_LENGTH, `Maximal ${TAB_MAX_LENGTH} Zeichen`),
  tab2: z.string().max(TAB_MAX_LENGTH, `Maximal ${TAB_MAX_LENGTH} Zeichen`),
  tab3: z.string().max(TAB_MAX_LENGTH, `Maximal ${TAB_MAX_LENGTH} Zeichen`),
  tab4: z.string().max(TAB_MAX_LENGTH, `Maximal ${TAB_MAX_LENGTH} Zeichen`),
  tab5: z.string().max(TAB_MAX_LENGTH, `Maximal ${TAB_MAX_LENGTH} Zeichen`),
  freischaltcode: z.string(),
});

type SettingsValues = z.infer<typeof settingsSchema>;

export default function VereinseinstellungenPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [vereinId, setVereinId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const initialFreischaltcodeRef = useRef("");
  const pendingValuesRef = useRef<SettingsValues | null>(null);

  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      vereinsname: "",
      tab1: "",
      tab2: "",
      tab3: "",
      tab4: "",
      tab5: "",
      freischaltcode: "",
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
        .select("admin, verein")
        .eq("auth_user_id", session.user.id)
        .maybeSingle();

      if (!active) return;

      const vId = userRow?.admin ? userRow.verein?.[0] : undefined;

      if (!vId) {
        window.location.href = "/";
        return;
      }

      const { data: vereinRow, error: vereinError } = await supabase
        .from("vereine")
        .select("id, vereinsname, vereinslogo_url, tab1, tab2, tab3, tab4, tab5, freischaltcode")
        .eq("id", vId)
        .maybeSingle();

      if (!active) return;

      if (vereinError || !vereinRow) {
        setError("Vereinsdaten konnten nicht geladen werden.");
        setAllowed(true);
        setChecking(false);
        return;
      }

      setVereinId(vereinRow.id);
      setLogoUrl(vereinRow.vereinslogo_url);
      initialFreischaltcodeRef.current = vereinRow.freischaltcode ?? "";
      form.reset({
        vereinsname: vereinRow.vereinsname ?? "",
        tab1: vereinRow.tab1 ?? "",
        tab2: vereinRow.tab2 ?? "",
        tab3: vereinRow.tab3 ?? "",
        tab4: vereinRow.tab4 ?? "",
        tab5: vereinRow.tab5 ?? "",
        freischaltcode: vereinRow.freischaltcode ?? "",
      });

      setAllowed(true);
      setChecking(false);
    }

    load();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setLogoError("Nur PNG-, JPG- oder SVG-Dateien sind erlaubt.");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError("Die Datei darf maximal 2 MB groß sein.");
      return;
    }

    setLogoError(null);
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function persist(values: SettingsValues) {
    if (!vereinId) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      let newLogoUrl = logoUrl;

      if (logoFile) {
        const path = `vereine/${vereinId}-${logoFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from(LOGO_BUCKET)
          .upload(path, logoFile, { upsert: true, contentType: logoFile.type });

        if (uploadError) {
          setError("Logo-Upload fehlgeschlagen. Bitte versuche es erneut.");
          setLoading(false);
          return;
        }

        const { data: publicUrlData } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path);
        newLogoUrl = publicUrlData.publicUrl;
      }

      const { error: updateError } = await supabase
        .from("vereine")
        .update({
          vereinsname: values.vereinsname,
          tab1: values.tab1,
          tab2: values.tab2,
          tab3: values.tab3,
          tab4: values.tab4,
          tab5: values.tab5,
          freischaltcode: values.freischaltcode,
          vereinslogo_url: newLogoUrl,
        })
        .eq("id", vereinId);

      if (updateError) {
        setError("Speichern fehlgeschlagen. Bitte versuche es erneut.");
        setLoading(false);
        return;
      }

      setLogoUrl(newLogoUrl);
      setLogoFile(null);
      setLogoPreview(null);
      initialFreischaltcodeRef.current = values.freischaltcode;
      setSuccess(true);
      router.push("/profil");
    } catch {
      setError("Server nicht erreichbar. Bitte versuche es später erneut.");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(values: SettingsValues) {
    if (values.freischaltcode !== initialFreischaltcodeRef.current) {
      pendingValuesRef.current = values;
      setConfirmOpen(true);
      return;
    }
    void persist(values);
  }

  function handleConfirmChange() {
    setConfirmOpen(false);
    if (pendingValuesRef.current) {
      void persist(pendingValuesRef.current);
      pendingValuesRef.current = null;
    }
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
        <div className="relative bg-brand-blue px-4 py-3 text-center">
          <Link
            href="/profil"
            aria-label="Zurück zu Profil"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="font-heading text-[21px] font-medium text-white">Vereinseinstellungen</h1>
        </div>

        <div className="flex w-full flex-1 flex-col gap-4 border border-gray-400 bg-gray-100 px-4 py-6">
        <Form {...form}>
          <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert>
                <AlertDescription>Einstellungen wurden gespeichert.</AlertDescription>
              </Alert>
            )}

            <section className="flex flex-col gap-4 rounded-lg border border-brand-blue bg-white p-4">
              <h2 className="font-heading text-base font-semibold text-brand-blue">Stammdaten</h2>

              <FormField
                control={form.control}
                name="vereinsname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vereinsname</FormLabel>
                    <FormControl>
                      <Input placeholder="Vereinsname eingeben..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col gap-2">
                <Label htmlFor="logo">Vereinslogo</Label>
                {(logoPreview || logoUrl) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoPreview ?? logoUrl ?? undefined}
                    alt="Vereinslogo"
                    className="h-24 w-24 rounded-lg border object-cover"
                  />
                )}
                <Input
                  id="logo"
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={handleLogoChange}
                />
                {logoError && <p className="text-sm text-destructive">{logoError}</p>}
              </div>
            </section>

            <section className="flex flex-col gap-4 rounded-lg border border-brand-blue bg-white p-4">
              <h2 className="font-heading text-base font-semibold text-brand-blue">Navigations-Tabs</h2>
              {TAB_FIELDS.map((name) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{TAB_LABELS[name]}</FormLabel>
                      <FormControl>
                        <Input maxLength={TAB_MAX_LENGTH} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </section>

            <section className="flex flex-col gap-4 rounded-lg border border-brand-blue bg-white p-4">
              <h2 className="font-heading text-base font-semibold text-brand-blue">Freischaltcode</h2>
              <FormField
                control={form.control}
                name="freischaltcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Freischaltcode</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <Button
              type="submit"
              disabled={loading}
              className="mt-2 h-12 w-full shadow-[0_2px_4px_rgba(0,0,0,0.3)] bg-brand-blue font-semibold uppercase tracking-wide text-white hover:bg-brand-blue/90"
            >
              {loading ? "Wird gespeichert..." : "Speichern"}
            </Button>
          </form>
        </Form>

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Freischaltcode ändern?</AlertDialogTitle>
              <AlertDialogDescription>
                Bereits verteilte, alte Freischaltcodes werden ab sofort ungültig. Neue Mitglieder benötigen
                den neuen Code, um sich zu registrieren.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmChange}>Ändern</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        </div>
      </div>
    </main>
  );
}
