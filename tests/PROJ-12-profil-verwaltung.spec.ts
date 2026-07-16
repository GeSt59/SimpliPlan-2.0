import { test, expect } from "@playwright/test";

// Note: criteria that require a logged-in member with a real users-Zeile
// (profile view, edit dialog, email-change flow, password change, picture
// upload, cross-tenant/self-promotion security checks) were verified via a
// scripted Playwright run against the live Supabase project with isolated,
// disposable test data during /qa (see QA Test Results in
// features/PROJ-12-profil-verwaltung.md) rather than automated here — same
// rationale as PROJ-3/4/5/6/7/10/11 (no seeded test-data fixture strategy
// yet, see PROJ-1).

test.describe("PROJ-12 Profil-Verwaltung", () => {
  test("AC: unauthenticated access to /profil redirects to /", async ({ page }) => {
    await page.goto("/profil");
    await expect(page).toHaveURL("/");
  });
});
