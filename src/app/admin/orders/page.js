'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, ArrowLeft } from 'lucide-react';
import { useLang } from '@/lib/LanguageProvider';
import { appLocales } from '@/lib/appLocales';

export default function AdminOrdersPage() {
  const router = useRouter();
  const { lang } = useLang();
  const t = appLocales[lang].admin;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  function fetchAllOrders() {
    setLoading(true);
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated || d.user?.role !== 'admin') { router.push('/'); return; }
        return fetch('/api/orders?all=true');
      })
      .then(r => r ? r.json() : null)
      .then(d => { if (d?.success) setOrders(d.orders); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  async function handleApprove(orderId) {
    try {
      const res = await fetch('/api/admin/approve-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      if (res.ok) fetchAllOrders();
    } catch {}
  }

  const pendingOrders = orders.filter(o => o.status === 'PENDING');

  useEffect(() => {
    fetchAllOrders();
    const interval = setInterval(fetchAllOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const statusColors = {
    PENDING: '#f59e0b',
    APPROVED: '#22c55e',
    REJECTED: '#ef4444',
  };

  return (
    <div className="page-layout">
      <div className="page-header">
        <button className="icon-btn" onClick={() => router.push('/')}><ArrowLeft className="icon" /></button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Shield size={20} style={{ color: '#ef4444' }} />
          <h1 style={{ margin: 0, fontSize: '20px' }}>{t.title} ({pendingOrders.length})</h1>
        </div>
        <div style={{ fontSize: '12px', color: '#22c55e' }}>{loading ? t.loading : '●'}</div>
      </div>

      <div className="page-content">
        {loading && orders.length === 0 ? (
          <p className="page-empty">{t.loading}</p>
        ) : orders.length === 0 ? (
          <p className="page-empty">{t.noPending}</p>
        ) : (
          orders.map(o => (
            <div key={o.id} className="page-card">
              <img src={o.item?.img} alt={o.item?.name} className="page-card-img" />
              <div className="page-card-body">
                <div className="page-card-name">{o.item?.name}</div>
                <div className="page-card-sub">{t.user}: {o.user?.username || o.userId} → {o.robloxUser}</div>
                <div style={{ fontSize: '11px', marginTop: '4px', color: statusColors[o.status] || '#888' }}>
                  {o.status}
                </div>
              </div>
              {o.status === 'PENDING' ? (
                <button onClick={() => handleApprove(o.id)} className="approve-btn">
                  {t.approve}
                </button>
              ) : (
                <div style={{ fontSize: '12px', color: statusColors[o.status] || '#888' }}>—</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
