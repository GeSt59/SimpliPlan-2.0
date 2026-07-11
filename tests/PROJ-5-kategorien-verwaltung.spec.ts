import { test, expect } from "@playwright/test";

// Note: criteria that require a logged-in admin with a real Verein (list,
// create/edit/delete, duplicate-name validation, picture upload, delete-usage
// guard, cross-tenant RLS) were verified manually against the live Supabase
// project with isolated, disposable test data during /qa (see QA Test Results
// in features/PROJ-5-kategorien-verwaltung.md) rather than automated here —
// same rationale as PROJ-3/PROJ-4 (no seeded test-data fixture strategy yet).

test.describe("PROJ-5 Kategorien-Verwaltung", () => {
  test("AC: unauthenticated access to /kategorien redirects to /", async ({ page }) => {
    await page.goto("/kategorien");
    await expect(page).toHaveURL("/");
  });
});
