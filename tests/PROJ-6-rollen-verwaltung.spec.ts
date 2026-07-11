import { test, expect } from "@playwright/test";

// Note: criteria that require a logged-in admin with a real Verein (list,
// create/edit/delete, duplicate-name validation, "Automatisch angemeldet"
// flag, delete-usage guard, cross-tenant RLS) were verified manually against
// the live Supabase project with isolated, disposable test data during /qa
// (see QA Test Results in features/PROJ-6-rollen-verwaltung.md) rather than
// automated here — same rationale as PROJ-3/4/5 (no seeded test-data
// fixture strategy yet, see PROJ-1).

test.describe("PROJ-6 Rollen-Verwaltung", () => {
  test("AC: unauthenticated access to /rollen redirects to /", async ({ page }) => {
    await page.goto("/rollen");
    await expect(page).toHaveURL("/");
  });
});
