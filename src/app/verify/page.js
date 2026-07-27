'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Toast from '@/components/Toast';
import { CheckCircle, Shield, AlertCircle, Eye, EyeOff, Loader } from 'lucide-react';

export default function VerifyPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [robloxCookie, setRobloxCookie] = useState('');
  const [robloxUserId, setRobloxUserId] = useState('');
  const [universeId, setUniverseId] = useState('');
  const [showCookie, setShowCookie] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verifyInfo, setVerifyInfo] = useState(null);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.authenticated) { router.push('/'); return; }
      setUser(d.user);
      if (d.user.verified) {
        fetch('/api/verify/check').then(r => r.json()).then(d2 => {
          if (d2.success) {
            setVerified(d2.verified);
            setVerifyInfo(d2.user);
          }
        }).catch(() => {});
      }
    }).catch(() => router.push('/'));
  }, []);

  const addToast = (icon, message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, icon, message }]);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const handleVerify = async () => {
    if (!robloxCookie || !robloxUserId || !universeId) {
      addToast('alert-triangle', 'All fields are required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ robloxCookie, robloxUserId, universeId }),
      });
      const d = await res.json();
      if (d.success) {
        setVerified(true);
        setVerifyInfo({ robloxUsername: d.robloxUsername, robloxUserId, universeId });
        addToast('check-circle', 'Account verified successfully!');
        // Refresh user to update verified status globally
        const userRes = await fetch('/api/auth/me');
        const userData = await userRes.json();
        if (userData.authenticated && userData.user) {
          window.dispatchEvent(new CustomEvent('auth-user-updated', { detail: userData.user }));
        }
      } else {
        addToast('alert-triangle', d.error || 'Verification failed');
      }
    } catch (err) {
      addToast('alert-triangle', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <Navbar user={user} onOpenAuth={() => {}} onLogout={() => router.push('/')} onScrollTo={() => {}} />
      <main style={{ maxWidth: 640, margin: '48px auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <Shield size={24} style={{ color: 'var(--gold)' }} />
          <h1 style={{ fontSize: 24 }}>Account Verification</h1>
        </div>
        <p style={{ color: 'var(--muted)', marginBottom: 32, fontSize: 14 }}>
          Verify your account to set Robux prices on your assets.
          You need your Roblox cookie, user ID, and a Universe ID from your Roblox game.
        </p>

        {verified ? (
          <div style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 12, padding: 24, textAlign: 'center' }}>
            <CheckCircle size={48} style={{ color: 'var(--green)', marginBottom: 12 }} />
            <h2 style={{ fontSize: 20, marginBottom: 8 }}>Verified</h2>
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>
              {verifyInfo?.robloxUsername && <>Roblox: <strong>{verifyInfo.robloxUsername}</strong><br /></>}
              Universe ID: <strong>{verifyInfo?.universeId?.toString()}</strong>
            </p>
            <button className="hero-cta-primary" style={{ marginTop: 16 }} onClick={() => router.push('/upload')}>
              Start Uploading Assets
            </button>
          </div>
        ) : (
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 12, padding: 24 }}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 6 }}>Roblox Cookie (.ROBLOSECURITY)</label>
              <div style={{ position: 'relative' }}>
                <input className="upload-input" type={showCookie ? 'text' : 'password'} value={robloxCookie} onChange={e => setRobloxCookie(e.target.value)} placeholder="Enter your .ROBLOSECURITY cookie" style={{ paddingRight: 40 }} />
                <button onClick={() => setShowCookie(!showCookie)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
                  {showCookie ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 6 }}>Roblox User ID</label>
              <input className="upload-input" type="number" value={robloxUserId} onChange={e => setRobloxUserId(e.target.value)} placeholder="123456789" />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 6 }}>Universe ID</label>
              <input className="upload-input" type="number" value={universeId} onChange={e => setUniverseId(e.target.value)} placeholder="987654321" />
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                {`Your Roblox game's Universe ID. Find it in the Roblox Developer Hub.`}
              </div>
            </div>

            <button className="hero-cta-primary" style={{ width: '100%' }} onClick={handleVerify} disabled={loading}>
              {loading ? <><Loader size={14} className="spin" /> Verifying...</> : <><Shield size={14} /> Verify Account</>}
            </button>

            <div style={{ marginTop: 16, background: 'rgba(234,200,71,0.08)', borderRadius: 8, padding: 12, fontSize: 12, color: 'var(--muted)' }}>
              <AlertCircle size={12} style={{ marginRight: 4 }} />
              Your cookie is encrypted and stored securely. We never share it.
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
