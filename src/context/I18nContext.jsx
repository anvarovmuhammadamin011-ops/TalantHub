import { createContext, useContext, useState, useMemo } from "react";
import { dictionaries, DEFAULT_LOCALE } from "../i18n";

const I18nContext = createContext(null);

function lookup(dict, key) {
  return key.split(".").reduce((node, part) => (node && typeof node === "object" ? node[part] : undefined), dict);
}

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(() => localStorage.getItem("talenthub_locale") || DEFAULT_LOCALE);

  const setLocale = (next) => {
    if (!dictionaries[next]) return;
    localStorage.setItem("talenthub_locale", next);
    setLocaleState(next);
  };

  const t = useMemo(() => (key, vars) => {
    const dict = dictionaries[locale] || dictionaries[DEFAULT_LOCALE];
    let value = lookup(dict, key);
    if (value === undefined) value = lookup(dictionaries[DEFAULT_LOCALE], key);
    if (value === undefined) return key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) value = value.replaceAll(`{${k}}`, v);
    }
    return value;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useT = () => useContext(I18nContext);
