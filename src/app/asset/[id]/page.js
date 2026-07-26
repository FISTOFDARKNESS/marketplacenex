'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Toast from '@/components/Toast';
import { Heart, Download, Star, MessageCircle, User, Calendar, Tag, ExternalLink, ThumbsUp } from 'lucide-react';

export default function AssetDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [comment, setComment] = useState('');
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.authenticated) setUser(d.user);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`/api/assets/${id}`).then(r => r.json()).then(d => {
      if (d.success) setAsset(d.asset);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const addToast = (icon, message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, icon, message }]);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const handleLike = async () => {
    if (!user) { addToast('info', 'Login to like assets'); return; }
    const res = await fetch(`/api/assets/${id}/like`, { method: 'POST' });
    const d = await res.json();
    if (d.success) {
      setLiked(d.liked);
      setAsset(prev => prev ? { ...prev, likesCount: prev.likesCount + (d.liked ? 1 : -1) } : prev);
    }
  };

  const handleDownload = async () => {
    if (!user) { addToast('info', 'Login to download assets'); return; }
    const res = await fetch(`/api/assets/${id}/download`, { method: 'POST' });
    const d = await res.json();
    if (d.success) {
      setAsset(prev => prev ? { ...prev, downloads: prev.downloads + 1 } : prev);
      window.open(d.downloadUrl, '_blank');
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    const res = await fetch(`/api/assets/${id}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: comment }),
    });
    const d = await res.json();
    if (d.success) {
      setAsset(prev => prev ? { ...prev, comments: [d.comment, ...prev.comments] } : prev);
      setComment('');
    }
  };

  if (loading) return <div style={{ padding: 48, textAlign: 'center' }}>Loading...</div>;
  if (!asset) return <div style={{ padding: 48, textAlign: 'center' }}>Asset not found</div>;

  return (
    <>
      <Navbar user={user} onOpenAuth={() => {}} onLogout={() => router.push('/')} onScrollTo={() => {}} />
      <main style={{ maxWidth: 960, margin: '32px auto', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 32 }}>
          <div>
            {asset.thumbnailUrl && (
              <Image src={asset.thumbnailUrl} alt={asset.name} width={460} height={460} style={{ width: '100%', borderRadius: 12, objectFit: 'cover' }} unoptimized />
            )}
            {asset.videoUrl && (
              <video src={asset.videoUrl} controls crossOrigin="anonymous" style={{ width: '100%', borderRadius: 12, marginTop: 12 }} />
            )}
          </div>
          <div>
            <h1 style={{ fontSize: 28, marginBottom: 8 }}>{asset.name}</h1>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16, fontSize: 13, color: 'var(--muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <User size={14} /> <a href={`/profile/${asset.owner?.username}`} style={{ color: 'var(--gold)' }}>{asset.owner?.username}</a>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={14} /> {new Date(asset.createdAt).toLocaleDateString()}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Tag size={14} /> {asset.assetType?.toUpperCase()}
              </span>
            </div>

            {asset.tags?.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                {asset.tags.map(t => (
                  <span key={t} style={{ padding: '3px 10px', borderRadius: 20, background: 'var(--bg-3)', fontSize: 11, color: 'var(--muted)' }}>{t}</span>
                ))}
              </div>
            )}

            <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--gold)', marginBottom: 20 }}>
              {asset.price === 'Free' ? 'Free' : `${asset.priceRobux} R$`}
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              <button className="hero-cta-primary" onClick={handleDownload}>
                <Download size={16} /> Download ({asset.downloads})
              </button>
              <button className={`icon-btn ${liked ? 'active' : ''}`} onClick={handleLike} style={{ width: 48, height: 48, fontSize: 13 }}>
                <Heart size={18} /> {asset.likesCount}
              </button>
            </div>

            <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>{asset.description || 'No description provided.'}</p>
          </div>
        </div>

        {asset.comments?.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ marginBottom: 16 }}>Comments ({asset.comments.length})</h3>
            {user && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input className="upload-input" value={comment} onChange={e => setComment(e.target.value)} placeholder="Write a comment..." style={{ flex: 1 }} />
                <button className="hero-cta-primary" onClick={handleComment} style={{ padding: '10px 20px' }}>Post</button>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {asset.comments.map(c => (
                <div key={c.id} style={{ padding: 12, background: 'var(--bg-2)', borderRadius: 10, border: '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 12 }}>
                    <strong>{c.user?.username}</strong>
                    <span style={{ color: 'var(--muted)' }}>{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div style={{ fontSize: 13 }}>{c.content}</div>
                </div>
              ))}
            </div>
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
