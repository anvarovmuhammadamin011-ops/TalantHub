const BASE_URL = "/api";

const DEMO_USERS = [
  { id: 1, name: "Aziz Karimov", email: "aziz@demo.com", password: "12345678", phone: "+998 90 123 45 67", city: "Toshkent", role: "specialist", fields: ["IT"], categories: ["Frontend Developer"], category: "Frontend Developer", bio: "React va Vue.js bilan 3 yillik tajriba.", hourly_price: "50 000", orders_count: 47, rating: 4.9, reviews_count: 32, verified: 1, online: 1, experience: "3 yil", experience_level: "Middle", skills: ["React", "Vue.js", "TypeScript", "Tailwind CSS", "Node.js", "PostgreSQL"], certificates: ["Meta Frontend Developer Certificate"], timeline: [], social_telegram: "t.me/aziz_k", social_instagram: "aziz_dev", social_github: "azizkarimov" },
  { id: 2, name: "Nilufar Rahimova", email: "nilufar@demo.com", password: "12345678", phone: "+998 91 234 56 78", city: "Samarqand", role: "specialist", fields: ["Ta'lim"], categories: ["Ingliz tili o'qituvchisi"], category: "Ingliz tili o'qituvchisi", bio: "IELTS 8.0, 5 yillik tajriba.", hourly_price: "35 000", orders_count: 120, rating: 4.8, reviews_count: 89, verified: 1, online: 1, experience: "5 yil", experience_level: "Senior", skills: ["IELTS Preparation", "Business English", "Academic Writing"], certificates: ["Cambridge CELTA"], timeline: [], social_telegram: "t.me/nilufar_r", social_instagram: "nilufar_teacher", social_github: "" },
  { id: 3, name: "Sardor Alimov", email: "sardor@demo.com", password: "12345678", phone: "+998 93 345 67 89", city: "Toshkent", role: "specialist", fields: ["IT"], categories: ["Full Stack Developer"], category: "Full Stack Developer", bio: "Node.js va React bilan to'liq stack loyihalar.", hourly_price: "70 000", orders_count: 63, rating: 4.7, reviews_count: 45, verified: 1, online: 0, experience: "4 yil", experience_level: "Senior", skills: ["React", "Node.js", "MongoDB", "PostgreSQL", "Docker", "AWS"], certificates: ["AWS Solutions Architect"], timeline: [], social_telegram: "t.me/sardor_a", social_instagram: "sardor_dev", social_github: "sardoralimov" },
  { id: 4, name: "Dilshod Tursunov", email: "dilshod@demo.com", password: "12345678", phone: "+998 94 456 78 90", city: "Toshkent", role: "specialist", fields: ["IT"], categories: ["Backend Developer"], category: "Backend Developer", bio: "Python va Django bilan katta hajmli loyihalar.", hourly_price: "65 000", orders_count: 38, rating: 4.6, reviews_count: 28, verified: 1, online: 1, experience: "3 yil", experience_level: "Middle", skills: ["Python", "Django", "FastAPI", "PostgreSQL", "Docker"], certificates: ["Python Professional Certificate"], timeline: [], social_telegram: "t.me/dilshod_t", social_instagram: "dilshod_py", social_github: "dilshodt" },
  { id: 5, name: "Malika Nishonova", email: "malika@demo.com", password: "12345678", phone: "+998 95 567 89 01", city: "Buxoro", role: "specialist", fields: ["IT", "Ta'lim"], categories: ["UI/UX Dizayner"], category: "UI/UX Dizayner", bio: "Figma va Adobe bilan 4 yillik tajriba.", hourly_price: "45 000", orders_count: 52, rating: 4.9, reviews_count: 41, verified: 1, online: 1, experience: "4 yil", experience_level: "Middle", skills: ["Figma", "Adobe XD", "Photoshop", "Illustrator"], certificates: ["Google UX Design Certificate"], timeline: [], social_telegram: "t.me/malika_n", social_instagram: "malika_design", social_github: "malikanish" },
  { id: 6, name: "Jasur Karimov", email: "jasur@demo.com", password: "12345678", phone: "+998 97 678 90 12", city: "Namangan", role: "specialist", fields: ["Ta'lim"], categories: ["Matematika o'qituvchisi"], category: "Matematika o'qituvchisi", bio: "Oliy matematika — 7 yillik tajriba.", hourly_price: "30 000", orders_count: 95, rating: 4.8, reviews_count: 76, verified: 1, online: 1, experience: "7 yil", experience_level: "Expert", skills: ["Oliy Matematika", "Statistika", "Informatika"], certificates: ["Pedagogika Diplomasi"], timeline: [], social_telegram: "t.me/jasur_k", social_instagram: "jasur_math", social_github: "" },
  { id: 7, name: "TexnoLabs HR", email: "hr@texnolabs.uz", password: "12345678", phone: "+998 71 234 56 78", city: "Toshkent", role: "employer", fields: ["IT"], categories: ["IT"], category: "IT", bio: "TexnoLabs — IT sohasidagi yetakchi kompaniya.", hourly_price: "", orders_count: 0, rating: 4.5, reviews_count: 128, verified: 1, online: 0, experience: "", experience_level: "", skills: [], certificates: [], timeline: [], social_telegram: "", social_instagram: "", social_github: "" },
];

