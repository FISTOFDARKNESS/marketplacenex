'use client';

import { useState, useEffect } from 'react';
import { X, Wallet, Loader, ExternalLink, Check, AlertTriangle, ArrowLeft } from 'lucide-react';
import { formatNumber } from '@/lib/format';

export default function DepositRobux({ user, onClose, onDepositComplete, onOpenLinkRoblox }) {
  const [step, setStep] = useState('loading');
  const [robux, setRobux] = useState(0);
  const [amount, setAmount] = useState('');
  const [orderUrl, setOrderUrl] = useState('');
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { setError('Not logged in'); setStep('error'); return; }
    if (!user.robloxCookie) { setStep('link'); return; }
    fetch('/api/deposit/robux-balance')
      .then(r => r.json())
      .then(d => {
        if (d.linked) { setRobux(d.robux); setStep('form'); }
        else { setStep('link'); }
      })
      .catch(() => { setStep('link'); setError('Failed to fetch balance'); });
  }, [user]);

  async function handleStart(e) {
    e.preventDefault();
    const amt = parseInt(amount, 10);
    if (!amt || amt < 5) { setError('Minimum 5 Robux'); return; }
    if (amt > robux) { setError('Insufficient Robux'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/deposit/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed'); setLoading(false); return; }
      setOrderId(data.orderId);
      setOrderUrl(data.url);
      setStep('pay');
    } catch { setError('Failed to start deposit'); }
    finally { setLoading(false); }
  }

  async function handleVerify() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/deposit/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Verification failed'); setLoading(false); return; }
      if (data.success) {
        onDepositComplete?.(data.balance);
        setStep('done');
      } else {
        setError(data.message || 'Purchase not detected — try again after buying');
      }
    } catch { setError('Verification failed'); }
    finally { setLoading(false); }
  }

  return (
    <div className="deposit-robux">
      {step === 'loading' && (
        <div className="deposit-center"><Loader size={24} className="spin" /><p>Loading...</p></div>
      )}

      {step === 'link' && (
        <div className="deposit-center">
          <AlertTriangle size={24} style={{ color: '#f59e0b', marginBottom: '8px' }} />
          <p>Link your Roblox account to deposit Robux.</p>
          <button className="deposit-btn" onClick={onOpenLinkRoblox}>Link Roblox Account</button>
        </div>
      )}

      {step === 'form' && (
        <form onSubmit={handleStart} className="deposit-form">
          <div className="deposit-balance">
            <Wallet size={14} />
            <span>Your Robux: <strong>{formatNumber(robux)}</strong></span>
          </div>
          <label className="deposit-label">Amount to deposit (min 5 Robux)</label>
          <input
            className="deposit-input"
            type="number"
            min={5}
            max={robux}
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setError(''); }}
            placeholder="e.g. 50"
          />
          {error && <div className="deposit-error">{error}</div>}
          <button type="submit" className="deposit-btn" disabled={loading || !amount}>
            {loading ? <><Loader size={14} className="spin" /> Processing...</> : `Deposit ${amount || ''} Robux`}
          </button>
        </form>
      )}

      {step === 'pay' && (
        <div className="deposit-pay">
          <p>Click below to buy the gamepass on Roblox, then come back and verify.</p>
          <a href={orderUrl} target="_blank" rel="noopener noreferrer" className="deposit-btn deposit-btn-primary">
            <ExternalLink size={14} /> Buy on Roblox
          </a>
          <button className="deposit-btn" onClick={handleVerify} disabled={loading}>
            {loading ? <><Loader size={14} className="spin" /> Verifying...</> : '✓ I bought it — Verify'}
          </button>
          {error && <div className="deposit-error">{error}</div>}
        </div>
      )}

      {step === 'done' && (
        <div className="deposit-center">
          <Check size={32} style={{ color: '#4ade80', marginBottom: '8px' }} />
          <p>Deposit successful! Your balance has been updated.</p>
          <button className="deposit-btn" onClick={onClose}>Close</button>
        </div>
      )}

      {step === 'error' && (
        <div className="deposit-center">
          <AlertTriangle size={24} style={{ color: '#ef4444', marginBottom: '8px' }} />
          <p>{error || 'Something went wrong'}</p>
          <button className="deposit-btn" onClick={onClose}>Close</button>
        </div>
      )}
    </div>
  );
}
