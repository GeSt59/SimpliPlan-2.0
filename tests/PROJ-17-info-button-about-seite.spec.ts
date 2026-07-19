import { test, expect } from "@playwright/test";

// Note: the info icon in the /activities titlebar requires a logged-in session
// to reach (unauthenticated access redirects away, see PROJ-3). Its presence
// and link target were verified via source-code equivalence to the already-
// deployed kategorien titlebar pattern and manual review during /qa (see QA
// Test Results in features/PROJ-17-info-button-about-seite.md) rather than
// automated here — same rationale as PROJ-3/4/5/6/7/10/11/12/13/15/16 (no
// seeded test-data fixture strategy yet, see PROJ-1).

test.describe("PROJ-17 Info-Button & About-Seite", () => {
  test("AC: /about is reachable without login (no redirect)", async ({ page }) => {
    await page.goto("/about");
    await expect(page).toHaveURL(/\/about$/);
  });

  test("AC: /about shows title, tagline, contact and OK button", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByRole("heading", { name: "SimpliPlan 2.0" })).toBeVisible();
    await expect(page.getByText("Clevere Planung und Organisation")).toBeVisible();
    await expect(page.getByText("Kontakt:")).toBeVisible();
    await expect(page.getByRole("link", { name: "office@toolies.eu" })).toHaveAttribute(
      "href",
      "mailto:office@toolies.eu"
    );
    const websiteLink = page.getByRole("link", { name: "https://simpliplan.webnode.page/" });
    await expect(websiteLink).toHaveAttribute("href", "https://simpliplan.webnode.page/");
    await expect(websiteLink).toHaveAttribute("target", "_blank");
    await expect(page.getByRole("link", { name: "OK" })).toBeVisible();
  });

  test("AC: OK button links back to /activities", async ({ page }) => {
    // Asserts the href directly rather than the post-click URL: an
    // unauthenticated click would correctly bounce off /activities' own auth
    // guard (PROJ-3) onto "/", which is unrelated to this button's target.
    await page.goto("/about");
    await expect(page.getByRole("link", { name: "OK" })).toHaveAttribute("href", "/activities");
  });
});
