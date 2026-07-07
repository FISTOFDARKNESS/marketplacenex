'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, DollarSign, TrendingUp, Bell, CheckCircle } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) { router.push('/'); return; }
        return fetch('/api/dashboard');
      })
      .then(r => r ? r.json() : null)
      .then(d => { if (d?.success) setData(d); })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  const s = data?.stats;
  const r = data?.revenue;
  const username = data?.user?.username || 'User';

  return (
    <div className="app-layout">
      <Sidebar onLogout={handleLogout} />
      <main className="main-content">
        <div className="page-top" style={{ marginBottom: '24px' }}>
          <div>
            <h1 className="page-title" style={{ textTransform: 'capitalize' }}>Welcome back, {username}</h1>
            <p className="page-desc">Here's what's happening with your marketplace today.</p>
          </div>
        </div>

        <div className="dash-metrics">
          <div className="dash-card">
            <div className="dash-card-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
              <ShoppingBag size={20} />
            </div>
            <div className="dash-card-body">
              <div className="dash-card-label">Orders Today</div>
              <div className="dash-card-value">{s?.ordersToday ?? 0}</div>
            </div>
          </div>
          <div className="dash-card">
            <div className="dash-card-icon" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>
              <DollarSign size={20} />
            </div>
            <div className="dash-card-body">
              <div className="dash-card-label">Today's Revenue</div>
              <div className="dash-card-value">${(s?.todayRevenue ?? 0).toFixed(2)}</div>
            </div>
          </div>
          <div className="dash-card">
            <div className="dash-card-icon" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
              <TrendingUp size={20} />
            </div>
            <div className="dash-card-body">
              <div className="dash-card-label">Total Profit</div>
              <div className="dash-card-value">${(s?.totalProfit ?? 0).toFixed(2)}</div>
            </div>
          </div>
        </div>

        <div className="dash-section">
          <h3 className="dash-section-title">Revenue Overview</h3>
          <div className="dash-revenue-card">
            <div className="dash-revenue-stats">
              <div>
                <div className="dash-revenue-label">Average</div>
                <div className="dash-revenue-value">${(r?.avgRevenue ?? 0).toFixed(2)}</div>
              </div>
              <div>
                <div className="dash-revenue-label">Peak</div>
                <div className="dash-revenue-value">${(r?.peakRevenue ?? 0).toFixed(2)}</div>
              </div>
            </div>
            <div className="dash-chart">
              {(r?.last12Days ?? []).map((d, i) => {
                const max = r?.peakRevenue || 1;
                const h = max > 0 ? (d.revenue / max) * 100 : 0;
                return (
                  <div key={d.date} className="dash-bar-wrap" title={`${d.date}: $${d.revenue.toFixed(2)}`}>
                    <div className="dash-bar" style={{ height: `${Math.max(h, 2)}%` }} />
                    <span className="dash-bar-label">{d.date.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="dash-section">
          <h3 className="dash-section-title">Notifications</h3>
          <div className="dash-notif-card">
            <Bell size={18} style={{ color: '#6b7280' }} />
            <span>You're all caught up!</span>
          </div>
        </div>
      </main>
    </div>
  );
}
