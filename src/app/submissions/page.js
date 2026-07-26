'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Toast from '@/components/Toast';
import { Clock, CheckCircle, XCircle, Eye } from 'lucide-react';

const statusIcons = { PENDING: Clock, APPROVED: CheckCircle, REJECTED: XCircle };
const statusColors = { PENDING: 'var(--gold)', APPROVED: '#22c55e', REJECTED: '#ef4444' };
const statusLabels = { PENDING: 'Pending Review', APPROVED: 'Approved', REJECTED: 'Rejected' };

export default function SubmissionsPage() {
  const [user, setUser] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const router = useRouter();

  const addToast = (icon, message) => {
    const t = Date.now();
    setToasts(prev => [...prev, { id: t, icon, message }]);
  };
  const removeToast = (tid) => setToasts(prev => prev.filter(t => t.id !== tid));

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.authenticated) { router.push('/'); return; }
      setUser(d.user);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/assets?ownerId=${user.id}&limit=100`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setAssets(d.assets);
        else addToast('alert-triangle', 'Failed to load submissions');
      })
      .catch(() => addToast('alert-triangle', 'Failed to load submissions'))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <>
      <Navbar user={user} onOpenAuth={() => {}} onLogout={() => router.push('/')} onScrollTo={() => {}} />
      <main style={{ maxWidth: 900, margin: '48px auto', padding: '0 24px' }}>
        <h1 style={{ fontSize: 24, marginBottom: 24 }}>My Submissions</h1>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>Loading...</div>
        ) : assets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>You have not submitted any assets yet.</div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {assets.map(asset => {
              const StatusIcon = statusIcons[asset.status] || Clock;
              return (
                <div key={asset.id} style={{ display: 'flex', gap: 16, padding: 16, background: 'var(--bg-2)', borderRadius: 12, alignItems: 'center' }}>
                  <img src={asset.thumbnail || '/placeholder.png'} alt="" style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{asset.name}</div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <StatusIcon size={12} style={{ color: statusColors[asset.status] }} />
                        {statusLabels[asset.status] || asset.status}
                      </span>
                      <span>{asset._count?.downloadsRel || 0} downloads</span>
                      <span>{asset.price === 'Robux' ? `${asset.priceRobux} R$` : 'Free'}</span>
                    </div>
                    {asset.rejectionReason && (
                      <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>Reason: {asset.rejectionReason}</div>
                    )}
                  </div>
                  <button className="hero-cta-secondary" style={{ padding: '8px 16px', fontSize: 12 }} onClick={() => router.push(`/asset/${asset.id}`)}>
                    <Eye size={14} /> View
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer onScrollTo={() => {}} lang="en" />
      <div className="toast-wrap">
        {toasts.map(t => <Toast key={t.id} id={t.id} icon={t.icon} message={t.message} onRemove={removeToast} />)}
      </div>
    </>
  );
}
