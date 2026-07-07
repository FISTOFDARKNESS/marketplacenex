'use client';

import { useState } from 'react';
import { Crown, Search, Heart, Wallet, Settings, Shield, Package, Backpack, UserCheck } from 'lucide-react';
import { locales } from '@/lib/locales';

export default function Navbar({
  user,
  wishlistCount,
  searchTerm,
  setSearchTerm,
  onOpenAuth,
  onLogout,
  onScrollTo,
  lang = 'en',
  setLang,
  onOpenWishlist,
  onOpenFinance,
  onOpenVerify,
  onOpenOrders,
  onOpenInventory,
  onOpenAdminOrders,
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const t = locales[lang].nav;

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <div className="logo-box" style={{ cursor: 'pointer' }} onClick={() => onScrollTo('hero')}>
          <Crown className="icon" />
        </div>
        <div className="search-box">
          <Search className="icon" />
          <input
            id="searchInput"
            placeholder={t.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="nav-links">
        <a href="#" className="active" onClick={(e) => { e.preventDefault(); onScrollTo('hero'); }}>{t.home}</a>
        <a href="#catalog" onClick={(e) => { e.preventDefault(); onScrollTo('catalog'); }}>{t.browse}</a>
        <a href="#how" onClick={(e) => { e.preventDefault(); onScrollTo('how'); }}>{t.howItWorks}</a>
        <a href="#faq" onClick={(e) => { e.preventDefault(); onScrollTo('faq'); }}>{t.faq}</a>
      </div>
      <div className="auth-buttons">
        <select 
          value={lang} 
          onChange={(e) => setLang(e.target.value)} 
          style={{
            background: 'var(--bg-2)',
            border: '1px solid var(--line)',
            borderRadius: '8px',
            color: 'var(--text)',
            padding: '6px 10px',
            fontSize: '12px',
            outline: 'none',
            cursor: 'pointer',
            marginRight: '8px'
          }}
        >
          <option value="en">🇬🇧 EN</option>
          <option value="pt">🇧🇷 PT</option>
          <option value="it">🇮🇹 IT</option>
          <option value="es">🇪🇸 ES</option>
          <option value="fr">🇫🇷 FR</option>
          <option value="de">🇩🇪 DE</option>
        </select>

        <button
          className="icon-btn"
          title={t.wishlist}
          onClick={onOpenWishlist}
          style={{ position: 'relative' }}
        >
          <Heart className="icon" />
          {wishlistCount > 0 && (
            <span className="badge" id="wishCount">{wishlistCount}</span>
          )}
        </button>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="icon-btn" title="Finance" onClick={onOpenFinance}>
              <Wallet className="icon" />
            </button>

            <div style={{ position: 'relative' }}>
              <button className="icon-btn" title="Settings" onClick={() => setSettingsOpen(!settingsOpen)}>
                <Settings className="icon" />
              </button>
              {settingsOpen && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: '6px',
                  background: '#1a1a1e', border: '1px solid #2a2a2e', borderRadius: '10px',
                  padding: '4px', minWidth: '180px', zIndex: 100, boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
                }}>
                  <button onClick={() => { setSettingsOpen(false); onOpenVerify(); }} style={{
                    display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 12px',
                    border: 'none', background: 'transparent', color: '#d1d5db', borderRadius: '8px',
                    cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', transition: 'background 0.15s',
                  }}
                  onMouseOver={e => e.currentTarget.style.background = '#2a2a2e'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <UserCheck size={14} /> Verify Account
                  </button>
                  <button onClick={() => { setSettingsOpen(false); onOpenOrders(); }} style={{
                    display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 12px',
                    border: 'none', background: 'transparent', color: '#d1d5db', borderRadius: '8px',
                    cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', transition: 'background 0.15s',
                  }}
                  onMouseOver={e => e.currentTarget.style.background = '#2a2a2e'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <Package size={14} /> Orders
                  </button>
                  <button onClick={() => { setSettingsOpen(false); onOpenInventory(); }} style={{
                    display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 12px',
                    border: 'none', background: 'transparent', color: '#d1d5db', borderRadius: '8px',
                    cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', transition: 'background 0.15s',
                  }}
                  onMouseOver={e => e.currentTarget.style.background = '#2a2a2e'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <Backpack size={14} /> Inventory
                  </button>
                  {user.role === 'admin' && (
                    <button onClick={() => { setSettingsOpen(false); onOpenAdminOrders(); }} style={{
                      display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 12px',
                      border: 'none', background: 'transparent', color: '#ef4444', borderRadius: '8px',
                      cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', transition: 'background 0.15s',
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#2a2a2e'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                      <Shield size={14} /> Admin — Orders
                    </button>
                  )}
                </div>
              )}
            </div>

            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)' }}>
              {user.username}
            </div>
            <button className="signup-btn" style={{ background: '#ef4444', color: '#fff' }} onClick={onLogout}>
              {t.logout}
            </button>
          </div>
        ) : (
          <>
            <button className="login-link" onClick={() => onOpenAuth('login')}>
              {t.login}
            </button>
            <button className="signup-btn" onClick={() => onOpenAuth('register')}>
              {t.signUp}
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
