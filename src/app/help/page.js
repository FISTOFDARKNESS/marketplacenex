'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HelpCircle } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

export default function HelpPage() {
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
            <h1 className="page-title">Help</h1>
            <p className="page-desc">Get help and support.</p>
          </div>
        </div>
        <div className="empty-state">
          <HelpCircle size={40} style={{ color: '#6b7280' }} />
          <p>Help page coming soon.</p>
        </div>
      </main>
    </div>
  );
}
