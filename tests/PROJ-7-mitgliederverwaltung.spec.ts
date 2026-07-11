import { test, expect } from "@playwright/test";

// Note: criteria that require a logged-in admin/SU with real Vereine (list,
// search/filter, create/edit, letzter-Admin-Schutz, SU-Verein-Switcher,
// cross-tenant RLS) were verified via a scripted Playwright run against the
// live Supabase project with isolated, disposable test data during /qa (see
// QA Test Results in features/PROJ-7-mitgliederverwaltung.md) rather than
// automated here — same rationale as PROJ-3/4/5/6 (no seeded test-data
// fixture strategy yet, see PROJ-1).

test.describe("PROJ-7 Mitgliederverwaltung", () => {
  test("AC: unauthenticated access to /mitglieder redirects to /", async ({ page }) => {
    await page.goto("/mitglieder");
    await expect(page).toHaveURL("/");
  });
});
