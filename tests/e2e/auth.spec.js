import { test, expect } from "@playwright/test";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";
import { uiLogin, SPECIALIST } from "./helpers.js";

// No delete-user API exists (the product deliberately only supports blocking, never
// deleting, accounts) — so cleanup for the throwaway account this test creates goes
// straight through the same db module the server uses.
const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
require("dotenv").config({ path: path.join(__dirname, "../../server/.env") });
const db = require("../../server/db.cjs");

test.describe("Authentication", () => {
  test("existing user can log in and log out", async ({ page }) => {
    await uiLogin(page, SPECIALIST);
    await expect(page).not.toHaveURL(/\/login/);

    await page.goto("/profile");
    await page.getByRole("main").getByRole("button", { name: "Chiqish", exact: true }).click();
    await page.getByRole("button", { name: "Chiqish", exact: true }).last().click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("new specialist can register end-to-end and reach the onboarding wizard", async ({ page }) => {
    const email = `pw_test_${Date.now()}@example.com`;

    await page.goto("/register");

    // Step 0: role
    await page.getByText("Men mutaxassisman").click();

    // Step 1: field + category
    await page.getByRole("button", { name: "IT", exact: true }).click();
    await page.getByRole("button", { name: "Frontend Developer" }).click();
    await page.getByRole("button", { name: /Davom etish/i }).click();

    // Step 2: personal info
    await page.getByPlaceholder("Masalan: Aziz Karimov").fill("Playwright Test User");
    await page.getByPlaceholder("example@mail.com").fill(email);
    await page.getByPlaceholder("+998 90 123 45 67").fill("+998901234567");
    await page.getByPlaceholder("Masalan: Toshkent").fill("Toshkent");
    await page.getByPlaceholder("Kamida 8 ta belgi").fill("testpass123");
    await page.getByRole("button", { name: /Davom etish/i }).click();

    // Step 3: SMS — the demo code only renders after requesting it once
    await page.getByText("SMS kod olish").click();
    const demoText = await page.getByText(/Demo:\s*\d{4}/).textContent();
    const code = demoText.match(/\d{4}/)[0];
    for (let i = 0; i < 4; i++) {
      await page.locator(`#sms-${i}`).fill(code[i]);
    }

    // Step 4: confirm + submit
    await expect(page.getByRole("button", { name: /Ro'yxatdan o'tish/i })).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: /Ro'yxatdan o'tish/i }).click();

    await page.waitForURL((url) => url.pathname === "/", { timeout: 10000 });

    // Onboarding wizard should appear automatically for a brand-new specialist.
    await expect(page.getByText(/Xush kelibsiz/i)).toBeVisible({ timeout: 5000 });
    await page.getByText("Keyinroq to'ldiraman").click();
    await expect(page.getByText(/Xush kelibsiz/i)).not.toBeVisible();

    await db.prepare("DELETE FROM users WHERE email = ?").run(email);
  });
});
