'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Toast from '@/components/Toast';
import { useLang } from '@/lib/LanguageProvider';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { proxyUrl } from '@/lib/storage-url';
import { Heart, Download, Star, Upload, CheckCircle, ShoppingBag, TrendingUp, Box, Image as ImageIcon, Music, Puzzle, Code, Sparkles } from 'lucide-react';

const AuthModal = dynamic(() => import('@/components/Modals').then(m => m.AuthModal), { ssr: false });

const ASSET_TYPES = [
  { key: 'model', icon: Box, label: 'Models' },
  { key: 'decal', icon: ImageIcon, label: 'Decals' },
  { key: 'audio', icon: Music, label: 'Audio' },
  { key: 'plugin', icon: Puzzle, label: 'Plugins' },
  { key: 'script', icon: Code, label: 'Scripts' },
  { key: 'vfx', icon: Sparkles, label: 'VFX' },
];

export default function Home() {
  const { lang } = useLang();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState({ type: null, data: null });
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.authenticated) setUser(d.user);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/assets?sort=popular&limit=12').then(r => r.json()).then(d => {
      if (d.success) setAssets(d.assets);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const addToast = (icon, message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, icon, message }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    addToast('check-circle', 'Logged out successfully');
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <Navbar
        user={user}
        onOpenAuth={(type) => setModalState({ type, data: null })}
        onLogout={handleLogout}
        onScrollTo={scrollToSection}
      />

      <section className="hero" id="hero">
        <div className="hero-glow" />
        <div className="hero-eyebrow">
          <span className="live-dot" />
          Roblox Studio Asset Marketplace
        </div>
        <h1>
          Upload & Sell <span>Roblox Studio</span> Assets
        </h1>
        <p>
          Share your creations with the community. VFX, models, scripts, and more.
          Get verified to start selling.
        </p>
        <div className="hero-ctas">
          <button className="hero-cta-primary" onClick={() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })}>
            <ShoppingBag size={16} /> Browse Assets
          </button>
          <button className="hero-cta-secondary" onClick={() => router.push('/upload')}>
            <Upload size={16} /> Upload Asset
          </button>
        </div>
        <div className="stats-row">
          <div className="stat">
            <div className="stat-num">{assets.length}+</div>
            <div className="stat-label">Assets</div>
          </div>
          <div className="stat">
            <div className="stat-num">
              {assets.reduce((s, a) => s + (a.downloads || 0), 0)}+
            </div>
            <div className="stat-label">Downloads</div>
          </div>
          <div className="stat">
            <div className="stat-num">
              {new Set(assets.map(a => a.ownerId)).size}
            </div>
            <div className="stat-label">Creators</div>
          </div>
        </div>
      </section>

      <div className="trust-bar">
        <div className="trust-item"><CheckCircle className="icon" /> Admin Reviewed</div>
        <div className="trust-item"><Download className="icon" /> Instant Downloads</div>
        <div className="trust-item"><Star className="icon" /> Community Ratings</div>
        <div className="trust-item"><TrendingUp className="icon" /> Follow Creators</div>
      </div>

      <section className="catalog-section section-wrap" id="catalog">
        <div className="section-head">
          <div className="section-eyebrow">Marketplace</div>
          <h2>Featured Assets</h2>
          <p>Discover top assets from verified creators</p>
        </div>
        <div className="catalog-categories">
          {ASSET_TYPES.map(cat => (
            <button key={cat.key} className="catalog-category-pill" onClick={() => router.push(`/marketplace?assetType=${cat.key}`)}>
              <cat.icon size={14} /> {cat.label}
            </button>
          ))}
        </div>
        <div className="item-grid">
          {loading ? Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="item-card skeleton" style={{ animationDelay: `${i * 0.04}s` }}>
              <div className="skeleton-img pulse"></div>
              <div className="skeleton-text title pulse"></div>
              <div className="skeleton-text price pulse"></div>
            </div>
          )) : assets.length === 0 ? (
            <div className="empty-state show">
              No assets yet. Be the first to upload!
            </div>
          ) : assets.map((asset, idx) => (
            <div
              key={asset.id}
              className="item-card"
              style={{ animationDelay: `${idx * 0.04}s` }}
              onClick={() => router.push(`/asset/${asset.id}`)}
            >
              <div className="item-card-img">
                {asset.thumbnailUrl ? (
                  <Image src={proxyUrl(asset.thumbnailUrl)} alt={asset.name} width={180} height={180} sizes="180px" unoptimized />
                ) : (
                  <div style={{ width: 80, height: 80, background: 'var(--bg-3)', borderRadius: 8 }} />
                )}
                {asset.assetType && (
                  <span className={`asset-type-badge type-${asset.assetType}`}>
                    {asset.assetType}
                  </span>
                )}
              </div>
              <div className="item-card-info">
                <h3 className="item-card-name">{asset.name}</h3>
                <div className="item-card-meta">
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{asset.owner?.username || 'Unknown'}</span>
                  <span className="item-value">
                    {asset.price === 'Free' ? 'Free' : `${asset.priceRobux} R$`}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Download size={11} /> {asset.downloads}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Heart size={11} /> {asset.likesCount}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <button className="hero-cta-primary" onClick={() => router.push('/marketplace')}>
            View All Assets
          </button>
        </div>
      </section>

      <section className="how-section section-wrap" id="how">
        <div className="section-head">
          <div className="section-eyebrow">How It Works</div>
          <h2>For Creators</h2>
          <p>Share your Roblox Studio creations with the world</p>
        </div>
        <div className="how-grid">
          <div className="how-card">
            <div className="how-num"><Upload className="icon" /></div>
            <h3>Upload Your Asset</h3>
            <p>Submit your .rbxm or .rbxl files with a name, description, tags, and preview media.</p>
          </div>
          <div className="how-card">
            <div className="how-num"><CheckCircle className="icon" /></div>
            <h3>Admin Review</h3>
            <p>Your asset goes through a quick moderation queue. Admins review and approve quality content.</p>
          </div>
          <div className="how-card">
            <div className="how-num"><Download className="icon" /></div>
            <h3>Get Downloads</h3>
            <p>Once approved, your asset is live. Users can download, rate, and follow you for updates.</p>
          </div>
        </div>
      </section>

      <Footer onScrollTo={scrollToSection} lang={lang} />

      {(modalState.type === 'login' || modalState.type === 'register') && (
        <AuthModal
          type={modalState.type}
          onClose={() => setModalState({ type: null, data: null })}
          onSubmit={(loggedInUser) => {
            setUser(loggedInUser);
            addToast('check-circle', `Welcome, ${loggedInUser.username}!`);
          }}
          lang={lang}
        />
      )}

      <div className="toast-wrap">
        {toasts.map(t => (
          <Toast key={t.id} id={t.id} icon={t.icon} message={t.message} onRemove={removeToast} />
        ))}
      </div>
    </>
  );
}
