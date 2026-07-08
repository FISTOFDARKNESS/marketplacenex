'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Shield, Check, Copy, ExternalLink, AlertTriangle, Eye, EyeOff, Trash2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [method, setMethod] = useState('bio');
  const [step, setStep] = useState('start');
  const [robloxUser, setRobloxUser] = useState('');
  const [phrase, setPhrase] = useState('');
  const [cookie, setCookie] = useState('');
  const [showCookie, setShowCookie] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.authenticated) { router.push('/'); return; }
      setUser(d.user);
    });
  }, []);

  async function handleBioStart(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/roblox/verify-start', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ robloxUsername: robloxUser.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setPhrase(data.phrase); setStep('phrase');
    } catch { setError('Connection failed'); }
    finally { setLoading(false); }
  }

  async function handleBioCheck() {
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/roblox/verify-check', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      if (!data.success) { setError(data.message); return; }
      setStep('done');
      setUser(prev => ({ ...prev, robloxUsername: data.robloxUsername }));
    } catch { setError('Connection failed'); }
    finally { setLoading(false); }
  }

  async function handleCookieVerify(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/roblox/verify-cookie', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookie: cookie.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setStep('done');
      setUser(prev => ({ ...prev, robloxUsername: data.robloxUsername }));
    } catch { setError('Connection failed'); }
    finally { setLoading(false); }
  }

  async function handleUnlink() {
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/roblox/unlink', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setUser(prev => ({ ...prev, robloxId: null, robloxUsername: null }));
      setStep('start');
      setMethod('bio');
    } catch { setError('Connection failed'); }
    finally { setLoading(false); }
  }

  function handleCopy() {
    navigator.clipboard.writeText(phrase);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  function switchMethod(m) {
    setMethod(m);
    setStep('start');
    setError('');
    setPhrase('');
    setRobloxUser('');
    setCookie('');
  }

  const isLinked = user?.robloxUsername;

  return (
    <div className="app-layout">
      <Sidebar onLogout={handleLogout} />
      <main className="main-content">
        <div className="page-top">
          <div>
            <h1 className="page-title">Settings</h1>
            <p className="page-desc">Manage your account settings and linked Roblox account.</p>
          </div>
        </div>

        <div className="settings-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <User size={18} style={{ color: '#9ca3af' }} />
            <h3 style={{ margin: 0, fontSize: '15px' }}>Account</h3>
          </div>
          <div style={{ background: '#1a1a1e', borderRadius: '10px', padding: '16px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Username</div>
            <div style={{ fontSize: '14px', color: '#e5e7eb', fontWeight: 600 }}>{user?.username || '...'}</div>
          </div>
        </div>

        <div className="settings-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Shield size={18} style={{ color: '#f59e0b' }} />
            <h3 style={{ margin: 0, fontSize: '15px' }}>Roblox Verification</h3>
          </div>

          {isLinked && step === 'start' ? (
            <div style={{ background: '#1a1a1e', borderRadius: '10px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#22c55e', marginBottom: '12px', padding: '8px 12px', background: 'rgba(34,197,94,0.08)', borderRadius: '8px' }}>
                <Check size={14} /> Linked: <b>{user.robloxUsername}</b>
              </div>
              <button onClick={handleUnlink} disabled={loading} className="purchase-btn purchase-btn-secondary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Trash2 size={14} /> {loading ? 'Unlinking...' : 'Unlink Roblox Account'}
              </button>
            </div>
          ) : (
            <>
              <div style={{ background: '#1a1a1e', borderRadius: '10px', padding: '4px', marginBottom: '12px', display: 'flex' }}>
                <button onClick={() => switchMethod('bio')}
                  style={{
                    flex: 1, padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer',
                    background: method === 'bio' ? 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,180,0,0.08))' : 'transparent',
                    color: method === 'bio' ? '#FFD700' : '#9ca3af', fontWeight: method === 'bio' ? 600 : 400,
                    fontSize: '13px', fontFamily: 'inherit', transition: 'all 0.2s',
                  }}>
                  Bio Verification
                </button>
                <button onClick={() => switchMethod('cookie')}
                  style={{
                    flex: 1, padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer',
                    background: method === 'cookie' ? 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,180,0,0.08))' : 'transparent',
                    color: method === 'cookie' ? '#FFD700' : '#9ca3af', fontWeight: method === 'cookie' ? 600 : 400,
                    fontSize: '13px', fontFamily: 'inherit', transition: 'all 0.2s',
                  }}>
                  Cookie Verification
                </button>
              </div>

              <div style={{ background: '#1a1a1e', borderRadius: '10px', padding: '16px' }}>
                {error && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '13px', padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', marginBottom: '12px' }}>
                    <AlertTriangle size={14} /> {error}
                  </div>
                )}

                {step === 'start' && method === 'bio' && (
                  <div>
                    <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 12px' }}>
                      Enter your Roblox username. We&apos;ll give you a phrase to paste in your bio.
                    </p>
                    <form onSubmit={handleBioStart} style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text" placeholder="Roblox username" value={robloxUser}
                        onChange={e => setRobloxUser(e.target.value)} required
                        style={{
                          flex: 1, padding: '10px 14px', background: '#0f0f13', border: '1px solid #2a2a2e',
                          borderRadius: '8px', color: '#e5e7eb', fontSize: '14px', outline: 'none', fontFamily: 'inherit',
                        }}
                      />
                      <button type="submit" className="purchase-btn" disabled={loading} style={{ padding: '10px 20px', whiteSpace: 'nowrap' }}>
                        {loading ? '...' : 'Verify'}
                      </button>
                    </form>
                  </div>
                )}

                {step === 'start' && method === 'cookie' && (
                  <div>
                    <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 12px' }}>
                      Paste your <b>.ROBLOSECURITY</b> cookie to verify your Roblox account. Your cookie is only used once and never stored.
                    </p>
                    <form onSubmit={handleCookieVerify}>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                          <input
                            type={showCookie ? 'text' : 'password'} placeholder=".ROBLOSECURITY cookie" value={cookie}
                            onChange={e => setCookie(e.target.value)} required
                            style={{
                              width: '100%', padding: '10px 14px', paddingRight: '40px', background: '#0f0f13',
                              border: '1px solid #2a2a2e', borderRadius: '8px', color: '#e5e7eb', fontSize: '14px',
                              outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                            }}
                          />
                          <button type="button" onClick={() => setShowCookie(!showCookie)}
                            style={{
                              position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                              background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '4px',
                            }}>
                            {showCookie ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        <button type="submit" className="purchase-btn" disabled={loading} style={{ padding: '10px 20px', whiteSpace: 'nowrap' }}>
                          {loading ? '...' : 'Verify'}
                        </button>
                      </div>
                    </form>
                    <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.5 }}>
                      <b style={{ color: '#f59e0b' }}>How to get your cookie:</b>
                      <ol style={{ margin: '4px 0 0', paddingLeft: '16px' }}>
                        <li>Go to <a href="https://www.roblox.com" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa' }}>Roblox.com</a> and log in</li>
                        <li>Open DevTools (F12) → Application → Cookies → <b>.ROBLOSECURITY</b></li>
                        <li>Copy the value (starts with <b>_|</b>)</li>
                      </ol>
                    </div>
                  </div>
                )}

                {step === 'phrase' && (
                  <div>
                    <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 12px' }}>
                      Copy this phrase and paste it in your Roblox bio for <b>{robloxUser}</b>
                    </p>
                    <div style={{ background: '#0f0f13', border: '1px solid #2a2a2e', borderRadius: '10px', padding: '16px', fontSize: '18px', fontWeight: 700, color: '#fbbf24', textAlign: 'center', marginBottom: '12px', letterSpacing: '0.5px' }}>
                      {phrase}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <button onClick={handleCopy} className="verify-btn-secondary">
                        {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                      </button>
                      <a href="https://www.roblox.com/users/profile/edit" target="_blank" rel="noopener noreferrer" className="verify-btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#0f0f13', border: '1px solid #2a2a2e', borderRadius: '8px', color: '#d1d5db', textDecoration: 'none', fontSize: '13px' }}>
                        <ExternalLink size={14} /> Open Roblox
                      </a>
                    </div>
                    <button className="purchase-btn" onClick={handleBioCheck} disabled={loading} style={{ width: '100%' }}>
                      {loading ? 'Checking...' : "I've set my bio"}
                    </button>
                  </div>
                )}

                {step === 'done' && (
                  <div style={{ textAlign: 'center', padding: '12px 0' }}>
                    <Check size={32} style={{ color: '#22c55e', marginBottom: '8px' }} />
                    <p style={{ color: '#22c55e', fontSize: '14px', fontWeight: 600, margin: 0 }}>Account verified!</p>
                    <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>
                      <b>{user?.robloxUsername || 'Roblox account'}</b> is now linked
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
