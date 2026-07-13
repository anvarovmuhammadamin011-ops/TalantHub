const BASE_URL = import.meta.env.VITE_API_URL || "/api";

export function getToken() {
  return localStorage.getItem("talenthub_token");
}

export function setToken(token) {
  if (token) localStorage.setItem("talenthub_token", token);
  else localStorage.removeItem("talenthub_token");
}

export async function api(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    throw { status: res.status, message: data.error || "Xatolik yuz berdi" };
  }

  return data;
}
