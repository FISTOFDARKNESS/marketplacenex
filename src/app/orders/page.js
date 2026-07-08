'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Package } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) { router.push('/'); return null; }
        setCurrentUserId(d.user?.id);
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
              placeholder="Search items or Roblox user..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table orders-table">
            <thead>
              <tr>
                <th>Item</th>
                <th className="hide-mobile">Roblox User</th>
                <th>Price</th>
                <th>Status</th>
                <th className="hide-mobile">Date</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="table-empty"><div className="loading-spinner" /><span>Loading...</span></td></tr>
              ) : error ? (
                <tr><td colSpan={6} className="table-empty" style={{color:'#ef4444'}}>{error}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="table-empty">
                  <Package size={32} style={{opacity:0.3}} />
                  <span>No orders found.</span>
                </td></tr>
              ) : (
                filtered.map(o => {
                  const item = o.item || {};
                  const status = (o.status || 'PENDING').toLowerCase();
                  const isBuyer = o.buyerId === currentUserId;
                  const isRecipient = o.userId === currentUserId;
                  const role = isBuyer && isRecipient ? 'Both' : isBuyer ? 'Buyer' : 'Recipient';
                  return (
                  <tr key={o.id}>
                    <td>
                      <div className="cell-item">
                        {item.img ? <img src={item.img} alt={item.name || ''} /> : <div className="cell-item-placeholder" />}
                        <div>
                          <div className="cell-item-name">{item.name || 'Unknown item'}</div>
                          <div className="cell-item-id">#{o.id.toString().slice(-6)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="hide-mobile">{o.robloxUser || '—'}</td>
                    <td className="cell-price">${item.price ? Number(item.price).toFixed(2) : '0.00'}</td>
                    <td>
                      <span className={`badge-status status-${status}`}>
                        {o.status || 'PENDING'}
                      </span>
                    </td>
                    <td className="hide-mobile">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge-role ${isBuyer ? 'role-buyer' : 'role-recipient'}`}>
                        {role}
                      </span>
                    </td>
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
