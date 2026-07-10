'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { formatNumber } from '@/lib/format';
import {
  LayoutGrid,
  Crown,
  Gem,
  Star,
  Sword,
  Check,
  Bitcoin,
  Heart,
  DollarSign,
  Wallet,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { locales } from '@/lib/locales';

function sparklinePath(data, w = 80, h = 28) {
  if (!data || data.length < 2) return '';
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  return data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join('');
}

function deterministicSparkline(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  const vals = [];
  let seed = Math.abs(h);
  let base = 50 + (seed % 200);
  for (let i = 0; i < 20; i++) {
    seed = (seed * 16807 + 1) % 2147483647;
    const drift = (seed % 40) - 20;
    base = Math.max(10, base + drift);
    vals.push(base);
  }
  return vals;
}

const MOCK_FEED = [
  { user: 'NexTrader92', item: 'Silver King Night', method: 'Crypto', time: '2s' },
  { user: 'BloxKing', item: 'Classic Fedora', method: 'Crypto', time: '7s' },
  { user: 'RareHunter', item: 'Black Iron Horns', method: 'PayPal', time: '14s' },
  { user: 'LimitedLord', item: 'Valkyrie Helm', method: 'Crypto', time: '23s' },
  { user: 'PixelWizard', item: 'Sparkle Time Fedora', method: 'Cash App', time: '31s' },
  { user: 'RobuxRuler', item: 'Dominus Empyreus', method: 'Crypto', time: '42s' },
  { user: 'AssetAce', item: 'Purple Phantom', method: 'PayPal', time: '55s' },
  { user: 'TradeMaster', item: 'Golden Crown', method: 'Crypto', time: '1m' },
];

export default function Catalog({
  items,
  loadingItems,
  activeCatFilter,
  setActiveCatFilter,
  activeRarityFilter,
  setActiveRarityFilter,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  sortMode,
  setSortMode,
  wishlist,
  toggleWishlist,
  onStartSelling,
  onCardClick,
  onBuyClick,
  lang = 'en',
}) {
  const t = locales[lang].catalog;
  const allCount = items.length;
  const legendaryCount = items.filter(i => i.rarity === 'legendary').length;
  const rareCount = items.filter(i => i.rarity === 'rare').length;
  const uncommonCount = items.filter(i => i.rarity === 'uncommon').length;
  const commonCount = items.filter(i => i.rarity === 'common').length;

  const grail = useMemo(() => {
    if (!items.length) return null;
    return items.reduce((a, b) => ((a.price || 0) > (b.price || 0) ? a : b));
  }, [items]);

  const sparklines = useMemo(() => {
    const map = {};
    for (const it of items) {
      map[it.id] = deterministicSparkline(it.id);
    }
    return map;
  }, [items]);

  const catOptions = [
    { key: 'all', icon: LayoutGrid, label: t.all, count: allCount },
  ];
  const rarityOptions = [
    { key: 'legendary', icon: Gem, label: t.legendary, count: legendaryCount },
    { key: 'rare', icon: Star, label: t.rare, count: rareCount },
    { key: 'uncommon', icon: Crown, label: 'Uncommon', count: uncommonCount },
    { key: 'common', icon: Sword, label: 'Common', count: commonCount },
  ];
  const paymentOptions = [
    { key: 'crypto', icon: Bitcoin, label: 'Crypto' },
    { key: 'paypal', icon: Wallet, label: 'PayPal' },
    { key: 'cashapp', icon: DollarSign, label: 'Cash App' },
  ];

  return (
    <section className="catalog-section section-wrap" id="catalog">
      <div className="catalog-layout">
        {/* === SIDEBAR FILTERS === */}
        <aside className="catalog-sidebar">
          <div className="sidebar-title">{t.category}</div>
          {catOptions.map((opt) => (
            <button
              key={opt.key}
              className={`filter-item ${activeCatFilter === opt.key ? 'active' : ''}`}
              onClick={() => setActiveCatFilter(opt.key)}
            >
              <span className="filter-item-row">
                <opt.icon className="filter-item-icon" />
                {opt.label}
              </span>
              <span className="filter-item-count">[{opt.count}]</span>
            </button>
          ))}

          <div className="sidebar-title">{t.rarity}</div>
          {rarityOptions.map((opt) => (
            <button
              key={opt.key}
              className={`filter-item ${activeRarityFilter === opt.key ? 'active' : ''}`}
              onClick={() => setActiveRarityFilter(activeRarityFilter === opt.key ? null : opt.key)}
            >
              <span className="filter-item-row">
                <opt.icon className="filter-item-icon" />
                {opt.label}
              </span>
              <span className="filter-item-count">[{opt.count}]</span>
            </button>
          ))}

          <div className="sidebar-title">{t.priceRange}</div>
          <div className="price-range">
            <input
              id="minPrice"
              placeholder={t.min}
              type="number"
              value={minPrice || ''}
              onChange={(e) => setMinPrice(e.target.value ? parseFloat(e.target.value) : null)}
            />
            <input
              id="maxPrice"
              placeholder={t.max}
              type="number"
              value={maxPrice || ''}
              onChange={(e) => setMaxPrice(e.target.value ? parseFloat(e.target.value) : null)}
            />
          </div>

          <div className="sidebar-title">{t.payment}</div>
          {paymentOptions.map((opt) => (
            <div key={opt.key} className={`payment-option ${opt.key === 'crypto' ? 'active' : ''}`}>
              <span className="filter-item-row">
                <opt.icon className="filter-item-icon" />
                {opt.label}
              </span>
              {opt.key === 'crypto' && <Check className="payment-check" />}
            </div>
          ))}

          <div className="sidebar-cta-card">
            <div className="sidebar-cta-glow" />
            <p className="sidebar-cta-text">Got limiteds sitting idle?</p>
            <button className="sidebar-cta-btn" onClick={onStartSelling}>
              Start selling
            </button>
          </div>
        </aside>

        {/* === MAIN GRID === */}
        <main className="catalog-main">
          <div className="catalog-header">
            <div>
              <h2 className="catalog-title">{t.listingsHead}</h2>
              <p className="catalog-subtitle">
                {items.length} {items.length !== 1 ? t.verifiedPlural : t.verified} · {t.sortedBy}{' '}
                {sortMode === 'demand'
                  ? (lang === 'pt' ? 'demanda' : 'demand')
                  : sortMode === 'high'
                    ? (lang === 'pt' ? 'preço' : 'price')
                    : (lang === 'pt' ? 'preço' : 'price')}
              </p>
            </div>
            <label htmlFor="sortSelect" className="sr-only">{t.sortOptions.demand}</label>
            <select
              className="catalog-sort"
              id="sortSelect"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value)}
            >
              <option value="demand">{t.sortOptions.demand}</option>
              <option value="high">{t.sortOptions.high}</option>
              <option value="low">{t.sortOptions.low}</option>
            </select>
          </div>

          <div className="item-grid">
            {loadingItems ? (
              Array.from({ length: 8 }).map((_, idx) => (
                <div
                  key={idx}
                  className="item-card skeleton"
                  style={{ animationDelay: `${idx * 0.04}s` }}
                >
                  <div className="skeleton-img pulse"></div>
                  <div className="skeleton-text title pulse"></div>
                  <div className="skeleton-text price pulse"></div>
                </div>
              ))
            ) : (
              <>
                {grail && (
                  <div className="grail-card" onClick={() => onCardClick(grail)}>
                    <div className="grail-aura" />
                    <div className="grail-badge">Featured Grail</div>
                    <button
                      className={`item-favorite grail-fav ${wishlist.has(grail.id) ? 'active' : ''}`}
                      onClick={(e) => { e.stopPropagation(); toggleWishlist(grail.id); }}
                      aria-label={wishlist.has(grail.id) ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart className="icon" />
                    </button>
                    <div className="grail-img">
                      <Image
                        src={grail.img}
                        alt={grail.name}
                        width={300}
                        height={300}
                        sizes="300px"
                        priority
                        unoptimized
                      />
                    </div>
                    <div className="grail-info">
                      <h3 className="grail-name">{grail.name}</h3>
                      <div className="grail-price">
                        <span className="grail-rap">RAP {grail.rapLabel}</span>
                        <span className="grail-value">${formatNumber(grail.price)}</span>
                      </div>
                      <button
                        className="grail-buy"
                        onClick={(e) => { e.stopPropagation(); onBuyClick(grail); }}
                      >
                        Start Selling
                      </button>
                    </div>
                  </div>
                )}

                {items.filter(it => it.id !== (grail?.id)).map((it, idx) => {
                  const sd = sparklines[it.id] || [];
                  return (
                    <div
                      key={it.id}
                      className="item-card"
                      style={{ animationDelay: `${idx * 0.04}s` }}
                      onClick={() => onCardClick(it)}
                    >
                      <button
                        className={`item-favorite ${wishlist.has(it.id) ? 'active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); toggleWishlist(it.id); }}
                        aria-label={wishlist.has(it.id) ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Heart className="icon" />
                      </button>
                      <div className="item-card-img">
                        <Image
                          src={it.img}
                          alt={it.name}
                          width={180}
                          height={180}
                          sizes="(max-width: 768px) 120px, 180px"
                          priority={idx < 4}
                          unoptimized
                        />
                      </div>
                      <div className="item-card-info">
                        <h3 className="item-card-name">{it.name}</h3>
                        <div className="item-card-meta">
                          <span className="item-rap">RAP {it.rapLabel}</span>
                          <span className="item-value">${formatNumber(it.price)}</span>
                        </div>
                      </div>
                      <div className="item-sparkline-wrap">
                        <svg width="80" height="28" viewBox="0 0 80 28" className="item-sparkline">
                          <path d={sparklinePath(sd)} fill="none" stroke="#EAC847" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div className="crypto-indicator">
                        <Bitcoin className="icon" />
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          <div className={`empty-state ${items.length === 0 ? 'show' : ''}`} id="emptyState">
            {t.empty}
          </div>
        </main>

        {/* === MARKET ACTIVITY FEED === */}
        <aside className="market-feed">
          <div className="feed-header">
            <TrendingUp className="icon" />
            <span>Market Activity</span>
          </div>
          <div className="feed-body">
            {MOCK_FEED.map((entry, idx) => (
              <div key={idx} className="feed-item">
                <span className="feed-user">{entry.user}</span>
                <span className="feed-action">traded</span>
                <span className="feed-item-name">{entry.item}</span>
                <span className="feed-via">via</span>
                <span className="feed-method">{entry.method}</span>
                <span className="feed-time">
                  <Clock className="icon" />
                  {entry.time} ago
                </span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
