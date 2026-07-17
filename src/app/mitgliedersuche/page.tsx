"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutGrid, List, Printer, UserRound } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const VIEW_STORAGE_KEY = "mitgliedersuche-view";
const PRINT_STORAGE_KEY = "mitgliedersuche-druck-payload";

type Mitglied = {
  id: number;
  auth_user_id: string | null;
  vorname: string | null;
  nachname: string | null;
  email: string | null;
  telefonnummer: string | null;
  mitgliedsnumer: string | null;
  geburtstag: string | null;
  vorher_titel: string | null;
  titel_nachher: string | null;
  aktiv: boolean | null;
  admin: boolean | null;
  profile_picture_url: string | null;
};

type View = "karten" | "liste";

export default function MitgliedersuchePage() {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [ownAuthUserId, setOwnAuthUserId] = useState<string | null>(null);
  const [vereinId, setVereinId] = useState<number | null>(null);
  const [vereinName, setVereinName] = useState<string | null>(null);

  const [mitglieder, setMitglieder] = useState<Mitglied[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [view, setView] = useState<View>("karten");

  const [detailTarget, setDetailTarget] = useState<Mitglied | null>(null);

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
        .select("verein, auth_user_id")
        .eq("auth_user_id", session.user.id)
        .maybeSingle();

      if (!active) return;

      setOwnAuthUserId(session.user.id);
      setAllowed(true);
      setChecking(false);
      setVereinId(userRow?.verein?.[0] ?? null);
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!vereinId) return;
    void loadMitglieder(vereinId);
  }, [vereinId]);

  useEffect(() => {
    if (!vereinId) {
      setVereinName(null);
      return;
    }
    let active = true;
    supabase
      .from("vereine")
      .select("vereinsname")
      .eq("id", vereinId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setVereinName(data?.vereinsname ?? null);
      });
    return () => {
      active = false;
    };
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

  function handlePrint() {
    const payload = {
      vereinsname: vereinName ?? "",
      stand: new Date().toLocaleDateString("de-DE"),
      mitglieder: filteredMitglieder.map((m) => ({
        name: `${m.nachname ?? ""} ${m.vorname ?? ""}`.trim(),
        email: m.email ?? "",
        telefonnummer: m.telefonnummer ?? "",
      })),
    };
    window.sessionStorage.setItem(PRINT_STORAGE_KEY, JSON.stringify(payload));
    window.open("/mitgliedersuche/drucken", "_blank");
  }

  async function loadMitglieder(vId: number) {
    setListLoading(true);
    setListError(null);

    const { data, error } = await supabase
      .from("users")
      .select(
        "id, auth_user_id, vorname, nachname, email, telefonnummer, mitgliedsnumer, geburtstag, vorher_titel, titel_nachher, aktiv, admin, profile_picture_url"
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
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      const haystack = `${m.vorname ?? ""} ${m.nachname ?? ""} ${m.email ?? ""}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });

  const hasOtherMitglieder = mitglieder.some((m) => m.auth_user_id !== ownAuthUserId);

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
          <h1 className="font-heading text-[21px] font-medium text-white">Mitgliedersuche</h1>
        </div>

        <div className="flex w-full flex-1 flex-col gap-6 border border-gray-400 bg-gray-100 px-4 py-6">
          {vereinId && (
            <div className="flex w-full gap-2">
              <Button
                onClick={toggleView}
                className="h-12 flex-1 gap-2 bg-brand-blue font-semibold uppercase tracking-wide text-white hover:bg-brand-blue/90"
              >
                {view === "karten" ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
                {view === "karten" ? "In Listenform" : "In Kartenform"}
              </Button>
              {view === "liste" && (
                <Button
                  onClick={handlePrint}
                  aria-label="Mitgliederverzeichnis drucken"
                  className="h-12 w-12 shrink-0 bg-brand-blue text-white hover:bg-brand-blue/90"
                >
                  <Printer className="h-5 w-5" />
                </Button>
              )}
            </div>
          )}

          {!vereinId && (
            <p className="text-sm text-muted-foreground">Kein Verein zugeordnet.</p>
          )}

          {vereinId && (
            <>
              <Input
                placeholder={
                  mitglieder.length > 0
                    ? `eines von den ${mitglieder.length} Mitgliedern suchen...`
                    : "Suche nach Name oder E-Mail..."
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              {listError && (
                <Alert variant="destructive">
                  <AlertDescription>{listError}</AlertDescription>
                </Alert>
              )}

              {!listLoading && !listError && !hasOtherMitglieder && (
                <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-10 text-center">
                  <p className="text-sm text-muted-foreground">
                    Noch keine weiteren Mitglieder in deinem Verein.
                  </p>
                </div>
              )}

              {!listLoading && hasOtherMitglieder && filteredMitglieder.length === 0 && (
                <p className="text-sm text-muted-foreground">Keine Mitglieder gefunden.</p>
              )}

              {!listLoading && hasOtherMitglieder && filteredMitglieder.length > 0 && view === "liste" && (
                <div className="flex flex-col gap-2 rounded-lg border bg-white p-4 shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
                  {filteredMitglieder.map((m) => (
                    <div key={m.id} className="grid grid-cols-[1fr_1fr_auto] gap-4 text-sm text-foreground">
                      <span className="min-w-0 truncate">
                        {m.nachname} {m.vorname}
                      </span>
                      <span className="min-w-0 truncate">{m.email}</span>
                      <span className="shrink-0 whitespace-nowrap">{m.telefonnummer}</span>
                    </div>
                  ))}
                </div>
              )}

              {!listLoading && hasOtherMitglieder && filteredMitglieder.length > 0 && view === "karten" && (
                <div className="grid grid-cols-4 gap-2">
                  {filteredMitglieder.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => setDetailTarget(m)}
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
      </div>

      <Dialog open={!!detailTarget} onOpenChange={(open) => !open && setDetailTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mitglied ansehen</DialogTitle>
          </DialogHeader>

          {detailTarget && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col items-center gap-2">
                {detailTarget.profile_picture_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={detailTarget.profile_picture_url}
                    alt="Profilbild"
                    className="h-24 w-24 rounded-full border object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border bg-muted">
                    <UserRound className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                <div className="flex flex-wrap justify-center gap-1.5">
                  {detailTarget.auth_user_id === ownAuthUserId && <Badge variant="secondary">Du</Badge>}
                  {detailTarget.admin && <Badge variant="secondary">Admin</Badge>}
                  {!detailTarget.aktiv && (
                    <Badge variant="outline" className="text-muted-foreground">
                      Inaktiv
                    </Badge>
                  )}
                </div>
              </div>

              <dl className="flex flex-col gap-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Name</dt>
                  <dd className="font-medium text-foreground">
                    {[detailTarget.vorher_titel, detailTarget.vorname, detailTarget.nachname, detailTarget.titel_nachher]
                      .filter(Boolean)
                      .join(" ")}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">E-Mail</dt>
                  <dd className="text-foreground">{detailTarget.email}</dd>
                </div>
                {detailTarget.telefonnummer && (
                  <div>
                    <dt className="text-xs text-muted-foreground">Telefonnummer</dt>
                    <dd className="text-foreground">{detailTarget.telefonnummer}</dd>
                  </div>
                )}
                {detailTarget.mitgliedsnumer && (
                  <div>
                    <dt className="text-xs text-muted-foreground">Mitgliedsnummer</dt>
                    <dd className="text-foreground">{detailTarget.mitgliedsnumer}</dd>
                  </div>
                )}
                {detailTarget.geburtstag && (
                  <div>
                    <dt className="text-xs text-muted-foreground">Geburtstag</dt>
                    <dd className="text-foreground">{detailTarget.geburtstag}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailTarget(null)}>
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
