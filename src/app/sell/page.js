'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tag } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

export default function SellPage() {
  const router = useRouter();

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
            <h1 className="page-title">Sell</h1>
            <p className="page-desc">List your items for sale.</p>
          </div>
        </div>
        <div className="empty-state">
          <Tag size={40} style={{ color: '#6b7280' }} />
          <p>Sell page coming soon.</p>
        </div>
      </main>
    </div>
  );
}
