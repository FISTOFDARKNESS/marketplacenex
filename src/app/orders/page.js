'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) { router.push('/'); return null; }
        return fetch('/api/orders');
      })
      .then(r => r ? r.json() : null)
      .then(d => {
        if (!d) return;
        if (!d.success) { setError(d.error || 'Failed to load orders'); return; }
        setOrders(d.orders || []);
      })
      .catch(e => setError('Network error: ' + e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  const filtered = orders.filter(o =>
    !search ||
    o.item?.name?.toLowerCase().includes(search.toLowerCase()) ||
    (o.robloxUser || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="app-layout">
      <Sidebar onLogout={handleLogout} />
      <main className="main-content">
        <div className="page-top">
          <div>
            <h1 className="page-title">Orders</h1>
            <p className="page-desc">Track and manage your purchases and received items.</p>
          </div>
          <div className="search-bar">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by ID, buyer or recipient..."
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
                <th>Roblox User</th>
                <th>Price</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="table-empty">Loading...</td></tr>
              ) : error ? (
                <tr><td colSpan={6} className="table-empty" style={{color:'#ef4444'}}>Error: {error}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="table-empty">No orders found.</td></tr>
              ) : (
                filtered.map(o => {
                  const item = o.item || {};
                  const status = (o.status || 'PENDING').toLowerCase();
                  return (
                  <tr key={o.id}>
                    <td className="cell-id">#{o.id.toString().slice(-6)}</td>
                    <td>
                      <div className="cell-item">
                        {item.img ? <img src={item.img} alt={item.name || ''} /> : <div style={{width:36,height:36,borderRadius:6,background:'#1a1a1e'}} />}
                        <span>{item.name || 'Unknown item'}</span>
                      </div>
                    </td>
                    <td className="cell-buyer">{o.robloxUser || '—'}</td>
                    <td className="cell-price">${item.price ? Number(item.price).toFixed(2) : '0.00'}</td>
                    <td>
                      <span className={`badge-status status-${status}`}>
                        {o.status || 'PENDING'}
                      </span>
                    </td>
                    <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
