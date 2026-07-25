'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const VALID = ['en', 'pt', 'it', 'es', 'fr', 'de'];
const LanguageContext = createContext({ lang: 'en', setLang: () => {} });

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState('en');

  useEffect(() => {
    const saved = localStorage.getItem('lang');
    if (saved && VALID.includes(saved)) setLangState(saved);
  }, []);

  const setLang = (l) => {
    if (!VALID.includes(l)) l = 'en';
    setLangState(l);
    try { localStorage.setItem('lang', l); } catch {}
    if (typeof document !== 'undefined') document.documentElement.lang = l;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}

export const VALID_LANGS = VALID;
