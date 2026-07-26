'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Toast from '@/components/Toast';
import { proxyUrl } from '@/lib/storage-url';
import { User, Users, Download, Heart, Calendar, CheckCircle, UserPlus, UserCheck, Settings } from 'lucide-react';

export default function ProfilePage() {
  const { username } = useParams();
  const router = useRouter();
  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [assets, setAssets] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [aboutMe, setAboutMe] = useState('');
  const [editing, setEditing] = useState(false);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.authenticated) setAuthUser(d.user);
    }).catch(() => {});
  }, []);

  const fetchProfile = () => {
    fetch(`/api/user/${username}`).then(r => r.json()).then(d => {
      if (d.success) {
        setProfile(d.user);
        setAssets(d.assets);
      }
    }).catch(() => {});

    fetch(`/api/follow?userId=${encodeURIComponent(username)}`).catch(() => {});
  };

  useEffect(() => {
    async function loadProfile() {
      const userRes = await fetch(`/api/user/${username}`);
      const userData = await userRes.json();
      if (userData.success) {
        setProfile(userData.user);
        setAssets(userData.assets || []);
      }
      setLoading(false);
    }
    loadProfile();
  }, [username]);

  useEffect(() => {
    if (profile && authUser) {
      fetch(`/api/follow?userId=${profile.id}`).then(r => r.json()).then(d => {
        if (d.success) {
          setFollowers(d.followers);
          setFollowing(d.following);
          setIsFollowing(d.isFollowing);
          setFollowersCount(d.followersCount);
          setFollowingCount(d.followingCount);
        }
      }).catch(() => {});
    }
  }, [profile, authUser]);

  const addToast = (icon, message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, icon, message }]);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const handleFollow = async () => {
    if (!authUser) { addToast('info', 'Login to follow users'); return; }
    const res = await fetch('/api/follow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followingId: profile.id }),
    });
    const d = await res.json();
    if (d.success) {
      setIsFollowing(d.following);
      setFollowersCount(prev => d.following ? prev + 1 : prev - 1);
    }
  };

  const handleSaveAbout = async () => {
    const res = await fetch(`/api/user/${username}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aboutMe }),
    });
    if (res.ok) {
      setProfile(prev => ({ ...prev, aboutMe }));
      setEditing(false);
      addToast('check-circle', 'Profile updated');
    }
  };

  if (loading) return <div style={{ padding: 48, textAlign: 'center' }}>Loading...</div>;
  if (!profile) return <div style={{ padding: 48, textAlign: 'center' }}>User not found</div>;

  const isOwnProfile = authUser?.username === username;

  return (
    <>
      <Navbar user={authUser} onOpenAuth={() => {}} onLogout={() => router.push('/')} onScrollTo={() => {}} />
      <main style={{ maxWidth: 960, margin: '32px auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap' }}>
          <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid var(--gold)' }}>
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={40} style={{ opacity: 0.4 }} />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <h1 style={{ fontSize: 24 }}>{profile.username}</h1>
              {profile.verified && <CheckCircle size={18} style={{ color: '#3b82f6' }} />}
            </div>
            <div style={{ display: 'flex', gap: 24, fontSize: 14, color: 'var(--muted)', marginBottom: 12 }}>
              <span><strong style={{ color: 'var(--text)' }}>{profile._count?.assets || 0}</strong> assets</span>
              <span><strong style={{ color: 'var(--text)' }}>{followersCount}</strong> followers</span>
              <span><strong style={{ color: 'var(--text)' }}>{followingCount}</strong> following</span>
            </div>
            {profile.aboutMe && !editing && (
              <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 12 }}>{profile.aboutMe}</p>
            )}
            {isOwnProfile && editing ? (
              <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                <textarea className="upload-textarea" value={aboutMe} onChange={e => setAboutMe(e.target.value)} placeholder="Tell about yourself..." rows={2} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="hero-cta-primary" style={{ padding: '8px 16px', fontSize: 12 }} onClick={handleSaveAbout}>Save</button>
                  <button className="hero-cta-secondary" style={{ padding: '8px 16px', fontSize: 12 }} onClick={() => setEditing(false)}>Cancel</button>
                </div>
              </div>
            ) : null}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {authUser && !isOwnProfile && (
                <button className={`signup-btn ${isFollowing ? 'purchase-btn-secondary' : ''}`} style={{ padding: '8px 20px', fontSize: 12 }} onClick={handleFollow}>
                  {isFollowing ? <><UserCheck size={14} /> Following</> : <><UserPlus size={14} /> Follow</>}
                </button>
              )}
              {isOwnProfile && (
                <>
                  <button className="hero-cta-secondary" style={{ padding: '8px 16px', fontSize: 12 }} onClick={() => { setAboutMe(profile.aboutMe || ''); setEditing(true); }}>
                    <Settings size={14} /> Edit Profile
                  </button>
                  <button className="hero-cta-secondary" style={{ padding: '8px 16px', fontSize: 12 }} onClick={() => router.push('/verify')}>
                    <CheckCircle size={14} /> Verify
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <h2 style={{ fontSize: 18, marginBottom: 16 }}>Assets ({assets.length})</h2>
        {assets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>No assets yet</div>
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
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Download size={11} /> {asset.downloads}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Heart size={11} /> {asset.likesCount}</span>
                </div>
              </div>
            ))}
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
