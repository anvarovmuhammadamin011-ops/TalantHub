import { test, expect } from "@playwright/test";
import { uiLogin, apiLogin, apiRequest, SPECIALIST, EMPLOYER, ADMIN } from "./helpers.js";

const TITLE = `__E2E_VACANCY_APPLY__${Date.now()}`;
let vacancyId;

test.describe("Applying to a vacancy", () => {
  test.beforeAll(async ({ request }) => {
    const employerToken = await apiLogin(request, EMPLOYER);
    const createRes = await apiRequest(request, employerToken, "/vacancies", {
      method: "POST",
      data: { title: TITLE, company: "E2E Test Co", category: "IT", format: "Masofaviy", tags: ["Playwright"] },
    });
    const { vacancy } = await createRes.json();
    vacancyId = vacancy.id;

    // Moderation defaults to pre-approval, so the vacancy needs an admin sign-off
    // before it's publicly visible/applicable.
    if (vacancy.status !== "Faol") {
      const adminToken = await apiLogin(request, ADMIN);
      await apiRequest(request, adminToken, `/admin/vacancies/${vacancyId}/status`, {
        method: "PATCH",
        data: { status: "Faol" },
      });
    }
  });

  test.afterAll(async ({ request }) => {
    const employerToken = await apiLogin(request, EMPLOYER);
    await apiRequest(request, employerToken, `/vacancies/${vacancyId}`, { method: "DELETE" });
  });

  test("specialist can apply to a vacancy from the detail page", async ({ page }) => {
    await uiLogin(page, SPECIALIST);
    await page.goto(`/vacancies/${vacancyId}`);
    await expect(page.getByRole("heading", { name: TITLE })).toBeVisible();

    await page.getByRole("button", { name: /Ariza yuborish/i }).first().click();
    await page.getByPlaceholder(/Nega aynan siz/).fill("Playwright orqali yuborilgan test arizasi.");
    await page.getByRole("button", { name: "Yuborish", exact: true }).click();

    await expect(page.getByText("Yuborildi")).toBeVisible({ timeout: 5000 });
  });
});
