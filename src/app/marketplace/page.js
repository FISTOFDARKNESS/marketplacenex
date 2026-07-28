'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Catalog from '@/components/Catalog';
import { proxyUrl } from '@/lib/storage-url';
import { Search } from 'lucide-react';
import { useLang } from '@/lib/LanguageProvider';

export default function MarketplacePage() {
  const router = useRouter();
  const { lang } = useLang();
  const [user, setUser] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeCat, setActiveCat] = useState('all');

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.authenticated) setUser(d.user);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ sort, page: String(page), limit: '24' });
    if (search) params.append('search', search);
    if (activeCat !== 'all') params.append('assetType', activeCat);
    fetch(`/api/assets?${params}`).then(r => r.json()).then(d => {
      if (d.success) {
        setAssets(d.assets);
        setTotalPages(d.totalPages);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [search, sort, page, activeCat]);

  const handleCardClick = (asset) => {
    router.push(`/asset/${asset.id}`);
  };

  return (
    <>
      <Navbar user={user} onOpenAuth={(t) => router.push(t === 'login' ? '/?login=1' : '/?register=1')} onLogout={() => router.push('/')} onScrollTo={() => {}} />
      <main style={{ maxWidth: 1280, margin: '32px auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <h1 style={{ fontSize: 24 }}>Marketplace</h1>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="search-box" style={{ width: 240 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.5, pointerEvents: 'none' }} />
              <input placeholder="Search assets..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <select className="catalog-sort" value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="popular">Most Downloaded</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>

        <Catalog
          items={assets}
          loadingItems={loading}
          activeCatFilter={activeCat}
          setActiveCatFilter={(cat) => { setActiveCat(cat); setPage(1); }}
          sortMode={sort}
          setSortMode={(s) => { setSort(s); setPage(1); }}
          totalItems={assets.length}
          wishlist={new Set()}
          toggleWishlist={() => {}}
          onCardClick={handleCardClick}
          lang={lang}
        />

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} className={`pagination-btn ${page === i + 1 ? 'active' : ''}`} onClick={() => setPage(i + 1)}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </main>
      <Footer onScrollTo={() => {}} lang={lang} />
    </>
  );
}
