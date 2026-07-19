// Shared demo/seed credentials — these accounts only exist in the local dev seed
// data (server/seed.cjs), never in a real deployment. Not secrets.
export const SPECIALIST = { email: "aziz@demo.com", password: "12345678" };
export const EMPLOYER = { email: "hr@texnolabs.uz", password: "12345678" };
export const ADMIN = { email: "admin@talenthub.uz", password: "Admin123!" };

const API_BASE = "http://localhost:4000/api";

export async function apiLogin(request, { email, password }) {
  const res = await request.post(`${API_BASE}/auth/login`, { data: { email, password } });
  if (!res.ok()) throw new Error(`API login failed for ${email}: ${res.status()}`);
  const { token } = await res.json();
  return token;
}

export async function apiRequest(request, token, path, options = {}) {
  return request.fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  });
}

export async function uiLogin(page, { email, password }) {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: "Kirish", exact: true }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 10000 });
}
