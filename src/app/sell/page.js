'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Tag, LayoutDashboard, Plus, Eye, ChevronDown, User, DollarSign, Package, TrendingUp } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { useLang } from '@/lib/LanguageProvider';
import { appLocales } from '@/lib/appLocales';

export default function SellPage() {
  const router = useRouter();
  const { lang } = useLang();
  const t = appLocales[lang].sell;
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [items, setItems] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const menuRef = useRef(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.authenticated) { router.push('/'); return; }
      setUser(d);
      fetch('/api/seller/profile').then(r => r.json()).then(d2 => {
        if (d2.success) {
          setProfile(d2.profile);
          setItems(d2.profile.items || []);
        }
      }).catch(() => {}).finally(() => setLoading(false));
    });
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  const totalValue = items.reduce((s, i) => s + i.priceUsd, 0);

  return (
    <div className="app-layout">
      <Sidebar onLogout={handleLogout} />
      <main className="main-content">
        <div className="page-top">
          <div>
            <h1 className="page-title">{t.title}</h1>
            <p className="page-desc">{t.desc}</p>
          </div>
          <div className="sell-dropdown-wrap" ref={menuRef}>
            <button className="sell-start-btn" onClick={() => setMenuOpen(!menuOpen)}>
              <Tag size={16} /> {t.startSelling} <ChevronDown size={14} className={`sell-chevron${menuOpen ? ' sell-chevron-open' : ''}`} />
            </button>
            {menuOpen && (
              <div className="sell-dropdown">
                <button className="sell-dropdown-item" onClick={() => { setMenuOpen(false); router.push('/sell/dashboard'); }}>
                  <LayoutDashboard size={16} /> {t.dashboard}
                </button>
                <button className="sell-dropdown-item" onClick={() => { setMenuOpen(false); router.push('/sell/add-items'); }}>
                  <Plus size={16} /> {t.addItems}
                </button>
                {profile?.robloxUsername && (
                  <button className="sell-dropdown-item" onClick={() => { setMenuOpen(false); router.push(`/sell/preview/${profile.robloxUsername}`); }}>
                    <Eye size={16} /> {t.preview}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="loading-spinner" /></div>
        ) : (
          <>
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
            </div>

            {profile && (
              <div className="sell-profile-bar">
                <div className="sell-profile-avatar-wrap">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="" className="sell-profile-avatar" />
                  ) : (
                    <div className="sell-profile-avatar sell-profile-avatar-placeholder"><User size={18} /></div>
                  )}
                </div>
                <div className="sell-profile-info">
                  <span className="sell-profile-name">{profile.robloxUsername || user?.username || 'You'}</span>
                  <span className="sell-profile-status">{profile.isPublic ? t.publicStore : t.privateStore}</span>
                </div>
                {profile.robloxUsername && (
                  <button className="purchase-btn purchase-btn-secondary" style={{ marginLeft: 'auto', padding: '6px 14px', fontSize: 12 }} onClick={() => router.push(`/sell/preview/${profile.robloxUsername}`)}>
                    <Eye size={14} /> {t.preview}
                  </button>
                )}
              </div>
            )}

            {items.length === 0 ? (
              <div className="table-empty" style={{ padding: 48 }}>
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
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
