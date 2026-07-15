import { test, expect } from "@playwright/test";

// Note: criteria that require a logged-in admin with real Activities/Rollen
// (auto-generation of the 17 Standard-Zeitbereiche, inline-edit validation,
// Save/Delete/Bulk-Delete, "X zugesagt"-Anzeige, Cross-Tenant-Isolation,
// XSS, Cascade-Löschung, Responsive/Cross-Browser) were verified via a
// scripted Playwright run against the live Supabase project with isolated,
// disposable test data during /qa (see QA Test Results in
// features/PROJ-9-zeitbereiche-crud.md) rather than automated here — same
// rationale as PROJ-3/4/5/6/7/8/15 (no seeded test-data fixture strategy
// yet, see PROJ-1). That run also uncovered BUG-1 (Medium, open):
// activities.einteilungens is never updated when PROJ-9 creates new
// einstellungen rows, silently breaking PROJ-8's "hat bereits eingeteilte
// Helfer"-delete-warning for any activity touched by PROJ-9.

test.describe("PROJ-9 Zeitbereiche CRUD", () => {
  test("AC: unauthenticated access to /activities/[id]/zeitbereiche redirects to /", async ({ page }) => {
    await page.goto("/activities/1/zeitbereiche");
    await expect(page).toHaveURL("/");
  });
});
