"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  computeSignupStatus,
  SIGNUP_STATUS_ICON,
  formatActivityDateTime,
  startOfTodayIso,
} from "@/lib/activities";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

type ActivityInfo = {
  id: number;
  adalo_id: number | null;
  name: string | null;
  du_z: string | null;
  du_zbis: string | null;
};

type ZeitbereichEntry = {
  id: number;
  label: string;
  kommen: number;
  benoetigt: number;
};

type ActivityGroup = {
  activityId: number;
  name: string;
  du_z: string | null;
  du_zbis: string | null;
  zeitbereiche: ZeitbereichEntry[];
};

function findActivity(activities: ActivityInfo[], ref: string | number): ActivityInfo | undefined {
  return activities.find(
    (a) => String(a.id) === String(ref) || (a.adalo_id != null && String(a.adalo_id) === String(ref))
  );
}

export default function MeineEinteilungenPage() {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [vereinId, setVereinId] = useState<number | null>(null);

  const [groups, setGroups] = useState<ActivityGroup[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [view, setView] = useState<"kommend" | "vergangen">("kommend");

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
        .select("id, adalo_id, verein")
        .eq("auth_user_id", session.user.id)
        .maybeSingle();

      if (!active) return;

      setAllowed(true);
      setChecking(false);
      setVereinId(userRow?.verein?.[0] ?? null);

      if (userRow?.verein?.[0]) {
        void loadData(userRow.id, userRow.adalo_id);
      } else {
        setListLoading(false);
      }
    }

    async function loadData(ownId: number, ownAdaloId: number | null) {
      setListLoading(true);
      setListError(null);

      const { data: activityData, error: activityError } = await supabase
        .from("activities")
        .select("id, adalo_id, name, du_z, du_zbis");

      if (!active) return;

      if (activityError) {
        setListError("Deine Einteilungen konnten nicht geladen werden.");
        setListLoading(false);
        return;
      }

      const activities: ActivityInfo[] = activityData ?? [];

      const ownFilters = [`eingeteilte_users.cs.{${ownId}}`];
      if (ownAdaloId != null) {
        ownFilters.push(`eingeteilte_users.cs.{${ownAdaloId}}`);
      }

      const { data: einstellungenData, error: einstellungenError } = await supabase
        .from("einstellungen")
        .select("id, zeitbereich, ben, rollen, activity, eingeteilte_users")
        .or(ownFilters.join(","))
        .gt("ben", 0)
        .order("id", { ascending: true });

      if (!active) return;

      if (einstellungenError) {
        setListError("Deine Einteilungen konnten nicht geladen werden.");
        setListLoading(false);
        return;
      }

      const byActivity = new Map<number, ActivityGroup>();

      for (const row of einstellungenData ?? []) {
        if (!row.rollen || row.rollen.length === 0) continue;

        const activityRef = row.activity?.[0];
        const activity = activityRef != null ? findActivity(activities, activityRef) : undefined;
        if (!activity) continue;

        if (!byActivity.has(activity.id)) {
          byActivity.set(activity.id, {
            activityId: activity.id,
            name: activity.name ?? "",
            du_z: activity.du_z,
            du_zbis: activity.du_zbis,
            zeitbereiche: [],
          });
        }

        byActivity.get(activity.id)!.zeitbereiche.push({
          id: row.id,
          label: row.zeitbereich ?? "",
          kommen: (row.eingeteilte_users ?? []).length,
          benoetigt: row.ben ?? 0,
        });
      }

      setGroups(Array.from(byActivity.values()));
      setListLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const today = startOfTodayIso();

  const kommend = groups
    .filter((g) => g.du_zbis && g.du_zbis >= today)
    .sort((a, b) => (a.du_zbis ?? "").localeCompare(b.du_zbis ?? ""));

  const vergangen = groups
    .filter((g) => !g.du_zbis || g.du_zbis < today)
    .sort((a, b) => (b.du_zbis ?? "").localeCompare(a.du_zbis ?? ""));

  const visibleGroups = view === "kommend" ? kommend : vergangen;

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
            href="/activities"
            aria-label="Zurück zu Activities"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="font-heading text-[21px] font-medium text-white">Meine Einteilungen</h1>
        </div>

        <div className="flex w-full flex-1 flex-col gap-4 border border-gray-400 bg-gray-100 px-4 py-6">
          {!vereinId && (
            <p className="text-sm text-muted-foreground">Kein Verein zugeordnet.</p>
          )}

          {vereinId && (
            <>
              <Button
                onClick={() => setView((v) => (v === "kommend" ? "vergangen" : "kommend"))}
                className="h-12 w-full shadow-[0_2px_4px_rgba(0,0,0,0.3)] gap-2 bg-brand-blue font-semibold uppercase tracking-wide text-white hover:bg-brand-blue/90"
              >
                {view === "kommend" ? "Vergangene anzeigen" : "Kommende anzeigen"}
              </Button>

              {listError && (
                <Alert variant="destructive">
                  <AlertDescription>{listError}</AlertDescription>
                </Alert>
              )}

              {!listLoading && !listError && visibleGroups.length === 0 && (
                <p className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                  {view === "kommend"
                    ? "Du hast noch keine kommenden Einteilungen."
                    : "Du hast noch keine vergangenen Einteilungen."}
                </p>
              )}

              <div className="flex flex-col gap-3">
                {visibleGroups.map((group) => (
                  <Link
                    key={group.activityId}
                    href={`/activities/${group.activityId}`}
                    className="flex flex-col gap-2 rounded-lg border bg-card p-3 shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{group.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{formatActivityDateTime(group.du_z)}</p>
                    </div>

                    <div className="flex flex-col gap-1 border-t pt-2">
                      {group.zeitbereiche.map((z) => {
                        const status = computeSignupStatus(z.kommen, z.benoetigt);
                        const icon = SIGNUP_STATUS_ICON[status];
                        return (
                          <div key={z.id} className="flex items-center justify-between gap-2 text-sm text-foreground">
                            <span className="truncate">{z.label}</span>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={icon.src} alt={icon.alt} className="h-5 w-5 shrink-0 object-contain" />
                          </div>
                        );
                      })}
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

          <Button asChild variant="outline" className="h-12 w-full shadow-[0_2px_4px_rgba(0,0,0,0.3)] font-semibold uppercase tracking-wide">
            <Link href="/profil">Zurück</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
