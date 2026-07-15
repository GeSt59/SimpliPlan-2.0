import { test, expect } from "@playwright/test";

// Note: criteria that require logged-in accounts with real Mitglieder/Rollen/
// Zeitbereiche (Mitglieder-Zugriff auf /activities ohne Admin-Icons, Zeilen-
// Klick zur Anmeldung, Checkbox-An-/Abmeldung, Namenslisten, Status-Icons auf
// der Übersicht, Auto-Enrollment bei gleich_angemeldet-Rollen, Cross-Tenant-
// Isolation, Archiv-Übersicht-Link, XSS) wurden per scriptedem Playwright-Lauf
// gegen das echte Supabase-Projekt mit isolierten, danach vollständig
// entfernten Testdaten verifiziert (siehe QA Test Results in
// features/PROJ-10-mitglied-anmeldung-zeitbereiche.md) statt hier dauerhaft
// automatisiert — gleiche Begründung wie PROJ-3–9/15 (keine seedbare
// Test-Fixture-Strategie bisher, siehe PROJ-1).

test.describe("PROJ-10 Mitglied-Anmeldung zu Zeitbereichen", () => {
  test("AC: unauthenticated access to /activities/[id]/uebersicht redirects to /", async ({ page }) => {
    await page.goto("/activities/1/uebersicht");
    await expect(page).toHaveURL("/");
  });

  test("AC: unauthenticated POST to the self-signup endpoint is rejected with 401", async ({ request }) => {
    const res = await request.post("/api/einstellungen/1/anmeldung", {
      data: { action: "anmelden" },
    });
    expect(res.status()).toBe(401);
  });
});
