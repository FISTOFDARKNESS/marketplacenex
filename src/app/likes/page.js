'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { proxyUrl } from '@/lib/storage-url';
import { Heart, Download } from 'lucide-react';

export default function LikesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.authenticated) { router.push('/'); return; }
      setUser(d.user);
    }).catch(() => router.push('/'));
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch('/api/likes').then(r => r.json()).then(d => {
      if (d.success) setAssets(d.likes);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  return (
    <>
      <Navbar user={user} onOpenAuth={() => {}} onLogout={() => router.push('/')} onScrollTo={() => {}} />
      <main style={{ maxWidth: 960, margin: '32px auto', padding: '0 24px' }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Liked Assets</h1>
        <p style={{ color: 'var(--muted)', marginBottom: 24, fontSize: 14 }}>Assets you have liked</p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>Loading...</div>
        ) : assets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>
            <Heart size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
            <div>No liked assets yet</div>
            <a href="/marketplace" style={{ color: 'var(--gold)', fontSize: 13 }}>Browse marketplace</a>
          </div>
        ) : (
          <div className="item-grid">
            {assets.map((asset, idx) => (
              <div key={asset.id} className="item-card" style={{ animationDelay: `${idx * 0.04}s` }} onClick={() => router.push(`/asset/${asset.id}`)}>
                <div className="item-card-img">
                  {asset.thumbnailUrl ? <Image src={proxyUrl(asset.thumbnailUrl)} alt={asset.name} width={180} height={180} sizes="180px" unoptimized /> : <div style={{ width: 80, height: 80, background: 'var(--bg-3)', borderRadius: 8 }} />}
                </div>
                <div className="item-card-info">
                  <h3 className="item-card-name">{asset.name}</h3>
                  <div className="item-card-meta">
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>{asset.assetType?.toUpperCase()}</span>
                    <span className="item-value">{asset.price === 'Free' ? 'Free' : `${asset.priceRobux} R$`}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                  <span><Download size={11} /> {asset.downloads}</span>
                  <span><Heart size={11} /> {asset.likesCount}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer onScrollTo={() => {}} lang="en" />
    </>
  );
}
