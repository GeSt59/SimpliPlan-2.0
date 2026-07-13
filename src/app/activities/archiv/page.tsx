"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { List } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { resolveCategoryPicture, formatActivityDateTime, startOfTodayIso } from "@/lib/activities";
import type { ActivityCategory } from "@/lib/activities";
import type { ActivityRecord } from "@/components/activity-form-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ACTIVITY_COLUMNS = "id, name, category, du_z, du_zbis, ort, beschreibung, einteilungens";

export default function ActivitiesArchivPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [vereinId, setVereinId] = useState<number | null>(null);

  const [categories, setCategories] = useState<ActivityCategory[]>([]);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [search, setSearch] = useState("");

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
    void loadCategories(vereinId);
    void loadActivities(vereinId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vereinId]);

  async function loadCategories(vId: number) {
    const { data } = await supabase
      .from("categories")
      .select("id, adalo_id, name, picture_url")
      .contains("vereine", [vId])
      .order("name", { ascending: true });

    setCategories(data ?? []);
  }

  async function loadActivities(vId: number) {
    setListLoading(true);
    setListError(null);

    const { data, error } = await supabase
      .from("activities")
      .select(ACTIVITY_COLUMNS)
      .contains("vereine", [vId])
      .lt("du_zbis", startOfTodayIso())
      .order("du_zbis", { ascending: false });

    if (error) {
      setListError("Activities konnten nicht geladen werden.");
      setListLoading(false);
      return;
    }

    setActivities(data ?? []);
    setListLoading(false);
  }

  const filteredActivities = activities.filter((a) => {
    if (!search.trim()) return true;
    const term = search.trim().toLowerCase();
    const haystack = `${a.name ?? ""} ${a.ort ?? ""} ${a.beschreibung ?? ""}`.toLowerCase();
    return haystack.includes(term);
  });

  if (checking) {
    return <main className="min-h-screen bg-background" />;
  }

  if (!allowed) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background pb-16">
      <div className="bg-brand-blue px-4 py-6 text-center">
        <h1 className="font-heading text-2xl font-bold text-white">Activities-Archiv</h1>
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6">
        <Input
          placeholder="Suche nach Titel, Ort oder Beschreibung..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {listError && (
          <Alert variant="destructive">
            <AlertDescription>{listError}</AlertDescription>
          </Alert>
        )}

        {!listLoading && !listError && activities.length === 0 && (
          <p className="text-sm text-muted-foreground">Noch keine vergangenen Activities vorhanden.</p>
        )}

        {!listLoading && activities.length > 0 && filteredActivities.length === 0 && (
          <p className="text-sm text-muted-foreground">Keine Activities gefunden.</p>
        )}

        {!listLoading && filteredActivities.length > 0 && (
          <ul className="flex flex-col gap-3">
            {filteredActivities.map((a) => {
              const pictureUrl = resolveCategoryPicture(categories, a.category);
              return (
                <li key={a.id} className="flex items-stretch gap-3 rounded-lg border bg-card p-3 shadow-sm">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                    {pictureUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={pictureUrl} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                    <span className="min-w-0 truncate border-b border-brand-blue text-base font-medium text-brand-blue">
                      {a.name}
                    </span>
                    <span className="text-sm text-foreground">{formatActivityDateTime(a.du_z)}</span>
                    <span className="truncate text-sm text-muted-foreground">{a.ort}</span>
                  </div>

                  <div className="flex shrink-0 items-center justify-center">
                    <button
                      type="button"
                      aria-label="Zu Zeitbereichen"
                      onClick={() => router.push(`/activities/${a.id}`)}
                      className="text-brand-blue hover:opacity-80"
                    >
                      <List className="h-5 w-5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <Button asChild variant="outline" className="h-12 w-full font-semibold uppercase tracking-wide">
          <Link href="/activities">Zurück zu Activities</Link>
        </Button>
      </div>
    </main>
  );
}
