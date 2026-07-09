import { test, expect } from "@playwright/test";

// Note: registration/login-success criteria that need a real, valid Verein +
// account are verified manually against the live Supabase project (see QA
// Test Results in features/PROJ-3-authentifizierung.md) rather than here.
// There is no seeded test-data strategy yet (that belongs to PROJ-1), so
// automating those durably here would either rely on data QA deletes after
// each run or on real member data — neither is a stable long-term fixture.

test.describe("PROJ-3 Authentifizierung", () => {
  test("AC: falsche Zugangsdaten zeigen eine generische Fehlermeldung", async ({ page }) => {
    await page.goto("/");
    await page.fill("#email", "nonexistent-e2e@example.com");
    await page.fill("#password", "wrongpassword");
    await page.click('button:has-text("LOGIN")');
    await expect(page.getByText("E-Mail oder Passwort ist falsch.")).toBeVisible();
  });

  test("AC: leeres Registrierungsformular zeigt Validierungsfehler pro Pflichtfeld", async ({ page }) => {
    await page.goto("/register");
    await page.click('button:has-text("REGISTRIEREN")');
    await expect(page.getByText("Vorname ist erforderlich")).toBeVisible();
    await expect(page.getByText("Nachname ist erforderlich")).toBeVisible();
    await expect(page.getByText("Ungültige E-Mail-Adresse")).toBeVisible();
    await expect(page.getByText("Passwort muss mindestens 6 Zeichen haben")).toBeVisible();
    await expect(page.getByText("Freischaltcode ist erforderlich")).toBeVisible();
  });

  test("AC: unterschiedliches Passwort und Passwort-Wiederholung wird abgelehnt", async ({ page }) => {
    await page.goto("/register");
    await page.fill('input[placeholder="Vorname eingeben..."]', "Test");
    await page.fill('input[placeholder="Nachname eingeben..."]', "User");
    await page.fill('input[placeholder="E-Mail eingeben..."]', "mismatch-e2e@example.com");
    await page.fill('input[placeholder="Passwort eingeben..."]', "password1");
    await page.fill('input[placeholder="Passwort wiederholen..."]', "password2");
    await page.fill('input[placeholder="Freischaltcode eingeben..."]', "irrelevant");
    await page.click('button:has-text("REGISTRIEREN")');
    await expect(page.getByText("Passwörter stimmen nicht überein")).toBeVisible();
  });

  test("AC: ungültiger Freischaltcode zeigt Fehlermeldung", async ({ page }) => {
    await page.goto("/register");
    await page.fill('input[placeholder="Vorname eingeben..."]', "Test");
    await page.fill('input[placeholder="Nachname eingeben..."]', "User");
    await page.fill('input[placeholder="E-Mail eingeben..."]', "invalid-code-e2e@example.com");
    await page.fill('input[placeholder="Passwort eingeben..."]', "password1");
    await page.fill('input[placeholder="Passwort wiederholen..."]', "password1");
    await page.fill('input[placeholder="Freischaltcode eingeben..."]', "definitely-not-a-real-code");
    await page.click('button:has-text("REGISTRIEREN")');
    await expect(page.getByText("Ungültiger Freischaltcode.")).toBeVisible();
  });

  test("AC: Passwort-vergessen zeigt immer dieselbe Bestätigung", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.fill("#email", "irrelevant-e2e@example.com");
    await page.click('button:has-text("Link senden")');
    await expect(
      page.getByText("Falls diese E-Mail existiert, wurde ein Link zum Zurücksetzen des Passworts gesendet.")
    ).toBeVisible();
  });

  test("AC: abgelaufener/ungültiger Passwort-Reset-Link zeigt Fehlermeldung", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByText("Dieser Link ist abgelaufen oder ungültig.")).toBeVisible({ timeout: 5000 });
  });
});
