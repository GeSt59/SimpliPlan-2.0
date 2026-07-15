import { describe, expect, it } from "vitest";
import {
  resolveCategoryName,
  resolveCategoryPicture,
  formatActivityDateTime,
  formatActivityRange,
  findRole,
  resolveRoleName,
  buildDefaultZeitbereichSlots,
  normalizeTimeValue,
  resolveMemberName,
  resolveMemberId,
  isMemberInRefs,
  computeSignupStatus,
} from "./activities";
import type { ActivityCategory, ZeitbereichRole, Member } from "./activities";

const categories: ActivityCategory[] = [
  { id: 1, adalo_id: null, name: "Stammtisch", picture_url: "https://example.com/stammtisch.jpg" },
  { id: 2, adalo_id: 8, name: "Clubabend", picture_url: null },
];

describe("resolveCategoryName", () => {
  it("resolves by Supabase id (new categories)", () => {
    expect(resolveCategoryName(categories, [1])).toBe("Stammtisch");
  });

  it("falls back to adalo_id (legacy migrated activities)", () => {
    expect(resolveCategoryName(categories, ["8"])).toBe("Clubabend");
  });

  it("returns a placeholder when no category is set", () => {
    expect(resolveCategoryName(categories, null)).toBe("Keine Kategorie");
    expect(resolveCategoryName(categories, [])).toBe("Keine Kategorie");
  });

  it("returns the same placeholder when the referenced category no longer exists", () => {
    expect(resolveCategoryName(categories, [999])).toBe("Keine Kategorie");
  });
});

describe("resolveCategoryPicture", () => {
  it("resolves the picture_url by id", () => {
    expect(resolveCategoryPicture(categories, [1])).toBe("https://example.com/stammtisch.jpg");
  });

  it("returns null when the category has no picture", () => {
    expect(resolveCategoryPicture(categories, ["8"])).toBeNull();
  });

  it("returns null when no category is set", () => {
    expect(resolveCategoryPicture(categories, null)).toBeNull();
  });
});

// Dates are built via local-time constructors (not hardcoded UTC offsets) so
// these tests pass regardless of the machine/CI runner's timezone, since
// formatActivityDateTime/-Range render using local Date getters.

describe("formatActivityDateTime", () => {
  it("formats a single timestamp as weekday, date and time", () => {
    // 2026-06-26 is a Friday
    const start = new Date(2026, 5, 26, 17, 0).toISOString();
    expect(formatActivityDateTime(start)).toBe("Fr, 26.6.2026 17:00 Uhr");
  });

  it("returns an empty string for null", () => {
    expect(formatActivityDateTime(null)).toBe("");
  });
});

describe("formatActivityRange", () => {
  it("collapses same-day ranges into a single date with a time span", () => {
    const start = new Date(2026, 5, 26, 17, 0).toISOString();
    const end = new Date(2026, 5, 26, 21, 59).toISOString();
    expect(formatActivityRange(start, end)).toBe("Fr, 26.6.2026 17:00–21:59 Uhr");
  });

  it("shows both dates for multi-day ranges", () => {
    const start = new Date(2026, 5, 26, 20, 0).toISOString();
    const end = new Date(2026, 5, 27, 9, 0).toISOString();
    expect(formatActivityRange(start, end)).toBe("Fr, 26.6.2026 20:00 Uhr – Sa, 27.6.2026 09:00 Uhr");
  });

  it("returns an empty string when there is no start", () => {
    const end = new Date(2026, 5, 26, 21, 59).toISOString();
    expect(formatActivityRange(null, end)).toBe("");
  });
});

const roles: ZeitbereichRole[] = [
  { id: 40, adalo_id: 95, name: "Mitglieder" },
  { id: 41, adalo_id: null, name: "Begleitung" },
];

describe("findRole / resolveRoleName", () => {
  it("resolves by Supabase id (newly created Zeitbereiche)", () => {
    expect(resolveRoleName(roles, [41])).toBe("Begleitung");
  });

  it("falls back to adalo_id (legacy migrated Zeitbereiche)", () => {
    expect(resolveRoleName(roles, ["95"])).toBe("Mitglieder");
  });

  it("returns a placeholder when no role is set", () => {
    expect(resolveRoleName(roles, null)).toBe("Keine Rolle");
    expect(resolveRoleName(roles, [])).toBe("Keine Rolle");
  });

  it("returns the same placeholder when the referenced role no longer exists", () => {
    expect(resolveRoleName(roles, [999])).toBe("Keine Rolle");
  });

  it("findRole returns the full role object (needed to resolve its current Supabase id for the Select value)", () => {
    expect(findRole(roles, ["95"])?.id).toBe(40);
  });
});

