import { test, expect } from "@playwright/test";

// Note: criteria that require logged-in Admin-/Mitglieds-Accounts (Entfernen-
// Icon + Bestätigungsdialog, Mitglied-hinzufügen-Auswahlliste inkl. Leerzustand
// und Sortierung, "voll wird nicht blockiert", Admin-Zugriff auf vergangene
// Activities, Drucken-Button + Print-Stylesheet, Cross-Tenant-Schutz für
// Zeitbereich UND Ziel-Mitglied, XSS) wurden per scriptedem Playwright-Lauf
// gegen das echte Supabase-Projekt mit isolierten, danach vollständig
// entfernten Testdaten verifiziert (siehe QA Test Results in
// features/PROJ-11-teilnehmer-uebersicht-admin.md) statt hier dauerhaft
// automatisiert — gleiche Begründung wie PROJ-3–10 (keine seedbare
// Test-Fixture-Strategie bisher, siehe PROJ-1).

test.describe("PROJ-11 Teilnehmer-Übersicht (Admin)", () => {
  test("AC: unauthenticated POST to the admin participant endpoint is rejected with 401", async ({ request }) => {
    const res = await request.post("/api/einstellungen/1/teilnehmer", {
      data: { action: "hinzufuegen", mitgliedId: 1 },
    });
    expect(res.status()).toBe(401);
  });
});
