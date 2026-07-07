'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronDown } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) { router.push('/'); return; }
        return fetch('/api/orders');
      })
      .then(r => r ? r.json() : null)
      .then(d => { if (d?.success) setOrders(d.orders); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  const filtered = orders.filter(o =>
    !search || o.id.toString().includes(search) || (o.user?.username || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="app-layout">
      <Sidebar onLogout={handleLogout} />
      <main className="main-content">
        <div className="page-top">
          <div>
            <h1 className="page-title">Orders</h1>
            <p className="page-desc">Track and manage your sales orders from buyers.</p>
          </div>
          <div className="search-bar">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by ID or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Item</th>
                <th>Buyer</th>
                <th>Price</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="table-empty">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="table-empty">No orders found.</td></tr>
              ) : (
                filtered.map(o => (
                  <tr key={o.id}>
                    <td className="cell-id">#{o.id.toString().slice(-6)}</td>
                    <td>
                      <div className="cell-item">
                        <img src={o.item.img} alt={o.item.name} />
                        <span>{o.item.name}</span>
                      </div>
                    </td>
                    <td className="cell-buyer">{o.robloxUser}</td>
                    <td className="cell-price">${o.item.usdPrice}</td>
                    <td>
                      <span className={`badge-status status-${o.status.toLowerCase()}`}>
                        {o.status}
                      </span>
                    </td>
                    <td>
                      <button className="action-btn">
                        <ChevronDown size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
