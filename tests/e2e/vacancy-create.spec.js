import { test, expect } from "@playwright/test";
import { uiLogin, EMPLOYER } from "./helpers.js";

const TITLE = `__E2E_VACANCY_CREATE__${Date.now()}`;

test.describe("Vacancy creation", () => {
  test.afterEach(async ({ request }) => {
    const loginRes = await request.post("http://localhost:4000/api/auth/login", { data: EMPLOYER });
    const { token } = await loginRes.json();
    const listRes = await request.get("http://localhost:4000/api/vacancies/mine", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const { vacancies } = await listRes.json();
    const created = vacancies.find((v) => v.title === TITLE);
    if (created) {
      await request.delete(`http://localhost:4000/api/vacancies/${created.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  });

  test("employer can create a vacancy as a draft and see it on the dashboard", async ({ page }) => {
    await uiLogin(page, EMPLOYER);
    await page.goto("/vacancies/new");

    await page.getByPlaceholder("masalan: Senior Frontend Developer").fill(TITLE);
    await page.getByPlaceholder("Kompaniya nomi").fill("E2E Test Co");
    await page.getByPlaceholder(/Vakansiya haqida batafsil/).fill(
      "Bu Playwright E2E test tomonidan yaratilgan vakansiya tavsifi. ".repeat(3)
    );

    await page.getByRole("button", { name: /Qoralama/i }).click();
    await page.waitForURL("**/dashboard", { timeout: 10000 });

    await expect(page.getByText(TITLE)).toBeVisible({ timeout: 5000 });
  });
});
