import { test, expect } from "@playwright/test";

// Note: criteria that require logged-in accounts with real Vereine/Activities/
// Zeitbereiche (eigene Zusagen anzeigen, Gruppierung nach Activity, Kommend/
// Vergangen-Toggle, Status-Icons, Stub-Filterung, Admin-Sicht, Cross-Tenant-
// Isolation, XSS, Leerzustände, Responsive/Cross-Browser) were verified via a
// scripted Playwright run against the live Supabase project with isolated,
// disposable test data during /qa (see QA Test Results in
// features/PROJ-16-meine-einteilungen.md) rather than automated here — same
// rationale as PROJ-3/4/5/6/7/10/11/12/13/15 (no seeded test-data fixture
// strategy yet, see PROJ-1).

test.describe("PROJ-16 Meine Einteilungen", () => {
  test("AC: unauthenticated access to /meine-einteilungen redirects to /", async ({ page }) => {
    await page.goto("/meine-einteilungen");
    await expect(page).toHaveURL("/");
  });
});
