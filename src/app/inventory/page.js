'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Backpack, Layers, DollarSign, Sparkles, Trash2, Eye, X, Package } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

export default function InventoryPage() {
  const router = useRouter();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [rarity, setRarity] = useState('all');
  const [detail, setDetail] = useState(null);
  const [removeId, setRemoveId] = useState(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) { router.push('/'); return null; }
        return fetch('/api/inventory');
      })
      .then(r => r ? r.json() : null)
      .then(d => {
        if (!d) return;
        if (!d.success) { setError(d.error || 'Failed to load inventory'); return; }
        setInventory(d.inventory || []);
      })
      .catch(e => setError('Network error: ' + e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  async function handleRemove(id) {
    setRemoveId(id);
    try {
      const res = await fetch('/api/inventory', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to remove'); return; }
      setInventory(prev => prev.filter(i => i.id !== id));
      if (detail?.id === id) setDetail(null);
    } catch {
      setError('Failed to remove item');
    } finally {
      setRemoveId(null);
    }
  }

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(inventory.map(i => i.item?.category).filter(Boolean))).sort()],
    [inventory]
  );
  const rarities = useMemo(
    () => ['all', ...Array.from(new Set(inventory.map(i => i.item?.rarity).filter(Boolean))).sort()],
    [inventory]
  );

  const filtered = inventory.filter(i => {
    const it = i.item || {};
    if (category !== 'all' && it.category !== category) return false;
    if (rarity !== 'all' && it.rarity !== rarity) return false;
    if (search && !(it.name || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = useMemo(() => {
    const total = inventory.length;
    const value = inventory.reduce((s, i) => s + (parseFloat(i.item?.usdPrice) || 0), 0);
    const cats = new Set(inventory.map(i => i.item?.category).filter(Boolean)).size;
    const rares = new Set(inventory.map(i => i.item?.rarity).filter(Boolean)).size;
    return { total, value, cats, rares };
  }, [inventory]);

  return (
    <div className="app-layout">
      <Sidebar onLogout={handleLogout} />
      <main className="main-content">
        <div className="page-top">
          <div>
            <h1 className="page-title">Inventory</h1>
            <p className="page-desc">Items you've received and collected from your orders.</p>
          </div>
          <div className="search-bar">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="inv-metrics">
          <div className="dash-card">
            <div className="dash-card-icon" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>
              <Backpack size={20} />
            </div>
            <div className="dash-card-body">
              <div className="dash-card-label">Total Items</div>
              <div className="dash-card-value">{stats.total}</div>
            </div>
          </div>
          <div className="dash-card">
            <div className="dash-card-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
              <DollarSign size={20} />
            </div>
            <div className="dash-card-body">
              <div className="dash-card-label">Total Value</div>
              <div className="dash-card-value">${stats.value.toFixed(2)}</div>
            </div>
          </div>
          <div className="dash-card">
            <div className="dash-card-icon" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
              <Layers size={20} />
            </div>
            <div className="dash-card-body">
              <div className="dash-card-label">Categories</div>
              <div className="dash-card-value">{stats.cats}</div>
            </div>
          </div>
          <div className="dash-card">
            <div className="dash-card-icon" style={{ background: 'rgba(236,72,153,0.12)', color: '#ec4899' }}>
              <Sparkles size={20} />
            </div>
            <div className="dash-card-body">
              <div className="dash-card-label">Rarities</div>
              <div className="dash-card-value">{stats.rares}</div>
            </div>
          </div>
        </div>

        {inventory.length > 0 && (
          <div className="inv-filters">
            <select value={category} onChange={e => setCategory(e.target.value)} className="inv-select">
              {categories.map(c => (
                <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>
              ))}
            </select>
            <select value={rarity} onChange={e => setRarity(e.target.value)} className="inv-select">
              {rarities.map(r => (
                <option key={r} value={r}>{r === 'all' ? 'All rarities' : r}</option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <div className="page-error" style={{ color: '#ef4444' }}>{error}</div>
        )}

        {loading ? (
          <div className="inv-loading"><div className="loading-spinner" /><span>Loading...</span></div>
        ) : inventory.length === 0 ? (
          <div className="table-empty inv-empty">
            <Package size={32} style={{ opacity: 0.3 }} />
            <span>Your inventory is empty.</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="table-empty inv-empty">
            <Package size={32} style={{ opacity: 0.3 }} />
            <span>No items match your filters.</span>
          </div>
        ) : (
          <div className="inv-grid">
            {filtered.map(inv => {
              const it = inv.item || {};
              const usd = parseFloat(it.usdPrice) || 0;
              return (
                <div key={inv.id} className="inv-card">
                  <div className="inv-card-img">
                    {it.img ? <img src={it.img} alt={it.name || ''} /> : <div className="cell-item-placeholder" />}
                  </div>
                  <div className="inv-card-name">{it.name || 'Unknown item'}</div>
                  <div className="inv-card-meta">
                    {it.category && <span className="inv-tag inv-tag-cat">{it.category}</span>}
                    {it.rarity && <span className="inv-tag inv-tag-rar">{it.rarity}</span>}
                  </div>
                  <div className="inv-card-foot">
                    <span className="inv-card-price">${usd.toFixed(2)}</span>
                    <div className="inv-card-actions">
                      <button className="inv-icon-btn" title="Details" onClick={() => setDetail(inv)}>
                        <Eye size={15} />
                      </button>
                      <button
                        className="inv-icon-btn inv-icon-danger"
                        title="Remove"
                        disabled={removeId === inv.id}
                        onClick={() => handleRemove(inv.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {detail && (
        <div className="inv-modal-backdrop" onClick={() => setDetail(null)}>
          <div className="inv-modal" onClick={e => e.stopPropagation()}>
            <button className="inv-modal-close" onClick={() => setDetail(null)}><X size={18} /></button>
            <div className="inv-modal-img">
              {detail.item?.img ? <img src={detail.item.img} alt={detail.item.name || ''} /> : <div className="cell-item-placeholder" />}
            </div>
            <h3 className="inv-modal-title">{detail.item?.name || 'Unknown item'}</h3>
            <div className="inv-modal-tags">
              {detail.item?.category && <span className="inv-tag inv-tag-cat">{detail.item.category}</span>}
              {detail.item?.rarity && <span className="inv-tag inv-tag-rar">{detail.item.rarity}</span>}
            </div>
            <div className="inv-modal-rows">
              <div><span>Value</span><b>${(parseFloat(detail.item?.usdPrice) || 0).toFixed(2)}</b></div>
              <div><span>RAP</span><b>{detail.item?.rap ?? '—'}</b></div>
              <div><span>Price</span><b>${detail.item?.price ? Number(detail.item.price).toFixed(2) : '0.00'}</b></div>
              <div><span>Size</span><b>{detail.item?.size || '—'}</b></div>
              <div><span>Acquired</span><b>{new Date(detail.createdAt).toLocaleDateString()}</b></div>
            </div>
            <button className="purchase-btn" style={{ width: '100%' }} onClick={() => handleRemove(detail.id)} disabled={removeId === detail.id}>
              {removeId === detail.id ? 'Removing...' : 'Remove from inventory'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
