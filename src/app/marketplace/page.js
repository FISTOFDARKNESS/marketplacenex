'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { proxyUrl } from '@/lib/storage-url';
import { Heart, Download, Search, LayoutGrid, ArrowUpDown } from 'lucide-react';
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

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.authenticated) setUser(d.user);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ sort, page: String(page), limit: '24' });
    if (search) params.append('search', search);
    fetch(`/api/assets?${params}`).then(r => r.json()).then(d => {
      if (d.success) {
        setAssets(d.assets);
        setTotalPages(d.totalPages);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [search, sort, page]);

  return (
    <>
      <Navbar user={user} onOpenAuth={(t) => router.push(t === 'login' ? '/?login=1' : '/?register=1')} onLogout={() => router.push('/')} onScrollTo={() => {}} />
      <main style={{ maxWidth: 1280, margin: '32px auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <h1 style={{ fontSize: 24 }}>Marketplace</h1>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="search-box" style={{ width: 240 }}>
              <Search className="icon" />
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

        <div className="item-grid">
          {loading ? Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="item-card skeleton" style={{ animationDelay: `${i * 0.03}s` }}>
              <div className="skeleton-img pulse"></div>
              <div className="skeleton-text title pulse"></div>
              <div className="skeleton-text price pulse"></div>
            </div>
          )) : assets.length === 0 ? (
            <div className="empty-state show">
              <LayoutGrid size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
              <div>No assets found</div>
            </div>
          ) : assets.map((asset, idx) => (
            <div key={asset.id} className="item-card" style={{ animationDelay: `${idx * 0.03}s` }} onClick={() => router.push(`/asset/${asset.id}`)}>
              <div className="item-card-img">
                {asset.thumbnailUrl ? <Image src={proxyUrl(asset.thumbnailUrl)} alt={asset.name} width={180} height={180} sizes="180px" unoptimized /> : <div style={{ width: 80, height: 80, background: 'var(--bg-3)', borderRadius: 8 }} />}
              </div>
              <div className="item-card-info">
                <h3 className="item-card-name">{asset.name}</h3>
                <div className="item-card-meta">
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{asset.owner?.username || 'Unknown'}</span>
                  <span className="item-value">{asset.price === 'Free' ? 'Free' : `${asset.priceRobux} R$`}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Download size={11} /> {asset.downloads}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Heart size={11} /> {asset.likesCount}</span>
              </div>
            </div>
          ))}
        </div>

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
