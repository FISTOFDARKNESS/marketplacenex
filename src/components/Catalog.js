'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import {
  LayoutGrid,
  Box,
  Image as ImageIcon,
  Music,
  Layers,
  Puzzle,
  Code,
  Sparkles,
  PlayCircle,
  Heart,
  Download,
  Search,
} from 'lucide-react';
import { locales } from '@/lib/locales';

const ASSET_TYPES = [
  { key: 'all', icon: LayoutGrid, label: 'All Assets' },
  { key: 'model', icon: Box, label: 'Models' },
  { key: 'decal', icon: ImageIcon, label: 'Decals' },
  { key: 'audio', icon: Music, label: 'Audio' },
  { key: 'mesh', icon: Layers, label: 'Meshes' },
  { key: 'plugin', icon: Puzzle, label: 'Plugins' },
  { key: 'script', icon: Code, label: 'Scripts' },
  { key: 'vfx', icon: Sparkles, label: 'VFX' },
  { key: 'animation', icon: PlayCircle, label: 'Animations' },
];

export default function Catalog({
  items,
  loadingItems,
  activeCatFilter,
  setActiveCatFilter,
  sortMode,
  setSortMode,
  totalItems,
  wishlist,
  toggleWishlist,
  onCardClick,
  lang = 'en',
}) {
  const t = locales[lang].catalog;
  const allCount = items.length;

  const catOptions = ASSET_TYPES.map(cat => ({
    key: cat.key,
    icon: cat.icon,
    label: cat.label,
    count: cat.key === 'all' ? allCount : items.filter(i => i.assetType === cat.key).length,
  }));

  return (
    <section className="catalog-section section-wrap" id="catalog">
      <div className="catalog-layout">
        {/* === SIDEBAR FILTERS === */}
        <aside className="catalog-sidebar">
          <div className="catalog-category-title">Categories</div>
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
        </aside>

        {/* === MAIN GRID === */}
        <main className="catalog-main">
          <div className="catalog-header">
            <div>
              <h2 className="catalog-title">{t.listingsHead}</h2>
              <p className="catalog-subtitle">
                {totalItems || items.length} {totalItems === 1 || (!totalItems && items.length === 1) ? t.verified : t.verifiedPlural} · {t.sortedBy}{' '}
                {sortMode === 'newest' ? 'newest' : sortMode === 'popular' ? 'popular' : sortMode === 'name' ? 'name' : 'price'}
              </p>
            </div>
            <label htmlFor="sortSelect" className="sr-only">{t.sortOptions.demand}</label>
            <select
              className="catalog-sort"
              id="sortSelect"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="popular">Most Downloaded</option>
              <option value="name">Name</option>
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
              items.map((it, idx) => (
                <div
                  key={it.id}
                  className="item-card"
                  style={{ animationDelay: `${idx * 0.04}s` }}
                  onClick={() => onCardClick(it)}
                >
                  <div className="item-card-img">
                    {it.img ? (
                      <Image
                        src={it.img}
                        alt={it.name}
                        width={180}
                        height={180}
                        sizes="(max-width: 768px) 120px, 180px"
                        priority={idx < 4}
                        unoptimized
                      />
                    ) : (
                      <div style={{ width: 80, height: 80, background: 'var(--bg-3)', borderRadius: 8 }} />
                    )}
                    {it.assetType && (
                      <span className={`asset-type-badge type-${it.assetType}`}>
                        {it.assetType}
                      </span>
                    )}
                  </div>
                  <div className="item-card-info">
                    <h3 className="item-card-name">{it.name}</h3>
                    <div className="item-card-meta">
                      <span className="item-creator">{it.owner?.username || 'Unknown'}</span>
                      <span className="item-value">{it.price === 'Free' ? 'Free' : `${it.priceRobux || it.price} R$`}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Download size={11} /> {it.downloads || 0}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Heart size={11} /> {it.likesCount || 0}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className={`empty-state ${items.length === 0 ? 'show' : ''}`} id="emptyState">
            {t.empty}
          </div>
        </main>
      </div>
    </section>
  );
}
