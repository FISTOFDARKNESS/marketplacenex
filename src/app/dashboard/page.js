'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.authenticated) { router.push('/'); return; }
      setUser(d.user);
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
            <h1 className="page-title">Dashboard</h1>
            <p className="page-desc">Welcome back{user ? `, ${user.username}` : ''}.</p>
          </div>
        </div>
        <div className="empty-state">
          <LayoutDashboard size={40} style={{ color: '#6b7280' }} />
          <p>Dashboard overview coming soon.</p>
        </div>
      </main>
    </div>
  );
}
