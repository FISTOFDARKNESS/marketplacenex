'use client';

import Image from 'next/image';
import {
  LayoutGrid,
  Crown,
  Glasses,
  Sword,
  Gem,
  Star,
  Check,
  Bitcoin,
  Heart,
  DollarSign,
  Wallet,
} from 'lucide-react';
import { locales } from '@/lib/locales';

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

  return (
    <section className="catalog-section section-wrap" id="catalog">
      <div className="section-head reveal in-view">
        <div className="section-eyebrow">{t.eyebrow}</div>
        <h2>{t.title}</h2>
        <p>{t.description}</p>
      </div>

      <div className="layout">
        <aside className="sidebar reveal in-view">
          <p className="sidebar-label">{t.category}</p>
          <button
            className={`filter-option ${activeCatFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCatFilter('all')}
          >
            <span className="filter-row">
              <LayoutGrid className="icon" />
              {t.all}
            </span>
            <span className="count">{allCount}</span>
          </button>

          <p className="sidebar-label">{t.rarity}</p>
          <button
            className={`filter-option ${activeRarityFilter === 'legendary' ? 'active' : ''}`}
            onClick={() => setActiveRarityFilter(activeRarityFilter === 'legendary' ? null : 'legendary')}
          >
            <span className="filter-row">
              <Gem className="icon" />
              {t.legendary}
            </span>
            <span className="count">{legendaryCount}</span>
          </button>
          <button
            className={`filter-option ${activeRarityFilter === 'rare' ? 'active' : ''}`}
            onClick={() => setActiveRarityFilter(activeRarityFilter === 'rare' ? null : 'rare')}
          >
            <span className="filter-row">
              <Star className="icon" />
              {t.rare}
            </span>
            <span className="count">{rareCount}</span>
          </button>

          <p className="sidebar-label">{t.priceRange}</p>
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

          <p className="sidebar-label">{t.payment}</p>
          <div className="filter-option active">
            <span className="filter-row">
              <Bitcoin className="icon" />
              Crypto
            </span>
            <Check className="icon" />
          </div>
          <div className="filter-option">
            <span className="filter-row">
              <Wallet className="icon" />
              PayPal
            </span>
          </div>
          <div className="filter-option">
            <span className="filter-row">
              <DollarSign className="icon" />
              Cash App
            </span>
          </div>

          <div className="sidebar-cta">
            <p>{t.sellP}</p>
            <button id="sellBtn" onClick={onStartSelling}>{t.sellBtn}</button>
          </div>
        </aside>

        <main className="main-content">
          <div className="main-head">
            <div>
              <h3>{t.listingsHead}</h3>
              <p id="resultCount">
                {items.length} {items.length !== 1 ? t.verifiedPlural : t.verified} · {t.sortedBy}{' '}
                {sortMode === 'demand' ? (lang === 'pt' ? 'demanda' : 'demand') : (lang === 'pt' ? 'preço' : 'price')}
              </p>
            </div>
            <label htmlFor="sortSelect" className="sr-only">{t.sortOptions.demand}</label>
            <select
              className="sort-select"
              id="sortSelect"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value)}
            >
              <option value="demand">{t.sortOptions.demand}</option>
              <option value="high">{t.sortOptions.high}</option>
              <option value="low">{t.sortOptions.low}</option>
            </select>
          </div>

          <div className="bento" id="bentoGrid">
            {loadingItems ? (
              Array.from({ length: 8 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bento-card skeleton"
                  style={{ animationDelay: `${idx * 0.04}s`, opacity: 1, cursor: 'default' }}
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
                  className={`bento-card ${it.size}`}
                  style={{ animationDelay: `${idx * 0.04}s`, opacity: 1 }}
                  onClick={() => onCardClick(it)}
                >
                  <div className="crypto-dot">
                    <Bitcoin className="icon" />
                  </div>
                  {it.rarity === 'legendary' && <span className="rarity-pill">{t.legendary}</span>}
                  <button
                    className={`wishlist-btn ${wishlist.has(it.id) ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(it.id);
                    }}
                    aria-label={wishlist.has(it.id) ? (lang === 'pt' ? 'Remover dos favoritos' : 'Remove from favorites') : (lang === 'pt' ? 'Adicionar aos favoritos' : 'Add to favorites')}
                  >
                    <Heart className="icon" />
                  </button>
                  <div className="bento-img">
                    <Image
                      src={it.img}
                      alt={it.name}
                      width={250}
                      height={250}
                      sizes="(max-width: 768px) 150px, 250px"
                      priority={idx < 4}
                      unoptimized
                    />
                  </div>
                    <div className="bento-info">
                      <h3>{it.name}</h3>
                      <div className="bento-meta">
                        <span className="bento-rap">RAP: {it.rapLabel}</span>
                        <span className="bento-value">Value: {it.price.toLocaleString()}</span>
                      </div>
                      <div className="bento-usd">${it.usdPrice}</div>
                      {it.size === 'feature' && (
                      <button
                        className="bento-buy"
                        onClick={(e) => {
                          e.stopPropagation();
                          onBuyClick(it);
                        }}
                      >
                        {t.buyNow}
                      </button>
                    )}
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

