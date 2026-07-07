'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';

export default function HtmlLang() {
  const { language } = useLanguage();

  useEffect(() => {
    document.documentElement.lang = language;
    // تغییر جهت (برای زبان فارسی راست‌چین)
    if (language === 'fa') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  }, [language]);

  return null;
}