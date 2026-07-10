'use client';

import { useState } from 'react';
import { Crown, Search, Heart, Wallet, Package, Backpack, Shield } from 'lucide-react';
import Link from 'next/link';
import { locales } from '@/lib/locales';
import { useLang } from '@/lib/LanguageProvider';

export default function Navbar({
  user,
  wishlistCount,
  searchTerm,
  setSearchTerm,
  onOpenAuth,
  onLogout,
  onScrollTo,
  onOpenWishlist,
  onOpenFinance,
}) {
  const { lang, setLang } = useLang();
  const t = locales[lang].nav;

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <div className="logo-box" style={{ cursor: 'pointer' }} onClick={() => onScrollTo('hero')} aria-label={lang === 'pt' ? 'Ir para o topo' : 'Go to top'}>
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
        <label htmlFor="langSelect" className="sr-only">{lang === 'pt' ? 'Idioma' : 'Language'}</label>
        <select 
          id="langSelect"
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
          aria-label={t.wishlist}
        >
          <Heart className="icon" />
          {wishlistCount > 0 && (
            <span className="badge" id="wishCount">{wishlistCount}</span>
          )}
        </button>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button className="icon-btn" title="Finance" onClick={onOpenFinance} aria-label="Finance">
              <Wallet className="icon" />
            </button>

            <Link href="/orders" className="nav-link-btn" title="Orders" aria-label="Orders">
              <Package size={16} />
            </Link>
            <Link href="/inventory" className="nav-link-btn" title="Inventory" aria-label="Inventory">
              <Backpack size={16} />
            </Link>
            {user.role === 'admin' && (
              <Link href="/admin/orders" className="nav-link-btn" title="Admin Orders" aria-label="Admin Orders" style={{ color: '#ef4444' }}>
                <Shield size={16} />
              </Link>
            )}

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
