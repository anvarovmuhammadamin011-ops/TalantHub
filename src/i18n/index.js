import uz from "./uz.json";
import ru from "./ru.json";
import en from "./en.json";

export const dictionaries = { uz, ru, en };
export const locales = [
  { code: "uz", label: "O'zbek" },
  { code: "ru", label: "Русский" },
  { code: "en", label: "English" },
];
export const DEFAULT_LOCALE = "uz";
