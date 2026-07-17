import { test, expect } from "@playwright/test";

// Note: criteria that require logged-in accounts with real Vereine/Rollen
// (Karten-/Listenansicht, Suche, Du/Admin/Inaktiv-Badges, Detail-Dialog,
// Tab-Bar-Erweiterung für Mitglieder vs. unverändertes Admin/SU-Verhalten,
// Cross-Tenant-Isolation, Leerzustand, XSS) were verified via a scripted
// Playwright run against the live Supabase project with isolated, disposable
// test data during /qa (see QA Test Results in
// features/PROJ-13-mitglieder-ansicht-suche.md) rather than automated here —
// same rationale as PROJ-3/4/5/6/7/12/15 (no seeded test-data fixture
// strategy yet, see PROJ-1).

test.describe("PROJ-13 Mitglieder-Ansicht/Suche", () => {
  test("AC: unauthenticated access to /mitgliedersuche redirects to /", async ({ page }) => {
    await page.goto("/mitgliedersuche");
    await expect(page).toHaveURL("/");
  });
});
