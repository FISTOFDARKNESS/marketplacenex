'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

export default function HistoryPage() {
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
            <h1 className="page-title">History</h1>
            <p className="page-desc">View your order history.</p>
          </div>
        </div>
        <div className="empty-state">
          <Clock size={40} style={{ color: '#6b7280' }} />
          <p>History page coming soon.</p>
        </div>
      </main>
    </div>
  );
}
