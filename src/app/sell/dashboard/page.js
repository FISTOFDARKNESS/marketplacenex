'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tag, Package, DollarSign, TrendingUp, Trash2, Eye, Globe, Lock } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { useLang } from '@/lib/LanguageProvider';
import { appLocales } from '@/lib/appLocales';

export default function SellerDashboardPage() {
  const router = useRouter();
  const { lang } = useLang();
  const t = appLocales[lang].sell;
  const [profile, setProfile] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.authenticated) { router.push('/'); return; }
      loadData();
    });
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch('/api/seller/profile');
      const data = await res.json();
      if (data.success) {
        setProfile(data.profile);
        setItems(data.profile.items || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(id) {
    setRemovingId(id);
    try {
      const res = await fetch(`/api/seller/items/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems(prev => prev.filter(i => i.id !== id));
        loadData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRemovingId(null);
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  const totalValue = items.reduce((s, i) => s + i.priceUsd, 0);
  const totalRobux = items.reduce((s, i) => s + i.priceRobux, 0);

  return (
    <div className="app-layout">
      <Sidebar onLogout={handleLogout} />
      <main className="main-content">
        <div className="page-top">
          <div>
            <h1 className="page-title">{t.dashboard}</h1>
            <p className="page-desc">{t.desc}</p>
          </div>
        </div>

        <div className="inv-metrics" style={{ marginBottom: 24 }}>
          <div className="dash-card">
            <div className="dash-card-icon" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
              <Tag size={20} />
            </div>
            <div className="dash-card-body">
              <div className="dash-card-label">{t.listed}</div>
              <div className="dash-card-value">{items.length}</div>
            </div>
          </div>
          <div className="dash-card">
            <div className="dash-card-icon" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>
              <TrendingUp size={20} />
            </div>
            <div className="dash-card-body">
              <div className="dash-card-label">{t.sold}</div>
              <div className="dash-card-value">{profile?.totalSales || 0}</div>
            </div>
          </div>
          <div className="dash-card">
            <div className="dash-card-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
              <DollarSign size={20} />
            </div>
            <div className="dash-card-body">
              <div className="dash-card-label">{t.totalValue}</div>
              <div className="dash-card-value">${totalValue.toFixed(2)}</div>
            </div>
          </div>
          <div className="dash-card">
            <div className="dash-card-icon" style={{ background: 'rgba(236,72,153,0.12)', color: '#ec4899' }}>
              <Package size={20} />
            </div>
            <div className="dash-card-body">
              <div className="dash-card-label">{t.robuxPrice}</div>
              <div className="dash-card-value">{totalRobux.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="loading-spinner" /></div>
        ) : items.length === 0 ? (
          <div className="table-empty">
            <Package size={32} style={{ opacity: 0.3 }} />
            <span>{t.noItems}</span>
          </div>
        ) : (
          <div className="inv-grid">
            {items.map(si => {
              const it = si.item || {};
              return (
                <div key={si.id} className="inv-card">
                  <div className="inv-card-img">
                    {it.img ? <img src={it.img} alt={it.name || ''} /> : <div className="cell-item-placeholder" />}
                  </div>
                  <div className="inv-card-name">{it.name || 'Unknown'}</div>
                  <div className="inv-card-meta">
                    {it.category && <span className="inv-tag inv-tag-cat">{it.category}</span>}
                    {it.rarity && <span className="inv-tag inv-tag-rar">{it.rarity}</span>}
                  </div>
                  <div className="inv-card-foot">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span className="inv-card-price">{si.priceRobux.toLocaleString()} <span style={{ fontSize: 11, color: '#9ca3af' }}>R$</span></span>
                      <span style={{ fontSize: 11, color: '#6b7280' }}>${si.priceUsd.toFixed(2)}</span>
                    </div>
                    <div className="inv-card-actions">
                      <button className="inv-icon-btn" title={t.removeListing} disabled={removingId === si.id} onClick={() => handleRemove(si.id)}>
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
    </div>
  );
}
