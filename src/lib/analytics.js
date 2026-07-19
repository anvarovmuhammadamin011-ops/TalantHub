import { BASE_URL, getToken } from "./api";

// Fire-and-forget — a missed pageview should never affect the actual page.
export function trackPageview(path) {
  try {
    const headers = { "Content-Type": "application/json" };
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    fetch(`${BASE_URL}/analytics/track`, {
      method: "POST",
      headers,
      body: JSON.stringify({ path }),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}
