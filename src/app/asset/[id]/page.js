'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Toast from '@/components/Toast';
import { proxyUrl } from '@/lib/storage-url';
import { sanitizeText } from '@/lib/sanitize';
import { Heart, Download, Star, User, Calendar, Tag, UserPlus, UserCheck, MessageCircle, Star as StarIcon, Flag, Edit, Trash2 } from 'lucide-react';

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
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);

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
    try {
      const res = await fetch(`/api/storage/download/${id}`);
      if (!res.ok) {
        const d = await res.json();
        addToast('alert-triangle', d.error || 'Download failed');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = `asset_${id}.rbxm`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setAsset(prev => prev ? { ...prev, downloads: prev.downloads + 1 } : prev);
    } catch (err) {
      addToast('alert-triangle', 'Download failed');
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

  const handleReport = async () => {
    if (!reportReason.trim() || reportReason.trim().length < 10) {
      addToast('info', 'Please provide a reason (min 10 characters)');
      return;
    }
    const res = await fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId: id, reason: reportReason }),
    });
    const d = await res.json();
    if (d.success) {
      addToast('check-circle', 'Report submitted');
      setShowReport(false);
      setReportReason('');
    } else {
      addToast('alert-triangle', d.error || 'Failed to report');
    }
  };

  const handleDelete = async () => {
    const res = await fetch(`/api/assets/${id}`, { method: 'DELETE' });
    const d = await res.json();
    if (d.success) {
      addToast('check-circle', 'Asset deleted');
      setTimeout(() => router.push('/marketplace'), 1000);
    } else {
      addToast('alert-triangle', d.error || 'Failed to delete');
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

  if (loading) return <div className="table-empty" style={{ padding: 48, textAlign: 'center' }}>Loading...</div>;
  if (!asset) return <div className="table-empty" style={{ padding: 48, textAlign: 'center' }}>Asset not found</div>;

  return (
    <>
      <Navbar user={user} onOpenAuth={() => {}} onLogout={() => router.push('/')} onScrollTo={() => {}} />
      <main className="main-content" style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
        <div className="asset-detail-layout">
          <div className="asset-detail-media">
            <div className="asset-media-wrap">
              {asset.thumbnailUrl && (
                <Image src={proxyUrl(asset.thumbnailUrl)} alt={asset.name} width={460} height={460} className="asset-media-img" unoptimized />
              )}
              {asset.assetType && (
                <span className={`asset-type-badge type-${asset.assetType}`}>{asset.assetType}</span>
              )}
            </div>
            {asset.videoUrl && (
              <video src={proxyUrl(asset.videoUrl)} loop muted autoPlay playsInline crossOrigin="anonymous" className="asset-video" />
            )}
          </div>

          <div className="asset-detail-info">
            <h1 className="asset-detail-title">{asset.name}</h1>
            <div className="asset-detail-meta">
              <a href={`/profile/${asset.owner?.username}`} className="asset-detail-creator">
                <User size={14} /> {asset.owner?.username}
              </a>
              <span className="asset-detail-date"><Calendar size={14} /> {new Date(asset.createdAt).toLocaleDateString()}</span>
              {asset.assetType && (
                <span className="asset-detail-type-badge">{asset.assetType.toUpperCase()}</span>
              )}
            </div>

            <div className="asset-detail-rating">
              <div className="asset-stars">
                {[1,2,3,4,5].map(s => (
                  <StarIcon key={s} size={16} fill={s <= Math.round(avgRating) ? 'var(--gold)' : 'var(--bg-3)'} color={s <= Math.round(avgRating) ? 'var(--gold)' : 'var(--line)'} />
                ))}
              </div>
              <span className="asset-rating-text">{avgRating > 0 ? avgRating.toFixed(1) : 'No ratings'} ({asset.reviewCount || 0})</span>
            </div>

            {asset.tags?.length > 0 && (
              <div className="asset-detail-tags">
                {asset.tags.map(t => (
                  <span key={t} className="asset-tag">{t}</span>
                ))}
              </div>
            )}

            <div className="asset-detail-price">
              {asset.price === 'Free' ? 'Free' : `${asset.priceRobux} R$`}
            </div>

            <div className="asset-detail-actions">
              <button className="hero-cta-primary" onClick={handleDownload}>
                <Download size={16} /> Download ({asset.downloads})
              </button>
              <button className={`icon-btn ${liked ? 'active' : ''}`} onClick={handleLike}>
                <Heart size={18} /> {asset.likesCount}
              </button>
              {user && user.id !== asset.owner?.id && (
                <button className={`icon-btn ${isFollowing ? 'active' : ''}`} onClick={handleFollow}>
                  {isFollowing ? <UserCheck size={18} /> : <UserPlus size={18} />}
                </button>
              )}
              {user && user.id !== asset.owner?.id && (
                <button className="icon-btn" onClick={() => setShowReport(true)}>
                  <Flag size={18} />
                </button>
              )}
              {user && (user.id === asset.owner?.id || user.role === 'admin') && (
                <>
                  <button className="icon-btn" onClick={() => router.push(`/asset/${id}/edit`)}>
                    <Edit size={18} />
                  </button>
                  {(asset.status !== 'APPROVED' || user.role === 'admin') && (
                    <button className="icon-btn" onClick={() => setDeleteConfirm(true)} style={{ color: '#ef4444' }}>
                      <Trash2 size={18} />
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="asset-detail-desc">
              <h3 className="asset-detail-section-title">Description</h3>
              <p className="asset-detail-desc-text">{asset.description ? sanitizeText(asset.description) : 'No description provided.'}</p>
            </div>
          </div>
        </div>

        <div className="asset-detail-section">
          <h3 className="asset-detail-section-title"><Star size={16} style={{ color: 'var(--gold)' }} /> Reviews ({asset.reviewCount || 0})</h3>
          {user && !userReview && user.id !== asset.owner?.id && (
            <div className="asset-review-box" style={{ marginBottom: 16 }}>
              <div className="asset-review-row">
                <span className="asset-review-label">Your rating:</span>
                <div className="asset-stars" onMouseLeave={() => setHoverRating(0)}>
                  {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={() => setRating(s)} onMouseEnter={() => setHoverRating(s)} className="star-btn">
                      <StarIcon size={22} fill={s <= (hoverRating || rating) ? 'var(--gold)' : 'var(--bg-3)'} color={s <= (hoverRating || rating) ? 'var(--gold)' : 'var(--line)'} />
                    </button>
                  ))}
                </div>
              </div>
              <textarea className="upload-textarea" value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Write a review (optional)..." rows={2} style={{ marginBottom: 8 }} />
              <button className="hero-cta-primary" style={{ padding: '8px 20px', fontSize: 12 }} onClick={handleReview}>Submit Review</button>
            </div>
          )}
          <div className="asset-reviews-list">
            {(asset.reviews || []).map(r => (
              <div key={r.id} className="asset-review-card">
                <div className="asset-review-header">
                  <strong>{r.user?.username}</strong>
                  <div className="asset-stars">
                    {[1,2,3,4,5].map(s => (
                      <StarIcon key={s} size={12} fill={s <= r.rating ? 'var(--gold)' : 'var(--bg-3)'} color={s <= r.rating ? 'var(--gold)' : 'var(--line)'} />
                    ))}
                  </div>
                  <span className="asset-review-date">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                {r.comment && <div className="asset-review-text">{sanitizeText(r.comment)}</div>}
              </div>
            ))}
            {(!asset.reviews || asset.reviews.length === 0) && (
              <div className="table-empty" style={{ padding: 24 }}>No reviews yet</div>
            )}
          </div>
        </div>

        <div className="asset-detail-section">
          <h3 className="asset-detail-section-title"><User size={16} style={{ color: 'var(--gold)' }} /> About the Creator</h3>
          <div className="asset-creator-card">
            <div className="asset-creator-avatar">
              {asset.owner?.avatarUrl ? (
                <img src={asset.owner.avatarUrl} alt="" className="asset-creator-img" />
              ) : (
                <div className="asset-creator-placeholder"><User size={20} /></div>
              )}
            </div>
            <div className="asset-creator-info">
              <a href={`/profile/${asset.owner?.username}`} className="asset-creator-name">{asset.owner?.username}</a>
              {asset.owner?.aboutMe && <div className="asset-creator-bio">{asset.owner.aboutMe}</div>}
            </div>
            {user && user.id !== asset.owner?.id && (
              <button className={`signup-btn ${isFollowing ? 'purchase-btn-secondary' : ''}`} style={{ marginLeft: 'auto', padding: '6px 14px', fontSize: 11 }} onClick={handleFollow}>
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
        </div>

        <div className="asset-detail-section">
          <h3 className="asset-detail-section-title"><MessageCircle size={16} style={{ color: 'var(--gold)' }} /> Comments ({(asset.comments || []).length})</h3>
          {user && (
            <div className="asset-comment-form">
              <input className="upload-input" value={comment} onChange={e => setComment(e.target.value)} placeholder="Write a comment..." />
              <button className="hero-cta-primary" onClick={handleComment}>Post</button>
            </div>
          )}
          <div className="asset-comments-list">
            {(asset.comments || []).map(c => (
              <div key={c.id} className="asset-comment-card">
                <div className="asset-comment-header">
                  <strong>{c.user?.username}</strong>
                  <span className="asset-comment-date">{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="asset-comment-text">{c.content}</div>
              </div>
            ))}
            {(!asset.comments || asset.comments.length === 0) && (
              <div className="table-empty" style={{ padding: 24 }}>No comments yet</div>
            )}
          </div>
        </div>
      </main>

      {showReport && (
        <div className="modal-overlay" onClick={() => { setShowReport(false); setReportReason(''); }}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Report Asset</h3>
            <textarea className="upload-textarea" value={reportReason} onChange={e => setReportReason(e.target.value)} placeholder="Why are you reporting this asset? (min 10 characters)" rows={4} style={{ marginBottom: 12 }} />
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="hero-cta-secondary" onClick={() => { setShowReport(false); setReportReason(''); }} style={{ flex: 1 }}>Cancel</button>
              <button className="hero-cta-primary" onClick={handleReport} style={{ flex: 1 }}>Submit Report</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Delete Asset?</h3>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="hero-cta-secondary" onClick={() => setDeleteConfirm(false)} style={{ flex: 1 }}>Cancel</button>
              <button className="hero-cta-primary" onClick={handleDelete} style={{ flex: 1, background: '#ef4444', borderColor: '#ef4444' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <Footer onScrollTo={() => {}} lang="en" />
      <div className="toast-wrap">
        {toasts.map(t => <Toast key={t.id} id={t.id} icon={t.icon} message={t.message} onRemove={removeToast} />)}
      </div>
    </>
  );
}
