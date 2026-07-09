import { test, expect } from "@playwright/test";

// Note: criteria that require a logged-in admin with a real Verein (prefilled
// form, save flow, freischaltcode confirmation dialog, cross-tenant RLS,
// logo upload) were verified manually against the live Supabase project with
// isolated, disposable test data during /qa (see QA Test Results in
// features/PROJ-4-verein-verwaltung.md) rather than automated here. There is
// still no seeded test-data fixture strategy (see PROJ-3's spec for the same
// note — that belongs to PROJ-1), so automating those durably here would
// either rely on data QA deletes after each run or on real club data —
// neither is a stable long-term fixture.

test.describe("PROJ-4 Verein-Verwaltung & Voreinstellungen", () => {
  test("AC: unauthenticated access to /voreinstellung redirects to /", async ({ page }) => {
    await page.goto("/voreinstellung");
    await expect(page).toHaveURL("/");
  });
});
