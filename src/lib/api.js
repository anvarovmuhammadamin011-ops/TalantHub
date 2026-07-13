const TOKEN_KEY = "talenthub_token";
const USERS_KEY = "talenthub_users";

const DEMO_USERS = [
  {
    id: 1,
    name: "Aziz Karimov",
    email: "aziz@demo.com",
    password: "12345678",
    phone: "+998 90 123 45 67",
    city: "Toshkent",
    role: "specialist",
    fields: ["IT"],
    categories: ["Frontend Developer"],
    category: "Frontend Developer",
  },
  {
    id: 2,
    name: "Nilufar Rahimova",
    email: "nilufar@demo.com",
    password: "12345678",
    phone: "+998 91 234 56 78",
    city: "Samarqand",
    role: "specialist",
    fields: ["Ta'lim"],
    categories: ["Ingliz tili o'qituvchisi"],
    category: "Ingliz tili o'qituvchisi",
  },
  {
    id: 3,
    name: "Sardor Alimov",
    email: "sardor@demo.com",
    password: "12345678",
    phone: "+998 93 345 67 89",
    city: "Toshkent",
    role: "specialist",
    fields: ["IT"],
    categories: ["Full Stack Developer"],
    category: "Full Stack Developer",
  },
  {
    id: 4,
    name: "TexnoLabs HR",
    email: "hr@texnolabs.uz",
    password: "12345678",
    phone: "+998 71 234 56 78",
    city: "Toshkent",
    role: "employer",
    fields: ["IT"],
    categories: ["Frontend Developer", "Backend Developer"],
    category: "IT",
  },
];

function getUsers() {
  const stored = localStorage.getItem(USERS_KEY);
  if (!stored) {
    localStorage.setItem(USERS_KEY, JSON.stringify(DEMO_USERS));
    return [...DEMO_USERS];
  }
  const users = JSON.parse(stored);
  const hasDemo = users.some((u) => u.email === "aziz@demo.com");
  if (!hasDemo) {
    const merged = [...DEMO_USERS, ...users];
    localStorage.setItem(USERS_KEY, JSON.stringify(merged));
    return merged;
  }
  return users;
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

function generateToken(user) {
  return btoa(JSON.stringify({ id: user.id, email: user.email, ts: Date.now() }));
}

function getUserFromToken(token) {
  try {
    const data = JSON.parse(atob(token));
    const users = getUsers();
    return users.find((u) => u.id === data.id) || null;
  } catch {
    return null;
  }
}

export async function api(path, { method = "GET", body } = {}) {
  await new Promise((r) => setTimeout(r, 300 + Math.random() * 500));

  if (path === "/auth/me") {
    const token = getToken();
    if (!token) throw { status: 401, message: "Token topilmadi" };
    const user = getUserFromToken(token);
    if (!user) throw { status: 401, message: "Noto'g'ri token" };
    const { password, ...safe } = user;
    return { user: safe };
  }

  if (path === "/auth/login" && method === "POST") {
    const users = getUsers();
    const user = users.find((u) => u.email === body.email && u.password === body.password);
    if (!user) throw { status: 401, message: "Email yoki parol noto'g'ri" };
    const { password, ...safe } = user;
    return { token: generateToken(user), user: safe };
  }

  if (path === "/auth/register" && method === "POST") {
    const users = getUsers();
    if (users.find((u) => u.email === body.email)) {
      throw { status: 409, message: "Bu email allaqachon ro'yxatdan o'tgan" };
    }
    const newUser = {
      id: Date.now(),
      name: body.name,
      email: body.email,
      password: body.password,
      phone: body.phone,
      city: body.city,
      role: body.role,
      fields: body.fields || [],
      categories: body.categories || [],
      category: body.category || "",
    };
    users.push(newUser);
    saveUsers(users);
    const { password, ...safe } = newUser;
    return { token: generateToken(newUser), user: safe };
  }

  return {};
}
