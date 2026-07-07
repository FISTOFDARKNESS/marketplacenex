'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftRight } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

export default function TransactionsPage() {
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
            <h1 className="page-title">Transactions</h1>
            <p className="page-desc">View your payment transactions.</p>
          </div>
        </div>
        <div className="empty-state">
          <ArrowLeftRight size={40} style={{ color: '#6b7280' }} />
          <p>Transactions page coming soon.</p>
        </div>
      </main>
    </div>
  );
}
