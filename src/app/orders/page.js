'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Package, Tag, LayoutDashboard, Plus, Eye, ChevronDown } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { useLang } from '@/lib/LanguageProvider';
import { appLocales } from '@/lib/appLocales';

export default function OrdersPage() {
  const router = useRouter();
  const { lang } = useLang();
  const t = appLocales[lang].orders;
  const st = appLocales[lang].sell;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sellMenuOpen, setSellMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) { router.push('/'); return null; }
        setUser(d);
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

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setSellMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
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
            <h1 className="page-title">{t.title}</h1>
            <p className="page-desc">{t.desc}</p>
          </div>
          <div className="search-bar">
            <Search size={16} />
            <input
              type="text"
              placeholder={t.search}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="sell-dropdown-wrap" ref={menuRef}>
            <button className="orders-sell-badge" onClick={() => setSellMenuOpen(!sellMenuOpen)}>
              <Tag size={15} /> {st.startSelling} <ChevronDown size={12} className={`sell-chevron${sellMenuOpen ? ' sell-chevron-open' : ''}`} />
            </button>
            {sellMenuOpen && (
              <div className="sell-dropdown">
                <button className="sell-dropdown-item" onClick={() => { setSellMenuOpen(false); router.push('/sell/dashboard'); }}>
                  <LayoutDashboard size={16} /> {st.dashboard}
                </button>
                <button className="sell-dropdown-item" onClick={() => { setSellMenuOpen(false); router.push('/sell/add-items'); }}>
                  <Plus size={16} /> {st.addItems}
                </button>
                <button className="sell-dropdown-item" onClick={() => { setSellMenuOpen(false); router.push('/sell'); }}>
                  <Tag size={16} /> {st.title}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table orders-table">
            <thead>
              <tr>
                <th>{t.item}</th>
                <th className="hide-mobile">{t.robloxUser}</th>
                <th>{t.price}</th>
                <th>{t.status}</th>
                <th className="hide-mobile">{t.date}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="table-empty"><div className="loading-spinner" /><span>{appLocales[lang].common.loading}</span></td></tr>
              ) : error ? (
                <tr><td colSpan={5} className="table-empty" style={{color:'#ef4444'}}>{error}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="table-empty">
                  <Package size={32} style={{opacity:0.3}} />
                  <span>{t.noOrders}</span>
                </td></tr>
              ) : (
                filtered.map(o => {
                  const item = o.item || {};
                  const status = (o.status || 'PENDING').toLowerCase();
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
