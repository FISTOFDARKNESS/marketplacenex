'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Check, AlertTriangle, Copy, ExternalLink, ArrowLeft } from 'lucide-react';

export default function VerifyPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [step, setStep] = useState('start');
  const [robloxUser, setRobloxUser] = useState('');
  const [phrase, setPhrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) { router.push('/'); return; }
        setUser(d.user);
      });
  }, []);

  async function handleStart(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/roblox/verify-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ robloxUsername: robloxUser.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setPhrase(data.phrase);
      setStep('phrase');
    } catch { setError('Connection failed'); }
    finally { setLoading(false); }
  }

  async function handleCheck() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/roblox/verify-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      if (!data.success) { setError(data.message); return; }
      setStep('done');
    } catch { setError('Connection failed'); }
    finally { setLoading(false); }
  }

  function handleCopy() {
    navigator.clipboard.writeText(phrase);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="page-layout">
      <div className="page-header">
        <button className="icon-btn" onClick={() => router.push('/')}><ArrowLeft className="icon" /></button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Shield size={20} style={{ color: '#f59e0b' }} />
          <h1 style={{ margin: 0, fontSize: '20px' }}>Verify Roblox Account</h1>
        </div>
        <div />
      </div>

      <div className="page-content" style={{ maxWidth: '440px', margin: '0 auto' }}>
        {error && (
          <div className="page-error"><AlertTriangle className="icon" /> {error}</div>
        )}

        {step === 'start' && (
          <form onSubmit={handleStart} className="verify-form">
            <div className="verify-icon-wrap">
              <Shield size={24} style={{ color: '#f59e0b' }} />
            </div>
            <h3 style={{ margin: '0 0 6px', textAlign: 'center' }}>Verify Roblox Account</h3>
            <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 16px', textAlign: 'center' }}>
              Link your Roblox account to receive items directly
            </p>
            {user?.robloxUsername && (
              <div className="verify-already">
                <Check size={14} style={{ color: '#22c55e' }} />
                Already linked: <b>{user.robloxUsername}</b>
              </div>
            )}
            <input
              type="text" placeholder="Roblox username" value={robloxUser}
              onChange={e => setRobloxUser(e.target.value)} required
              className="verify-input"
            />
            <button type="submit" className="purchase-btn" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Generating...' : 'Start verification'}
            </button>
          </form>
        )}

        {step === 'phrase' && (
          <div className="verify-form">
            <h3 style={{ margin: '0 0 6px', textAlign: 'center' }}>Set your Roblox bio</h3>
            <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 16px', textAlign: 'center' }}>
              Copy this phrase and paste it in your Roblox bio for <b>{robloxUser}</b>
            </p>
            <div className="verify-phrase">{phrase}</div>
            <div className="verify-actions">
              <button onClick={handleCopy} className="verify-btn-secondary">
                {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
              </button>
              <a href="https://www.roblox.com/users/profile/edit" target="_blank" rel="noopener noreferrer" className="verify-btn-secondary">
                <ExternalLink size={14} /> Open Roblox
              </a>
            </div>
            <button className="purchase-btn" onClick={handleCheck} disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Checking...' : "I've set my bio"}
            </button>
          </div>
        )}

        {step === 'done' && (
          <div className="verify-form" style={{ textAlign: 'center' }}>
            <div className="verify-icon-wrap" style={{ background: 'rgba(34,197,94,0.15)' }}>
              <Check size={24} style={{ color: '#22c55e' }} />
            </div>
            <h3 style={{ margin: '0 0 6px' }}>Account verified!</h3>
            <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 16px' }}>
              Your Roblox account <b>{robloxUser}</b> is now linked
            </p>
            <button className="purchase-btn" onClick={() => router.push('/')}>Go home</button>
          </div>
        )}
      </div>
    </div>
  );
}
