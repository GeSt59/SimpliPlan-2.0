"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  resolveCategoryName,
  resolveCategoryPicture,
  formatActivityRange,
  startOfTodayIso,
  resolveRoleName,
  resolveMemberName,
} from "@/lib/activities";
import type { ActivityCategory, ZeitbereichRole, Member } from "@/lib/activities";
import type { ActivityRecord } from "@/lib/activity-form-schema";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const ACTIVITY_COLUMNS = "id, adalo_id, name, category, du_z, du_zbis, ort, beschreibung, einteilungens";

type ZeitbereichSignupRow = {
  id: number;
  label: string;
  benoetigt: number;
  kommen: number;
  roleRef: (string | number)[] | null;
  names: string[];
  checked: boolean;
  saving: boolean;
  error: string | null;
};

function isPastDate(du_zbis: string | null): boolean {
  return !!du_zbis && du_zbis < startOfTodayIso();
}

export default function ActivityDetailPage() {
  const params = useParams<{ id: string }>();
  const activityId = Number(params.id);

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [vereinId, setVereinId] = useState<number | null>(null);
  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [myAdaloId, setMyAdaloId] = useState<number | null>(null);

  const [categories, setCategories] = useState<ActivityCategory[]>([]);
  const [activity, setActivity] = useState<ActivityRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [roles, setRoles] = useState<ZeitbereichRole[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [signupRows, setSignupRows] = useState<ZeitbereichSignupRow[]>([]);
  const [signupLoading, setSignupLoading] = useState(true);
  const [signupError, setSignupError] = useState<string | null>(null);

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
        .select("id, adalo_id, admin, verein")
        .eq("auth_user_id", session.user.id)
        .maybeSingle();

      if (!active) return;

      const vId = userRow?.verein?.[0];

      if (!vId) {
        window.location.href = "/";
        return;
      }

      setVereinId(vId);
      setMyUserId(userRow?.id ?? null);
      setMyAdaloId(userRow?.adalo_id ?? null);
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
    if (!vereinId || !Number.isInteger(activityId)) return;
    void loadCategories(vereinId);
    void loadActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vereinId, activityId]);

  useEffect(() => {
    if (!vereinId || !activity || myUserId == null) return;
    if (isPastDate(activity.du_zbis)) {
      setSignupLoading(false);
      return;
    }
    void loadSignupData(vereinId, myUserId, myAdaloId, activity.adalo_id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vereinId, activity, myUserId]);

  async function loadCategories(vId: number) {
    const { data } = await supabase
      .from("categories")
      .select("id, adalo_id, name, picture_url")
      .contains("vereine", [vId])
      .order("name", { ascending: true });

    setCategories(data ?? []);
  }

  async function loadActivity() {
    setLoading(true);
    setLoadError(null);
    setNotFound(false);

    const { data, error } = await supabase
      .from("activities")
      .select(ACTIVITY_COLUMNS)
      .eq("id", activityId)
      .maybeSingle();

    if (error) {
      setLoadError("Activity konnte nicht geladen werden.");
      setLoading(false);
      return;
    }

    if (!data) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setActivity(data);
    setLoading(false);
  }

  async function loadSignupData(vId: number, myId: number, myAdaloIdVal: number | null, actAdaloId: number | null) {
    setSignupLoading(true);
    setSignupError(null);

    const [{ data: roleData }, { data: memberData }] = await Promise.all([
      supabase.from("rollen").select("id, adalo_id, name").contains("vereine", [vId]),
      // Nutzt die eingeschränkte mitglieder_namen-View (nur id/adalo_id/vorname/nachname),
      // da die zugrunde liegende users-Tabelle für normale Mitglieder admin-only ist (PROJ-10 Backend).
      supabase.from("mitglieder_namen").select("id, adalo_id, vorname, nachname").contains("verein", [vId]),
    ]);

    const loadedMembers = memberData ?? [];
    setRoles(roleData ?? []);
    setMembers(loadedMembers);

    const activityFilters = [`activity.cs.{${activityId}}`];
    if (actAdaloId != null) {
      activityFilters.push(`activity.cs.{${actAdaloId}}`);
    }

    const { data, error } = await supabase
      .from("einstellungen")
      .select("id, zeitbereich, ben, rollen, eingeteilte_users")
      .or(activityFilters.join(","))
      .gt("ben", 0)
      .order("id", { ascending: true });

    if (error) {
      setSignupError("Zeitbereiche konnten nicht geladen werden.");
      setSignupLoading(false);
      return;
    }

    const isMe = (ref: string | number) =>
      String(ref) === String(myId) || (myAdaloIdVal != null && String(ref) === String(myAdaloIdVal));

    setSignupRows(
      (data ?? [])
        .filter((z) => z.rollen && z.rollen.length > 0)
        .map((z) => {
          const refs: (string | number)[] = z.eingeteilte_users ?? [];
          return {
            id: z.id,
            label: z.zeitbereich ?? "",
            benoetigt: z.ben ?? 0,
            kommen: refs.length,
            roleRef: z.rollen,
            names: refs.map((ref) => resolveMemberName(loadedMembers, ref)).sort((a, b) => a.localeCompare(b, "de")),
            checked: refs.some(isMe),
            saving: false,
            error: null,
          };
        })
    );
    setSignupLoading(false);
  }

  async function handleToggleSignup(row: ZeitbereichSignupRow) {
    setSignupRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, saving: true, error: null } : r)));

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    try {
      const res = await fetch(`/api/einstellungen/${row.id}/anmeldung`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: row.checked ? "abmelden" : "anmelden" }),
      });

      if (!res.ok) {
        setSignupRows((prev) =>
          prev.map((r) =>
            r.id === row.id ? { ...r, saving: false, error: "Änderung fehlgeschlagen. Bitte versuche es erneut." } : r
          )
        );
        return;
      }

      if (vereinId && myUserId != null) {
        await loadSignupData(vereinId, myUserId, myAdaloId, activity?.adalo_id ?? null);
      }
    } catch {
      setSignupRows((prev) =>
        prev.map((r) =>
          r.id === row.id ? { ...r, saving: false, error: "Server nicht erreichbar. Bitte versuche es später erneut." } : r
        )
      );
    }
  }

  if (checking || (!notFound && loading)) {
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

  const showSignup = !!activity && !isPastDate(activity.du_zbis);

  return (
    <main className="min-h-screen bg-background pb-32">
      <div className="relative bg-brand-blue px-4 py-6 text-center">
        <Link
          href="/activities"
          aria-label="Zurück zu Activities"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="font-heading text-2xl font-bold text-white">{activity?.name}</h1>
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6">
        {loadError && (
          <Alert variant="destructive">
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        )}

        {activity && (
          <>
            <div className="flex flex-col gap-3 rounded-lg border p-4">
              <div className="flex flex-wrap items-center gap-3">
                {resolveCategoryPicture(categories, activity.category) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolveCategoryPicture(categories, activity.category) ?? undefined}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-md object-cover"
                  />
                )}
                <Badge variant="secondary">{resolveCategoryName(categories, activity.category)}</Badge>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Datum &amp; Uhrzeit
                </p>
                <p className="text-sm text-foreground">{formatActivityRange(activity.du_z, activity.du_zbis)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ort</p>
                <p className="text-sm text-foreground">{activity.ort}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Beschreibung</p>
                <p className="whitespace-pre-wrap text-sm text-foreground">
                  {activity.beschreibung || "Keine Beschreibung hinterlegt."}
                </p>
              </div>

              {isAdmin && (
                <Button
                  asChild
                  variant="outline"
                  className="mt-2 w-fit font-semibold uppercase tracking-wide"
                >
                  <Link href={`/activities/${activity.id}/bearbeiten`}>Bearbeiten</Link>
                </Button>
              )}
            </div>

            {isAdmin && (
              <div className="flex flex-col gap-3 rounded-lg border border-dashed p-4">
                <p className="text-sm font-semibold text-foreground">Zeitbereiche verwalten</p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button asChild variant="outline" className="w-fit font-semibold uppercase tracking-wide">
                    <Link href={`/activities/${activity.id}/zeitbereiche`}>Zeitbereich hinzufügen</Link>
                  </Button>
                  <Link href="/rollen" className="text-sm font-medium text-brand-blue underline">
                    Rollen verwalten
                  </Link>
                </div>
              </div>
            )}

            {showSignup && (
              <div className="flex flex-col gap-3 rounded-lg border p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">Anmeldung</p>
                  <Button asChild variant="outline" size="sm" className="font-semibold uppercase tracking-wide">
                    <Link href={`/activities/${activity.id}/uebersicht`}>Übersicht</Link>
                  </Button>
                </div>

                {signupError && (
                  <Alert variant="destructive">
                    <AlertDescription>{signupError}</AlertDescription>
                  </Alert>
                )}

                {!signupLoading && signupRows.length === 0 && !signupError && (
                  <p className="text-sm text-muted-foreground">
                    Für diese Activity sind noch keine Zeitbereiche mit Bedarf hinterlegt.
                  </p>
                )}

                <ul className="flex flex-col gap-3">
                  {signupRows.map((row) => (
                    <li key={row.id} className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">{row.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {resolveRoleName(roles, row.roleRef)} · {row.kommen} von {row.benoetigt}
                          </p>
                        </div>
                        <label className="flex shrink-0 items-center gap-2 text-sm text-foreground">
                          Ich bin dabei
                          <Checkbox
                            checked={row.checked}
                            disabled={row.saving}
                            onCheckedChange={() => void handleToggleSignup(row)}
                          />
                        </label>
                      </div>
                      {row.names.length > 0 && (
                        <p className="text-sm text-muted-foreground">{row.names.join(", ")}</p>
                      )}
                      {row.error && <p className="text-sm text-destructive">{row.error}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        <Button asChild variant="outline" className="h-12 w-full font-semibold uppercase tracking-wide">
          <Link href="/activities">Zurück zu Activities</Link>
        </Button>
      </div>
    </main>
  );
}
