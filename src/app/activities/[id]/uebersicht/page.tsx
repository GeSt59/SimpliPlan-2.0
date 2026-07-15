"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { resolveRoleName, resolveMemberName, computeSignupStatus, SIGNUP_STATUS_ICON } from "@/lib/activities";
import type { ZeitbereichRole, Member } from "@/lib/activities";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type UebersichtRow = {
  id: number;
  label: string;
  roleRef: (string | number)[] | null;
  kommen: number;
  benoetigt: number;
  names: string[];
};

export default function ActivityUebersichtPage() {
  const params = useParams<{ id: string }>();
  const activityId = Number(params.id);

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [vereinId, setVereinId] = useState<number | null>(null);

  const [activityName, setActivityName] = useState<string>("");
  const [notFound, setNotFound] = useState(false);

  const [roles, setRoles] = useState<ZeitbereichRole[]>([]);
  const [rows, setRows] = useState<UebersichtRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

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
        .select("verein")
        .eq("auth_user_id", session.user.id)
        .maybeSingle();

      if (!active) return;

      const vId = userRow?.verein?.[0];

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
    if (!vereinId || !Number.isInteger(activityId)) return;
    void loadData(vereinId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vereinId, activityId]);

  async function loadData(vId: number) {
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

    const [{ data: roleData }, { data: memberData }] = await Promise.all([
      supabase.from("rollen").select("id, adalo_id, name").contains("vereine", [vId]),
      // Eingeschränkte View (nur id/adalo_id/vorname/nachname), da users für normale Mitglieder admin-only ist.
      supabase.from("mitglieder_namen").select("id, adalo_id, vorname, nachname").contains("verein", [vId]),
    ]);
    const loadedMembers: Member[] = memberData ?? [];
    setRoles(roleData ?? []);

    const activityFilters = [`activity.cs.{${activity.id}}`];
    if (activity.adalo_id != null) {
      activityFilters.push(`activity.cs.{${activity.adalo_id}}`);
    }

    const { data, error } = await supabase
      .from("einstellungen")
      .select("id, zeitbereich, ben, rollen, eingeteilte_users")
      .or(activityFilters.join(","))
      .gt("ben", 0)
      .order("id", { ascending: true });

    if (error) {
      setListError("Zeitbereiche konnten nicht geladen werden.");
      setListLoading(false);
      return;
    }

    setRows(
      (data ?? [])
        .filter((z) => z.rollen && z.rollen.length > 0)
        .map((z) => {
          const refs: (string | number)[] = z.eingeteilte_users ?? [];
          return {
            id: z.id,
            label: z.zeitbereich ?? "",
            roleRef: z.rollen,
            kommen: refs.length,
            benoetigt: z.ben ?? 0,
            names: refs.map((ref) => resolveMemberName(loadedMembers, ref)).sort((a, b) => a.localeCompare(b, "de")),
          };
        })
    );
    setListLoading(false);
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

  return (
    <main className="min-h-screen bg-background pb-32">
      <div className="relative bg-brand-blue px-4 py-6 text-center">
        <Link
          href={`/activities/${activityId}`}
          aria-label="Zurück zur Activity"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="font-heading text-2xl font-bold text-white">{activityName}</h1>
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-6">
        {listError && (
          <Alert variant="destructive">
            <AlertDescription>{listError}</AlertDescription>
          </Alert>
        )}

        {!listLoading && rows.length === 0 && !listError && (
          <p className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
            Für diese Activity sind noch keine Zeitbereiche mit Bedarf hinterlegt.
          </p>
        )}

        {rows.length > 0 && (
          <div className="grid grid-cols-[1fr_3rem_3rem_3rem_2rem] items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Zeitbereich</span>
            <span className="text-center">kommen</span>
            <span className="text-center">insg.</span>
            <span className="text-center">offen</span>
            <span />
          </div>
        )}

        <ul className="flex flex-col gap-2">
          {rows.map((row) => {
            const status = computeSignupStatus(row.kommen, row.benoetigt);
            const icon = SIGNUP_STATUS_ICON[status];
            return (
              <li key={row.id} className="flex flex-col gap-2 rounded-lg border bg-card p-3 shadow-sm">
                <div className="grid grid-cols-[1fr_3rem_3rem_3rem_2rem] items-center gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{row.label}</p>
                    <p className="truncate text-xs text-muted-foreground">{resolveRoleName(roles, row.roleRef)}</p>
                  </div>
                  <span className="text-center text-sm text-foreground">{row.kommen}</span>
                  <span className="text-center text-sm text-foreground">{row.benoetigt}</span>
                  <span className="text-center text-sm text-foreground">{row.benoetigt - row.kommen}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={icon.src} alt={icon.alt} className="h-6 w-6 justify-self-center object-contain" />
                </div>
                {row.names.length > 0 && (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 border-t pt-2 text-sm text-foreground">
                    {row.names.map((name, i) => (
                      <span key={i} className="truncate">
                        {name}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <Button asChild variant="outline" className="h-12 w-full font-semibold uppercase tracking-wide">
          <Link href={`/activities/${activityId}`}>Zurück zur Anmeldung</Link>
        </Button>
      </div>
    </main>
  );
}
