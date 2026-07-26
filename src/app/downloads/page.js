'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { proxyUrl } from '@/lib/storage-url';
import { Download, FileType, Calendar } from 'lucide-react';

export default function DownloadsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.authenticated) { router.push('/'); return; }
      setUser(d.user);
    }).catch(() => router.push('/'));
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch('/api/history/downloads').then(r => r.json()).then(d => {
      if (d.success) setDownloads(d.downloads);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  return (
    <>
      <Navbar user={user} onOpenAuth={() => {}} onLogout={() => router.push('/')} onScrollTo={() => {}} />
      <main style={{ maxWidth: 960, margin: '32px auto', padding: '0 24px' }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Download History</h1>
        <p style={{ color: 'var(--muted)', marginBottom: 24, fontSize: 14 }}>Assets you have downloaded</p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>Loading...</div>
        ) : downloads.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>
            <Download size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
            <div>No downloads yet</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {downloads.map(d => (
              <div key={d.id} style={{ display: 'flex', gap: 16, padding: 12, background: 'var(--bg-2)', borderRadius: 12, border: '1px solid var(--line)', alignItems: 'center', cursor: 'pointer' }} onClick={() => router.push(`/asset/${d.asset?.id}`)}>
                <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', background: 'var(--bg-3)', flexShrink: 0 }}>
                  {d.asset?.thumbnailUrl ? (
                    <Image src={proxyUrl(d.asset.thumbnailUrl)} alt="" width={48} height={48} style={{ objectFit: 'cover' }} unoptimized />
                  ) : (
                    <div style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                      <FileType size={20} />
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{d.asset?.name || 'Unknown Asset'}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', gap: 12, marginTop: 2 }}>
                    <span><Calendar size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />{new Date(d.createdAt).toLocaleDateString()}</span>
                    <span>{d.asset?.assetType?.toUpperCase()}</span>
                    <span>{d.asset?.price === 'Free' ? 'Free' : `${d.asset?.priceRobux} R$`}</span>
                  </div>
                </div>
                <Download size={16} style={{ opacity: 0.4, flexShrink: 0 }} />
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer onScrollTo={() => {}} lang="en" />
    </>
  );
}