export function getToken() {
  return localStorage.getItem("talenthub_token");
}

export function setToken(token) {
  if (token) localStorage.setItem("talenthub_token", token);
  else localStorage.removeItem("talenthub_token");
}

function makeMockToken(user) {
  return btoa(JSON.stringify({ id: user.id, email: user.email, ts: Date.now() }));
}

function mockLogin(email, password) {
  const user = DEMO_USERS.find((u) => u.email === email && u.password === password);
  if (!user) throw { status: 401, message: "Email yoki parol noto'g'ri" };
  const { password: _, ...safe } = user;
  const token = makeMockToken(user);
  setToken(token);
  localStorage.setItem("talenthub_mock_user", JSON.stringify(safe));
  return { token, user: safe };
}

function mockMe() {
  const token = getToken();
  if (!token) throw { status: 401, message: "Token yo'q" };
  try {
    const data = JSON.parse(atob(token));
    const user = DEMO_USERS.find((u) => u.id === data.id);
    if (!user) throw new Error();
    const { password: _, ...safe } = user;
    return { user: safe };
  } catch {
    const stored = localStorage.getItem("talenthub_mock_user");
    if (stored) return { user: JSON.parse(stored) };
    throw { status: 401, message: "Token noto'g'ri" };
  }
}

function mockRegister(userData) {
  const user = {
    id: Date.now(),
    name: userData.name,
    email: userData.email,
    password: userData.password,
    phone: userData.phone || "",
    city: userData.city || "",
    role: userData.role || "specialist",
    fields: userData.fields || [],
    categories: userData.categories || [],
    category: userData.category || "",
    bio: "", avatar: "", hourly_price: "", orders_count: 0, rating: 0,
    reviews_count: 0, verified: 0, online: 1, experience: "",
    experience_level: "Junior", skills: [], certificates: [],
    timeline: [], social_telegram: "", social_instagram: "", social_github: "",
  };
  const token = makeMockToken(user);
  setToken(token);
  localStorage.setItem("talenthub_mock_user", JSON.stringify(user));
  return { token, user };
}

let backendAvailable = null;

async function checkBackend() {
  if (backendAvailable !== null) return backendAvailable;
  try {
    const res = await fetch(`${BASE_URL}/auth/me`, { method: "GET", headers: { "Content-Type": "application/json" } });
    backendAvailable = res.status !== 404;
  } catch {
    backendAvailable = false;
  }
  return backendAvailable;
}

export async function api(path, { method = "GET", body } = {}) {
  const isAuthPath = path.startsWith("/auth/");

  if (isAuthPath) {
    const hasBackend = await checkBackend();

    if (!hasBackend) {
      await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));

      if (path === "/auth/login" && method === "POST") return mockLogin(body.email, body.password);
      if (path === "/auth/register" && method === "POST") return mockRegister(body);
      if (path === "/auth/me") return mockMe();
      return {};
    }
  }

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
