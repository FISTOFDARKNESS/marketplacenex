'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Toast from '@/components/Toast';
import { proxyUrl } from '@/lib/storage-url';
import { Clock, CheckCircle, XCircle, Shield, Eye, ExternalLink } from 'lucide-react';
import { useLang } from '@/lib/LanguageProvider';

export default function QueuePage() {
  const router = useRouter();
  const { lang } = useLang();
  const [user, setUser] = useState(null);
  const [queue, setQueue] = useState([]);
  const [myAssets, setMyAssets] = useState([]);
  const [tab, setTab] = useState('my');
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.authenticated) { router.push('/'); return; }
      setUser(d.user);
    }).catch(() => router.push('/'));
  }, []);

  const fetchData = () => {
    setLoading(true);
    if (user?.role === 'admin') {
      fetch('/api/queue').then(r => r.json()).then(d => {
        if (d.success) setQueue(d.assets);
      }).catch(() => {}).finally(() => setLoading(false));
    }
    fetch('/api/assets?sort=newest&limit=50').then(r => r.json()).then(d => {
      if (d.success) setMyAssets(d.assets);
    }).catch(() => {});
  };

  useEffect(() => { if (user) fetchData(); }, [user]);

  const addToast = (icon, message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, icon, message }]);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const handleAction = async (assetId, action) => {
    const res = await fetch(`/api/queue/${assetId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, reason: action === 'reject' ? rejectReason : undefined }),
    });
    const d = await res.json();
    if (d.success) {
      addToast('check-circle', action === 'approve' ? 'Asset approved!' : 'Asset rejected');
      setQueue(prev => prev.filter(a => a.id !== assetId));
      setSelectedAsset(null);
      setRejectReason('');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      QUEUE: { background: 'rgba(234,200,71,0.15)', color: 'var(--gold)', label: 'Pending Review' },
      APPROVED: { background: 'rgba(74,222,128,0.15)', color: 'var(--green)', label: 'Approved' },
      REJECTED: { background: 'rgba(239,68,68,0.15)', color: 'var(--red)', label: 'Rejected' },
    };
    const s = styles[status] || styles.QUEUE;
    return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, ...s }}>{s.label}</span>;
  };

  if (!user) return null;

  return (
    <>
      <Navbar user={user} onOpenAuth={() => {}} onLogout={() => router.push('/')} onScrollTo={() => {}} />
      <main style={{ maxWidth: 960, margin: '32px auto', padding: '0 24px' }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Asset Queue</h1>
        <p style={{ color: 'var(--muted)', marginBottom: 24, fontSize: 14 }}>Track your submissions and manage pending reviews</p>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <button className={`tab-btn ${tab === 'my' ? 'active' : ''}`} onClick={() => setTab('my')}>
            <Clock size={14} /> My Submissions
          </button>
          {user?.role === 'admin' && (
            <button className={`tab-btn ${tab === 'admin' ? 'active' : ''}`} onClick={() => setTab('admin')}>
              <Shield size={14} /> Admin Queue ({queue.length})
            </button>
          )}
        </div>

        {tab === 'admin' && user?.role === 'admin' && (
          <div>
            {loading ? <div style={{ textAlign: 'center', padding: 48 }}>Loading...</div> : queue.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>No pending assets in queue</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {queue.map(asset => (
                  <div key={asset.id} style={{ display: 'flex', gap: 16, padding: 16, background: 'var(--bg-2)', borderRadius: 12, border: '1px solid var(--line)', alignItems: 'center' }}>
                    {asset.thumbnailUrl && (
                      <img src={proxyUrl(asset.thumbnailUrl)} alt="" style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover' }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{asset.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', gap: 12, marginTop: 4 }}>
                        <span>by {asset.owner?.username}</span>
                        <span>{asset.assetType?.toUpperCase()}</span>
                        <span>{new Date(asset.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="icon-btn" onClick={() => window.open(`/asset/${asset.id}`, '_blank')} title="Preview">
                        <Eye size={14} />
                      </button>
                      <button className="signup-btn" style={{ background: 'var(--green)', color: '#000', padding: '8px 16px' }} onClick={() => handleAction(asset.id, 'approve')}>
                        Approve
                      </button>
                      <button className="signup-btn" style={{ background: 'var(--red)', color: '#fff', padding: '8px 16px' }} onClick={() => setSelectedAsset(asset)}>
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'my' && (
          <div>
            {myAssets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>
                No assets yet. <a href="/upload" style={{ color: 'var(--gold)' }}>Upload your first asset</a>
              </div>
            ) : (
              <div className="item-grid">
                {myAssets.map(asset => (
                  <div key={asset.id} className="item-card" style={{ cursor: 'pointer' }} onClick={() => router.push(`/asset/${asset.id}`)}>
                    <div className="item-card-img">
                      {asset.thumbnailUrl ? <Image src={proxyUrl(asset.thumbnailUrl)} alt={asset.name} width={180} height={180} sizes="180px" unoptimized /> : <div style={{ width: 80, height: 80, background: 'var(--bg-3)', borderRadius: 8 }} />}
                    </div>
                    <div className="item-card-info">
                      <h3 className="item-card-name">{asset.name}</h3>
                      <div style={{ marginTop: 4 }}>{getStatusBadge(asset.status)}</div>
                      {asset.status === 'REJECTED' && asset.rejectionReason && (
                        <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 4 }}>{asset.rejectionReason}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedAsset && (
          <div className="modal-overlay show" onClick={() => setSelectedAsset(null)}>
            <div className="modal" style={{ gridTemplateColumns: '1fr', maxWidth: 400 }} onClick={e => e.stopPropagation()}>
              <h3 style={{ marginBottom: 12 }}>{`Reject "${selectedAsset.name}"`}</h3>
              <textarea className="upload-textarea" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason for rejection..." rows={3} />
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="hero-cta-secondary" onClick={() => { setSelectedAsset(null); setRejectReason(''); }} style={{ flex: 1 }}>Cancel</button>
                <button className="signup-btn" style={{ background: 'var(--red)', color: '#fff', flex: 1 }} onClick={() => handleAction(selectedAsset.id, 'reject')}>Reject</button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer onScrollTo={() => {}} lang={lang} />
      <div className="toast-wrap">
        {toasts.map(t => <Toast key={t.id} id={t.id} icon={t.icon} message={t.message} onRemove={removeToast} />)}
      </div>
    </>
  );
}
