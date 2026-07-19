"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Printer, Trash2, UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  resolveRoleName,
  resolveMemberName,
  resolveMemberId,
  isMemberInRefs,
  computeSignupStatus,
  normalizeTimeValue,
  SIGNUP_STATUS_ICON,
} from "@/lib/activities";
import type { ZeitbereichRole, Member } from "@/lib/activities";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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

type Signup = { ref: string | number; name: string; memberId: number | null };

type UebersichtRow = {
  id: number;
  label: string;
  von: string;
  bis: string;
  roleRef: (string | number)[] | null;
  benoetigt: number;
  signups: Signup[];
  saving: boolean;
  error: string | null;
};

type RemoveTarget = { rowId: number; memberId: number; name: string };

export default function ActivityUebersichtPage() {
  const params = useParams<{ id: string }>();
  const activityId = Number(params.id);

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [vereinId, setVereinId] = useState<number | null>(null);

  const [activityName, setActivityName] = useState<string>("");
  const [notFound, setNotFound] = useState(false);

  const [roles, setRoles] = useState<ZeitbereichRole[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [rows, setRows] = useState<UebersichtRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [addDialogRowId, setAddDialogRowId] = useState<number | null>(null);
  const [removeTarget, setRemoveTarget] = useState<RemoveTarget | null>(null);
  const [removeSaving, setRemoveSaving] = useState(false);

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

      const vId = userRow?.verein?.[0];

      if (!vId) {
        window.location.href = "/";
        return;
      }

      setVereinId(vId);
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
      supabase.from("mitglieder_namen").select("id, adalo_id, vorname, nachname").contains("verein", [vId]),
    ]);
    const loadedMembers: Member[] = memberData ?? [];
    setRoles(roleData ?? []);
    setMembers(loadedMembers);

    const activityFilters = [`activity.cs.{${activity.id}}`];
    if (activity.adalo_id != null) {
      activityFilters.push(`activity.cs.{${activity.adalo_id}}`);
    }

    const { data, error } = await supabase
      .from("einstellungen")
      .select("id, zeitbereich, ben, rollen, von, bis, eingeteilte_users")
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
            von: normalizeTimeValue(z.von),
            bis: normalizeTimeValue(z.bis),
            roleRef: z.rollen,
            benoetigt: z.ben ?? 0,
            signups: refs
              .map((ref) => ({
                ref,
                name: resolveMemberName(loadedMembers, ref),
                memberId: resolveMemberId(loadedMembers, ref),
              }))
              .sort((a, b) => a.name.localeCompare(b.name, "de")),
            saving: false,
            error: null,
          };
        })
    );
    setListLoading(false);
  }

  function updateRow(rowId: number, patch: Partial<UebersichtRow>) {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, ...patch } : r)));
  }

  async function callTeilnehmerEndpoint(zeitbereichId: number, action: "hinzufuegen" | "entfernen", mitgliedId: number) {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    return fetch(`/api/einstellungen/${zeitbereichId}/teilnehmer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action, mitgliedId }),
    });
  }

  async function handleAdd(rowId: number, member: Member) {
    updateRow(rowId, { saving: true, error: null });

    try {
      const res = await callTeilnehmerEndpoint(rowId, "hinzufuegen", member.id);
      if (!res.ok) {
        updateRow(rowId, { saving: false, error: "Hinzufügen fehlgeschlagen. Bitte versuche es erneut." });
        return;
      }
      setAddDialogRowId(null);
      if (vereinId) await loadData(vereinId);
    } catch {
      updateRow(rowId, { saving: false, error: "Server nicht erreichbar. Bitte versuche es später erneut." });
    }
  }

  async function confirmRemove() {
    if (!removeTarget) return;
    setRemoveSaving(true);
    updateRow(removeTarget.rowId, { error: null });

    try {
      const res = await callTeilnehmerEndpoint(removeTarget.rowId, "entfernen", removeTarget.memberId);
      if (!res.ok) {
        updateRow(removeTarget.rowId, { error: "Entfernen fehlgeschlagen. Bitte versuche es erneut." });
        setRemoveSaving(false);
        return;
      }
      setRemoveTarget(null);
      setRemoveSaving(false);
      if (vereinId) await loadData(vereinId);
    } catch {
      updateRow(removeTarget.rowId, { error: "Server nicht erreichbar. Bitte versuche es später erneut." });
      setRemoveSaving(false);
    }
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

  const addDialogRow = rows.find((r) => r.id === addDialogRowId) ?? null;
  const availableMembers = addDialogRow
    ? members
        .filter((m) => !isMemberInRefs(m, addDialogRow.signups.map((s) => s.ref)))
        .sort((a, b) => (a.nachname ?? "").localeCompare(b.nachname ?? "", "de"))
    : [];

  return (
    <main className="flex min-h-screen justify-center bg-background">
      <div className="flex w-full max-w-[600px] flex-col pb-16">
        <div className="relative bg-brand-blue px-4 py-3 text-center">
          <Link
            href={`/activities/${activityId}`}
            aria-label="Zurück zur Activity"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white print:hidden"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="font-heading text-[21px] font-medium text-white">{activityName}</h1>
          {isAdmin && (
            <button
              type="button"
              aria-label="Drucken"
              onClick={() => window.print()}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white print:hidden"
            >
              <Printer className="h-6 w-6" />
            </button>
          )}
        </div>

        <div className="flex w-full flex-1 flex-col gap-4 border border-gray-400 bg-gray-100 px-4 py-6">
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
              const kommen = row.signups.length;
              const status = computeSignupStatus(kommen, row.benoetigt);
              const icon = SIGNUP_STATUS_ICON[status];
              return (
                <li key={row.id} className="flex flex-col gap-2 rounded-lg border bg-card p-3 shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                  <div className="grid grid-cols-[1fr_3rem_3rem_3rem_2rem] items-center gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {row.label}
                        {row.von && row.bis && (
                          <span className="font-normal text-muted-foreground"> · {row.von}–{row.bis} Uhr</span>
                        )}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{resolveRoleName(roles, row.roleRef)}</p>
                    </div>
                    <span className="text-center text-sm text-foreground">{kommen}</span>
                    <span className="text-center text-sm text-foreground">{row.benoetigt}</span>
                    <span className="text-center text-sm text-foreground">{row.benoetigt - kommen}</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={icon.src} alt={icon.alt} className="h-6 w-6 justify-self-center object-contain print:hidden" />
                  </div>

                  {row.signups.length > 0 && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 border-t pt-2 text-sm text-foreground">
                      {row.signups.map((s) => (
                        <div key={String(s.ref)} className="flex min-w-0 items-center gap-1">
                          <span className="truncate">{s.name}</span>
                          {isAdmin && s.memberId != null && (
                            <button
                              type="button"
                              aria-label={`${s.name} entfernen`}
                              onClick={() => setRemoveTarget({ rowId: row.id, memberId: s.memberId!, name: s.name })}
                              className="shrink-0 text-brand-gold hover:opacity-80 print:hidden"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setAddDialogRowId(row.id)}
                      disabled={row.saving}
                      className="flex items-center justify-center gap-2 rounded-md border border-dashed py-2 text-sm font-medium text-brand-blue hover:bg-muted disabled:opacity-50 print:hidden"
                    >
                      <UserPlus className="h-4 w-4" />
                      Mitglied hinzufügen
                    </button>
                  )}

                  {row.error && <p className="text-sm text-destructive print:hidden">{row.error}</p>}
                </li>
              );
            })}
          </ul>

          <Button asChild variant="outline" className="h-12 w-full shadow-[0_2px_4px_rgba(0,0,0,0.3)] font-semibold uppercase tracking-wide print:hidden">
            <Link href={`/activities/${activityId}`}>Zurück zur Anmeldung</Link>
          </Button>
        </div>
      </div>

      <CommandDialog open={addDialogRowId !== null} onOpenChange={(open) => !open && setAddDialogRowId(null)}>
        <CommandInput placeholder="Mitglied suchen..." />
        <CommandList>
          <CommandEmpty>Alle Mitglieder sind bereits zugesagt.</CommandEmpty>
          <CommandGroup>
            {availableMembers.map((m) => (
              <CommandItem
                key={m.id}
                value={resolveMemberName(members, m.id)}
                onSelect={() => addDialogRowId != null && void handleAdd(addDialogRowId, m)}
              >
                {resolveMemberName(members, m.id)}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mitglied entfernen?</AlertDialogTitle>
            <AlertDialogDescription>
              „{removeTarget?.name}" wird aus diesem Zeitbereich entfernt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction disabled={removeSaving} onClick={() => void confirmRemove()}>
              {removeSaving ? "Wird entfernt..." : "Entfernen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
