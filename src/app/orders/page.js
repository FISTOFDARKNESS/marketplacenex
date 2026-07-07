'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, ArrowLeft, X } from 'lucide-react';

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) { router.push('/'); return; }
        setUser(d.user);
        return fetch('/api/orders');
      })
      .then(r => r ? r.json() : null)
      .then(d => { if (d?.success) setOrders(d.orders); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-layout">
      <div className="page-header">
        <button className="icon-btn" onClick={() => router.push('/')}><ArrowLeft className="icon" /></button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Package size={20} style={{ color: '#f59e0b' }} />
          <h1 style={{ margin: 0, fontSize: '20px' }}>Orders</h1>
        </div>
        <div />
      </div>

      <div className="page-content">
        {loading ? (
          <p className="page-empty">Loading...</p>
        ) : orders.length === 0 ? (
          <p className="page-empty">No orders yet</p>
        ) : (
          orders.map(o => (
            <div key={o.id} className="page-card">
              <img src={o.item.img} alt={o.item.name} className="page-card-img" />
              <div className="page-card-body">
                <div className="page-card-name">{o.item.name}</div>
                <div className="page-card-sub">for {o.robloxUser}</div>
              </div>
              <span className={`page-status status-${o.status.toLowerCase()}`}>
                {o.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
