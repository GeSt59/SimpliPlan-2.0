import { describe, expect, it } from "vitest";
import {
  resolveCategoryName,
  resolveCategoryPicture,
  formatActivityDateTime,
  formatActivityRange,
} from "./activities";
import type { ActivityCategory } from "./activities";

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
