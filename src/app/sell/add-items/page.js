'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Backpack, Globe, Plus, X, Loader2, Check, AlertCircle, Search } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { useLang } from '@/lib/LanguageProvider';
import { appLocales } from '@/lib/appLocales';

export default function AddItemsPage() {
  const router = useRouter();
  const { lang } = useLang();
  const t = appLocales[lang].sell;
  const [tab, setTab] = useState('inventory');
  const [siteItems, setSiteItems] = useState([]);
  const [robloxItems, setRobloxItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState({});
  const [addingId, setAddingId] = useState(null);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState('');

  const ROBUX_TO_USD = 0.0035;

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.authenticated) { router.push('/'); return; }
      fetch('/api/inventory').then(r => r.json()).then(d2 => {
        if (d2.success) setSiteItems(d2.inventory || []);
      }).catch(() => {}).finally(() => setLoading(false));
    });
  }, []);

  async function loadRoblox() {
    setLoading(true);
    try {
      const res = await fetch('/api/seller/profile');
      const data = await res.json();
      if (!data.success) { setMsg({ type: 'error', text: 'Failed to load profile' }); return; }
      const profile = data.profile;
      if (!profile.robloxId) { setMsg({ type: 'error', text: 'Link your Roblox account first' }); return; }

      const invRes = await fetch(`https://inventory.roblox.com/v2/users/${profile.robloxId}/inventory?assetTypes=Asset&limit=100`, {
        headers: { 'Accept': 'application/json' },
      });
      if (!invRes.ok) { setMsg({ type: 'error', text: 'Failed to fetch Roblox inventory' }); return; }
      const invData = await invRes.json();
      const assetIds = (invData.data || []).map(a => a.assetId).filter(Boolean);

      if (assetIds.length === 0) {
        setRobloxItems([]);
        setMsg({ type: 'info', text: t.noRobloxItems });
        return;
      }

      const itemChunks = [];
      for (let i = 0; i < assetIds.length; i += 50) {
        itemChunks.push(assetIds.slice(i, i + 50));
      }

      let matched = [];
      for (const chunk of itemChunks) {
        const query = chunk.join(',');
        const itemRes = await fetch(`/api/items/batch?ids=${query}`);
        if (itemRes.ok) {
          const itemData = await itemRes.json();
          if (itemData.success && itemData.items) matched = matched.concat(itemData.items);
        }
      }

      const listedRes = await fetch('/api/seller/items');
      const listedData = await listedRes.json();
      const listedIds = listedData.success ? new Set(listedData.items.map(i => i.itemId)) : new Set();

      const filtered = matched.filter(it => !listedIds.has(it.id));
      setRobloxItems(filtered);
      if (filtered.length === 0) setMsg({ type: 'info', text: t.noRobloxItems });
      else setMsg(null);
    } catch (e) {
      setMsg({ type: 'error', text: 'Error loading Roblox inventory' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tab === 'roblox') {
      setLoading(true);
      loadRoblox();
    }
  }, [tab]);

  async function handleAdd(itemId, robuxPrice) {
    if (!robuxPrice || robuxPrice < 1) return;
    setAddingId(itemId);
    setMsg(null);
    try {
      const res = await fetch('/api/seller/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, priceRobux: Number(robuxPrice) }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ type: 'success', text: t.itemAdded });
        setPrices(prev => ({ ...prev, [itemId]: '' }));
        if (tab === 'inventory') setSiteItems(prev => prev.filter(i => i.id !== itemId));
        else setRobloxItems(prev => prev.filter(i => i.id !== itemId));
      } else {
        setMsg({ type: 'error', text: data.error || 'Failed to add' });
      }
    } catch (e) {
      setMsg({ type: 'error', text: 'Network error' });
    } finally {
      setAddingId(null);
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  const displayItems = tab === 'inventory' ? siteItems : robloxItems;

  const filtered = (displayItems || []).filter(inv => {
    const it = inv.item || inv;
    const name = (it.name || '').toLowerCase();
    return !search || name.includes(search.toLowerCase());
  });

  return (
    <div className="app-layout">
      <Sidebar onLogout={handleLogout} />
      <main className="main-content">
        <div className="page-top">
          <div>
            <h1 className="page-title">{t.addItems}</h1>
            <p className="page-desc">{t.desc}</p>
          </div>
          <div className="search-bar">
            <Search size={16} />
            <input type="text" placeholder={appLocales[lang].common.search} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button className={`sell-tab ${tab === 'inventory' ? 'sell-tab-active' : ''}`} onClick={() => setTab('inventory')}>
            <Backpack size={16} /> {t.addFromInventory}
          </button>
          <button className={`sell-tab ${tab === 'roblox' ? 'sell-tab-active' : ''}`} onClick={() => setTab('roblox')}>
            <Globe size={16} /> {t.addFromRoblox}
          </button>
        </div>

        {msg && (
          <div className={`sell-msg sell-msg-${msg.type}`}>
            {msg.type === 'success' ? <Check size={14} /> : msg.type === 'error' ? <AlertCircle size={14} /> : null}
            {msg.text}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="loading-spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="table-empty">
            <Backpack size={32} style={{ opacity: 0.3 }} />
            <span>{tab === 'inventory' ? appLocales[lang].inventory.empty : t.noRobloxItems}</span>
          </div>
        ) : (
          <div className="inv-grid">
            {filtered.map(inv => {
              const it = inv.item || inv;
              const usdPrice = parseFloat(prices[it.id]) * ROBUX_TO_USD || 0;
              const isAdding = addingId === it.id;
              return (
                <div key={it.id} className="inv-card">
                  <div className="inv-card-img">
                    {it.img ? <img src={it.img} alt={it.name || ''} /> : <div className="cell-item-placeholder" />}
                  </div>
                  <div className="inv-card-name">{it.name || 'Unknown'}</div>
                  <div className="inv-card-meta">
                    {it.category && <span className="inv-tag inv-tag-cat">{it.category}</span>}
                    {it.rarity && <span className="inv-tag inv-tag-rar">{it.rarity}</span>}
                  </div>
                  <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="number"
                        min="1"
                        placeholder={t.priceRobuxPlaceholder}
                        value={prices[it.id] || ''}
                        onChange={e => setPrices(prev => ({ ...prev, [it.id]: e.target.value }))}
                        className="sell-price-input"
                      />
                      <span style={{ fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap' }}>R$</span>
                    </div>
                    <span style={{ fontSize: 11, color: '#6b7280' }}>
                      ≈ ${usdPrice.toFixed(2)} USD
                    </span>
                    <button
                      className="sell-add-btn"
                      disabled={isAdding || !prices[it.id] || Number(prices[it.id]) < 1}
                      onClick={() => handleAdd(it.id, prices[it.id])}
                    >
                      {isAdding ? <Loader2 size={14} className="spin" /> : <Plus size={14} />}
                      {t.addToListing}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
