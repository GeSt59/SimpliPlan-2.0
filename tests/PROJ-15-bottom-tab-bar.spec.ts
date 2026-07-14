import { test, expect } from "@playwright/test";

// Note: criteria that require logged-in accounts with real Rollen (Admin/
// Mitglied/SU tab visibility, individuelle tab1-5-Labels, aktiver Tab,
// lesender Mitglieder-Zugriff, "Activity"-Auto-Open, "Rollen verwalten"-Link,
// Cross-Tenant-Isolation, XSS, responsive) were verified via a scripted
// Playwright run against the live Supabase project with isolated, disposable
// test data during /qa (see QA Test Results in
// features/PROJ-15-bottom-tab-bar.md) rather than automated here — same
// rationale as PROJ-3/4/5/6/7/8 (no seeded test-data fixture strategy yet,
// see PROJ-1). That run also uncovered BUG-1 (Critical, open): SU-only
// accounts without a verein get stuck in an infinite redirect loop between
// "/" and "/activities".

test.describe("PROJ-15 Bottom-Tab-Bar", () => {
  test("AC: unauthenticated access to /profil redirects to /", async ({ page }) => {
    await page.goto("/profil");
    await expect(page).toHaveURL("/");
  });

  test("AC: unauthenticated visitor sees no tab bar on /", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("nav")).toHaveCount(0);
  });

  test("AC: unauthenticated access to /activities still redirects to / (guard loosened for members, not removed)", async ({ page }) => {
    await page.goto("/activities");
    await expect(page).toHaveURL("/");
  });
});
