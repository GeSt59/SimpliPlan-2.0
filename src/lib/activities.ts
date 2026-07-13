export type ActivityCategory = {
  id: number;
  adalo_id: number | null;
  name: string | null;
  picture_url: string | null;
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
