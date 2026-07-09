'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tag } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { useLang } from '@/lib/LanguageProvider';
import { appLocales } from '@/lib/appLocales';

export default function SellPage() {
  const router = useRouter();
  const { lang } = useLang();
  const t = appLocales[lang].sell;

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.authenticated) router.push('/');
    });
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  return (
    <div className="app-layout">
      <Sidebar onLogout={handleLogout} />
      <main className="main-content">
        <div className="page-top">
          <div>
            <h1 className="page-title">{t.title}</h1>
            <p className="page-desc">{t.desc}</p>
          </div>
        </div>
        <div className="empty-state">
          <Tag size={40} style={{ color: '#6b7280' }} />
          <p>{t.comingSoon}</p>
        </div>
      </main>
    </div>
  );
}