describe("buildDefaultZeitbereichSlots", () => {
  const slots = buildDefaultZeitbereichSlots();

  it("returns exactly 17 slots (16 hourly slots 8-9..23-24, plus the midnight slot 24-01)", () => {
    expect(slots).toHaveLength(17);
  });

  it("starts at 8-9 with von=08:00/bis=09:00", () => {
    expect(slots[0]).toEqual({ label: "8-9", von: "08:00", bis: "09:00" });
  });

  it("ends at 24-01 with von=00:00/bis=01:00 (midnight, native <input type=time> can't hold '24:00')", () => {
    expect(slots[16]).toEqual({ label: "24-01", von: "00:00", bis: "01:00" });
  });

  it("the 23-24 slot's bis is normalized to 00:00, not the invalid '24:00'", () => {
    expect(slots[15]).toEqual({ label: "23-24", von: "23:00", bis: "00:00" });
  });

  it("labels are sequential and unique", () => {
    const labels = slots.map((s) => s.label);
    expect(new Set(labels).size).toBe(17);
  });
});

describe("normalizeTimeValue", () => {
  it("passes through normal HH:MM values unchanged", () => {
    expect(normalizeTimeValue("18:00")).toBe("18:00");
    expect(normalizeTimeValue("09:30")).toBe("09:30");
  });

  it("normalizes '24:00' to '00:00' (native <input type=time> rejects '24:00' as invalid)", () => {
    expect(normalizeTimeValue("24:00")).toBe("00:00");
  });

  it("returns an empty string for null/empty input", () => {
    expect(normalizeTimeValue(null)).toBe("");
    expect(normalizeTimeValue("")).toBe("");
  });

  it("leaves non-time strings untouched instead of throwing", () => {
    expect(normalizeTimeValue("nicht eine Uhrzeit")).toBe("nicht eine Uhrzeit");
  });
});

const members: Member[] = [
  { id: 10, adalo_id: 555, vorname: "Wolfgang", nachname: "Almhofer" },
  { id: 11, adalo_id: null, nachname: "Grubelnik", vorname: "Peter" },
];

describe("resolveMemberName", () => {
  it("resolves by Supabase id (own signups going forward)", () => {
    expect(resolveMemberName(members, 11)).toBe("Grubelnik Peter");
  });

  it("falls back to adalo_id (legacy eingeteilte_users entries)", () => {
    expect(resolveMemberName(members, "555")).toBe("Almhofer Wolfgang");
  });

  it("returns a placeholder when the referenced member is unknown", () => {
    expect(resolveMemberName(members, 999)).toBe("Unbekannt");
  });

  it("returns the placeholder instead of a blank string when both names are empty", () => {
    const blank: Member[] = [{ id: 1, adalo_id: null, vorname: "", nachname: "" }];
    expect(resolveMemberName(blank, 1)).toBe("Unbekannt");
  });
});

describe("resolveMemberId", () => {
  it("resolves the true Supabase id by id", () => {
    expect(resolveMemberId(members, 11)).toBe(11);
  });

  it("resolves the true Supabase id via the legacy adalo_id fallback (PROJ-11 admin endpoint needs the real id)", () => {
    expect(resolveMemberId(members, "555")).toBe(10);
  });

  it("returns null when the referenced member is unknown", () => {
    expect(resolveMemberId(members, 999)).toBeNull();
  });
});

describe("isMemberInRefs", () => {
  it("returns true when the member's id is in the refs", () => {
    expect(isMemberInRefs(members[1], [11, 999])).toBe(true);
  });

  it("returns true when the member's adalo_id is in the refs (legacy entries)", () => {
    expect(isMemberInRefs(members[0], ["555"])).toBe(true);
  });

  it("returns false when neither id nor adalo_id is in the refs", () => {
    expect(isMemberInRefs(members[1], [999])).toBe(false);
  });

  it("returns false for an empty refs list", () => {
    expect(isMemberInRefs(members[0], [])).toBe(false);
  });
});

describe("computeSignupStatus", () => {
  it("returns zu_wenig when fewer members signed up than needed", () => {
    expect(computeSignupStatus(1, 5)).toBe("zu_wenig");
  });

  it("returns genau_richtig when the count matches exactly", () => {
    expect(computeSignupStatus(5, 5)).toBe("genau_richtig");
  });

  it("returns zu_viel when more members signed up than needed", () => {
    expect(computeSignupStatus(8, 5)).toBe("zu_viel");
  });

  it("treats 0 needed / 0 signed up as genau_richtig, not zu_wenig", () => {
    expect(computeSignupStatus(0, 0)).toBe("genau_richtig");
  });
});
