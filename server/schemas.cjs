const { z } = require("zod");

// Loose-but-real validation for the highest-risk write endpoints. Objects use .passthrough()
// so fields not modeled here (there are dozens of optional vacancy/profile fields) pass through
// untouched — the goal is to reject garbage/type-confused input on the fields that matter, not
// to hand-model every column.

const registerSchema = z.object({
  name: z.string({ error: "Ism majburiy" }).trim().min(1, "Ism majburiy").max(200),
  email: z.string({ error: "Email majburiy" }).trim().email("Email noto'g'ri").max(255),
  password: z.string({ error: "Parol majburiy" }).min(8, "Parol kamida 8 ta belgi bo'lishi kerak").max(200),
  phone: z.string().max(50).optional(),
  city: z.string().max(200).optional(),
  role: z.enum(["specialist", "employer"]).optional(),
  fields: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  category: z.string().max(200).optional(),
}).passthrough();

const loginSchema = z.object({
  email: z.string({ error: "Email majburiy" }).trim().email("Email noto'g'ri"),
  password: z.string({ error: "Parol majburiy" }).min(1, "Parol majburiy"),
});

const vacancyCreateSchema = z.object({
  title: z.string({ error: "Sarlavha majburiy" }).trim().min(1, "Sarlavha majburiy").max(300),
  company: z.string({ error: "Kompaniya majburiy" }).trim().min(1, "Kompaniya majburiy").max(300),
  description: z.string().max(20000).optional(),
  salary_min: z.union([z.number(), z.string()]).optional(),
  salary_max: z.union([z.number(), z.string()]).optional(),
  openings_count: z.union([z.number(), z.string()]).optional(),
  tags: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  conditions: z.array(z.string()).optional(),
  responsibilities: z.array(z.string()).optional(),
  screening_questions: z.array(z.string()).optional(),
  directions: z.array(z.string()).optional(),
}).passthrough();

const applicationCreateSchema = z.object({
  vacancy_id: z.union([z.number(), z.string()], { error: "Vakansiya ID kerak" }).refine((v) => Number(v) > 0, "Vakansiya ID kerak"),
  resume_url: z.string().max(2000).optional(),
  cover_letter: z.string().max(5000).optional(),
  screening_answers: z.array(z.object({ question: z.string(), answer: z.string() })).optional(),
});

module.exports = { registerSchema, loginSchema, vacancyCreateSchema, applicationCreateSchema };
