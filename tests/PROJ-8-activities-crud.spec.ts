import { test, expect } from "@playwright/test";

// Note: criteria that require a logged-in admin with real Vereine (list,
// create/edit/delete, search, kommend/vergangen-Trennung, Zeitbereiche-
// Platzhalter, delete-warning guard, cross-tenant RLS, XSS, responsive) were
// verified via a scripted Playwright run against the live Supabase project
// with isolated, disposable test data during /qa (see QA Test Results in
// features/PROJ-8-activities-crud.md) rather than automated here — same
// rationale as PROJ-3/4/5/6/7 (no seeded test-data fixture strategy yet, see
// PROJ-1).

test.describe("PROJ-8 Activities CRUD", () => {
  test("AC: unauthenticated access to /activities redirects to /", async ({ page }) => {
    await page.goto("/activities");
    await expect(page).toHaveURL("/");
  });

  test("AC: unauthenticated access to /activities/archiv redirects to /", async ({ page }) => {
    await page.goto("/activities/archiv");
    await expect(page).toHaveURL("/");
  });

  test("AC: unauthenticated access to /activities/[id] redirects to /", async ({ page }) => {
    await page.goto("/activities/1");
    await expect(page).toHaveURL("/");
  });
});
