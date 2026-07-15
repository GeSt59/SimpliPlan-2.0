export type ActivityCategory = {
  id: number;
  adalo_id: number | null;
  name: string | null;
  picture_url: string | null;
};

export type ZeitbereichRole = {
  id: number;
  adalo_id: number | null;
  name: string | null;
};

function findCategory(
  categories: ActivityCategory[],
  categoryRefs: (string | number)[] | null
): ActivityCategory | undefined {
  if (!categoryRefs || categoryRefs.length === 0) return undefined;
  const ref = String(categoryRefs[0]);
  return categories.find(
    (c) => String(c.id) === ref || (c.adalo_id != null && String(c.adalo_id) === ref)
  );
}

export function resolveCategoryName(
  categories: ActivityCategory[],
  categoryRefs: (string | number)[] | null
): string {
  return findCategory(categories, categoryRefs)?.name ?? "Keine Kategorie";
}

export function resolveCategoryPicture(
  categories: ActivityCategory[],
  categoryRefs: (string | number)[] | null
): string | null {
  return findCategory(categories, categoryRefs)?.picture_url ?? null;
}

/** Findet die Rolle zu einem einstellungen.rollen-Wert, egal ob dieser die Supabase-id oder die Adalo-adalo_id referenziert. */
export function findRole(
  roles: ZeitbereichRole[],
  roleRefs: (string | number)[] | null
): ZeitbereichRole | undefined {
  if (!roleRefs || roleRefs.length === 0) return undefined;
  const ref = String(roleRefs[0]);
  return roles.find(
    (r) => String(r.id) === ref || (r.adalo_id != null && String(r.adalo_id) === ref)
  );
}

export function resolveRoleName(
  roles: ZeitbereichRole[],
  roleRefs: (string | number)[] | null
): string {
  return findRole(roles, roleRefs)?.name ?? "Keine Rolle";
}

/**
 * Native <input type="time"> akzeptiert nur 00:00-23:59 und rendert alles andere (z.B. "24:00",
 * wie es die Zeitbereich-Konvention aus dem Mitternachts-Slot nahelegt) unsichtbar als leer -
 * ohne Normalisierung würde ein ungeprüftes Speichern diesen Wert dadurch stillschweigend
 * auf einen leeren String zurücksetzen. "24:00" und "00:00" bezeichnen denselben Zeitpunkt.
 */
export function normalizeTimeValue(value: string | null): string {
  if (!value) return "";
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return value;
  const hours = Number(match[1]) % 24;
  return `${String(hours).padStart(2, "0")}:${match[2]}`;
}

/** Standard-Zeitbereiche, die beim Anlegen einer neuen Activity automatisch erzeugt werden: stündlich von 8-9 bis 24-01 Uhr (17 Slots). */
export function buildDefaultZeitbereichSlots(): { label: string; von: string; bis: string }[] {
  const slots: { label: string; von: string; bis: string }[] = [];

  for (let hour = 8; hour < 24; hour++) {
    const nextHour = hour + 1;
    slots.push({
      label: `${hour}-${nextHour}`,
      von: `${String(hour).padStart(2, "0")}:00`,
      bis: nextHour === 24 ? "00:00" : `${String(nextHour).padStart(2, "0")}:00`,
    });
  }

  slots.push({ label: "24-01", von: "00:00", bis: "01:00" });

  return slots;
}

export function startOfTodayIso(): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

const WEEKDAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

function datePart(d: Date): string {
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
}

function timePart(d: Date): string {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** Einzelner Zeitpunkt, z.B. "Fr, 26.6.2026 19:00 Uhr" (wie in der Adalo-Vorlage) */
export function formatActivityDateTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${datePart(d)} ${timePart(d)} Uhr`;
}

/** Zeitspanne für die Detailansicht, z.B. "Fr, 26.6.2026 19:00–21:59 Uhr" */
export function formatActivityRange(startIso: string | null, endIso: string | null): string {
  if (!startIso) return "";

  const start = new Date(startIso);
  if (!endIso) return `${datePart(start)} ${timePart(start)} Uhr`;

  const end = new Date(endIso);

  if (datePart(start) === datePart(end)) {
    return `${datePart(start)} ${timePart(start)}–${timePart(end)} Uhr`;
  }

  return `${datePart(start)} ${timePart(start)} Uhr – ${datePart(end)} ${timePart(end)} Uhr`;
}
