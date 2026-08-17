'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';

export default function HtmlLang() {
  const { language } = useLanguage();

  useEffect(() => {
    document.documentElement.lang = language;
    if (language === 'fa') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  }, [language]);

  return null;
}