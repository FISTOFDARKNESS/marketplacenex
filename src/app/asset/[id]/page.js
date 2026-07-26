'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Toast from '@/components/Toast';
import { proxyUrl } from '@/lib/storage-url';
import { Heart, Download, Star, User, Calendar, Tag, UserPlus, UserCheck, MessageCircle, Star as StarIcon } from 'lucide-react';

export default function AssetDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
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

  useEffect(() => {
    if (asset?.owner && user && user.id !== asset.owner.id) {
      fetch(`/api/follow?userId=${asset.owner.id}`).then(r => r.json()).then(d => {
        if (d.success) setIsFollowing(d.isFollowing);
      }).catch(() => {});
    }
  }, [asset?.owner?.id, user]);

  const addToast = (icon, message) => {
    const t = Date.now();
    setToasts(prev => [...prev, { id: t, icon, message }]);
  };
  const removeToast = (tid) => setToasts(prev => prev.filter(t => t.id !== tid));

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
      setAsset(prev => prev ? { ...prev, comments: [d.comment, ...(prev.comments || [])] } : prev);
      setComment('');
    }
  };

  const handleReview = async () => {
    if (!rating) { addToast('info', 'Select a star rating'); return; }
    const res = await fetch(`/api/assets/${id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, comment: reviewText || null }),
    });
    const d = await res.json();
    if (d.success) {
      addToast('star', 'Review submitted!');
      setAsset(prev => {
        const existing = (prev.reviews || []).filter(r => r.user?.id !== user.id);
        const newReview = { ...d.review, user: { id: user.id, username: user.username, avatarUrl: user.avatarUrl } };
        const newReviews = [newReview, ...existing];
        const avg = newReviews.reduce((s, r) => s + r.rating, 0) / newReviews.length;
        return { ...prev, reviews: newReviews, averageRating: Math.round(avg * 10) / 10, reviewCount: newReviews.length };
      });
      setRating(0);
      setReviewText('');
    }
  };

  const handleFollow = async () => {
    if (!user) { addToast('info', 'Login to follow users'); return; }
    const res = await fetch('/api/follow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followingId: asset.owner.id }),
    });
    const d = await res.json();
    if (d.success) setIsFollowing(d.following);
  };

  const userReview = asset?.reviews?.find(r => r.user?.id === user?.id);
  const avgRating = asset?.averageRating || 0;

  if (loading) return <div style={{ padding: 48, textAlign: 'center' }}>Loading...</div>;
  if (!asset) return <div style={{ padding: 48, textAlign: 'center' }}>Asset not found</div>;

  return (
    <>
      <Navbar user={user} onOpenAuth={() => {}} onLogout={() => router.push('/')} onScrollTo={() => {}} />
      <main style={{ maxWidth: 960, margin: '32px auto', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 32 }}>
          <div>
            {asset.thumbnailUrl && (
              <Image src={proxyUrl(asset.thumbnailUrl)} alt={asset.name} width={460} height={460} style={{ width: '100%', borderRadius: 12, objectFit: 'cover' }} unoptimized />
            )}
            {asset.videoUrl && (
              <video src={proxyUrl(asset.videoUrl)} loop muted autoPlay playsInline crossOrigin="anonymous" style={{ width: '100%', borderRadius: 12, marginTop: 12 }} />
            )}
          </div>
          <div>
            <h1 style={{ fontSize: 28, marginBottom: 8 }}>{asset.name}</h1>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 8, fontSize: 13, color: 'var(--muted)' }}>
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

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 2 }}>
                {[1,2,3,4,5].map(s => (
                  <StarIcon key={s} size={14} fill={s <= Math.round(avgRating) ? 'var(--gold)' : 'var(--bg-3)'} color={s <= Math.round(avgRating) ? 'var(--gold)' : 'var(--line)'} />
                ))}
              </div>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{avgRating > 0 ? avgRating.toFixed(1) : 'No ratings'} ({asset.reviewCount || 0})</span>
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

            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              <button className="hero-cta-primary" onClick={handleDownload}>
                <Download size={16} /> Download ({asset.downloads})
              </button>
              <button className={`icon-btn ${liked ? 'active' : ''}`} onClick={handleLike} style={{ width: 48, height: 48 }}>
                <Heart size={18} /> {asset.likesCount}
              </button>
              {user && user.id !== asset.owner?.id && (
                <button className={`icon-btn ${isFollowing ? 'active' : ''}`} onClick={handleFollow} style={{ width: 48, height: 48 }}>
                  {isFollowing ? <UserCheck size={18} /> : <UserPlus size={18} />}
                </button>
              )}
            </div>

            <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>{asset.description || 'No description provided.'}</p>
          </div>
        </div>

        <div style={{ marginBottom: 32 }}>
          <h3 style={{ marginBottom: 16 }}>
            <Star size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
            Reviews ({asset.reviewCount || 0})
          </h3>
          {user && !userReview && user.id !== asset.owner?.id && (
            <div style={{ padding: 16, background: 'var(--bg-2)', borderRadius: 12, border: '1px solid var(--line)', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 13 }}>Your rating:</span>
                <div style={{ display: 'flex', gap: 4 }} onMouseLeave={() => setHoverRating(0)}>
                  {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={() => setRating(s)} onMouseEnter={() => setHoverRating(s)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      <StarIcon size={22} fill={s <= (hoverRating || rating) ? 'var(--gold)' : 'var(--bg-3)'} color={s <= (hoverRating || rating) ? 'var(--gold)' : 'var(--line)'} />
                    </button>
                  ))}
                </div>
              </div>
              <textarea className="upload-textarea" value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Write a review (optional)..." rows={2} style={{ marginBottom: 8 }} />
              <button className="hero-cta-primary" style={{ padding: '8px 20px', fontSize: 12 }} onClick={handleReview}>Submit Review</button>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(asset.reviews || []).map(r => (
              <div key={r.id} style={{ padding: 12, background: 'var(--bg-2)', borderRadius: 10, border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 12 }}>
                  <strong>{r.user?.username}</strong>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[1,2,3,4,5].map(s => (
                      <StarIcon key={s} size={12} fill={s <= r.rating ? 'var(--gold)' : 'var(--bg-3)'} color={s <= r.rating ? 'var(--gold)' : 'var(--line)'} />
                    ))}
                  </div>
                  <span style={{ color: 'var(--muted)' }}>{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                {r.comment && <div style={{ fontSize: 13 }}>{r.comment}</div>}
              </div>
            ))}
            {(!asset.reviews || asset.reviews.length === 0) && (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--muted)', fontSize: 13 }}>No reviews yet</div>
            )}
          </div>
        </div>

        <div style={{ marginBottom: 32 }}>
          <h3 style={{ marginBottom: 16 }}>
            <User size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
            About the Creator
          </h3>
          <div style={{ padding: 16, background: 'var(--bg-2)', borderRadius: 12, border: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-3)', overflow: 'hidden' }}>
                {asset.owner?.avatarUrl ? <img src={asset.owner.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={20} style={{ padding: 10, opacity: 0.4 }} />}
              </div>
              <div>
                <a href={`/profile/${asset.owner?.username}`} style={{ fontWeight: 600, color: 'var(--gold)' }}>{asset.owner?.username}</a>
                {asset.owner?.aboutMe && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{asset.owner.aboutMe}</div>}
              </div>
              {user && user.id !== asset.owner?.id && (
                <button className={`signup-btn ${isFollowing ? 'purchase-btn-secondary' : ''}`} style={{ marginLeft: 'auto', padding: '6px 14px', fontSize: 11 }} onClick={handleFollow}>
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 32 }}>
          <h3 style={{ marginBottom: 16 }}>
            <MessageCircle size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
            Comments ({(asset.comments || []).length})
          </h3>
          {user && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input className="upload-input" value={comment} onChange={e => setComment(e.target.value)} placeholder="Write a comment..." style={{ flex: 1 }} />
              <button className="hero-cta-primary" onClick={handleComment} style={{ padding: '10px 20px' }}>Post</button>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(asset.comments || []).map(c => (
              <div key={c.id} style={{ padding: 12, background: 'var(--bg-2)', borderRadius: 10, border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 12 }}>
                  <strong>{c.user?.username}</strong>
                  <span style={{ color: 'var(--muted)' }}>{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                <div style={{ fontSize: 13 }}>{c.content}</div>
              </div>
            ))}
            {(!asset.comments || asset.comments.length === 0) && (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--muted)', fontSize: 13 }}>No comments yet</div>
            )}
          </div>
        </div>
      </main>
      <Footer onScrollTo={() => {}} lang="en" />
      <div className="toast-wrap">
        {toasts.map(t => <Toast key={t.id} id={t.id} icon={t.icon} message={t.message} onRemove={removeToast} />)}
      </div>
    </>
  );
}
