'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, ArrowLeft } from 'lucide-react';

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  function fetchAllOrders() {
    setLoading(true);
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated || d.user.role !== 'admin') { router.push('/'); return; }
        return fetch('/api/orders?all=true');
      })
      .then(r => r ? r.json() : null)
      .then(d => { if (d?.success) setOrders(d.orders); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchAllOrders(); }, []);

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

  return (
    <div className="page-layout">
      <div className="page-header">
        <button className="icon-btn" onClick={() => router.push('/')}><ArrowLeft className="icon" /></button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Shield size={20} style={{ color: '#ef4444' }} />
          <h1 style={{ margin: 0, fontSize: '20px' }}>Admin — Pending Orders ({pendingOrders.length})</h1>
        </div>
        <div />
      </div>

      <div className="page-content">
        {loading ? (
          <p className="page-empty">Loading...</p>
        ) : pendingOrders.length === 0 ? (
          <p className="page-empty">No pending orders</p>
        ) : (
          pendingOrders.map(o => (
            <div key={o.id} className="page-card">
              <img src={o.item?.img} alt={o.item?.name} className="page-card-img" />
              <div className="page-card-body">
                <div className="page-card-name">{o.item?.name}</div>
                <div className="page-card-sub">User: {o.user?.username || o.userId} → {o.robloxUser}</div>
              </div>
              <button onClick={() => handleApprove(o.id)} className="approve-btn">
                Approve
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
