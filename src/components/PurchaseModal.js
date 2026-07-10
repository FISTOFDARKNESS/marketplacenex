'use client';

import { useState, useEffect } from 'react';
import { X, Check, AlertTriangle, Wallet, Clock, Bitcoin } from 'lucide-react';
import { formatNumber } from '@/lib/format';

export default function PurchaseModal({ item, user, onClose, onOpenFinance, onPurchaseComplete }) {
  const [sellers, setSellers] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [robloxUser, setRobloxUser] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [redirectTimer, setRedirectTimer] = useState(null);

  useEffect(() => {
    fetch('/api/sellers')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.sellers.length > 0) {
          setSellers(data.sellers);
          setSelectedSeller(data.sellers[0]);
        }
      })
      .catch(() => {});
    return () => { if (redirectTimer) clearTimeout(redirectTimer); };
  }, []);

  const currentPrice = selectedSeller
    ? (parseFloat(item.usdPrice) * (1 + selectedSeller.markup)).toFixed(2)
    : item.usdPrice;

  const userBalance = user?.balance ?? 0;
  const hasFunds = userBalance >= parseFloat(currentPrice);

  async function handleBuy(e) {
    e.preventDefault();
    setError('');
    if (!hasFunds) {
      setError(`Insufficient balance. You have $${userBalance.toFixed(2)} but need $${currentPrice}.`);
      const timer = setTimeout(() => {
        onClose();
        if (onOpenFinance) onOpenFinance();
      }, 5000);
      setRedirectTimer(timer);
      return;
    }
    if (!robloxUser.trim()) {
      setError('Enter the Roblox username of the recipient');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/items/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          sellerId: selectedSeller?.id || null,
          price: parseFloat(currentPrice),
          robloxUser: robloxUser.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      if (onPurchaseComplete && data.newBalance != null) onPurchaseComplete(data.newBalance);
      setSuccess(true);
    } catch { setError('Connection failed'); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay show" onClick={(e) => e.target.classList.contains('modal-overlay') && onClose()}>
      <div className="modal purchase-modal" style={{ maxWidth: '420px' }}>
        <button className="modal-close" onClick={onClose}><X className="icon" /></button>

        <div className="purchase-body">
          {error && (
            <div className="purchase-error">
              <AlertTriangle className="icon" /> {error}
              {!hasFunds && error.includes('Insufficient') && (
                <span style={{ display: 'block', fontSize: '11px', marginTop: '6px', opacity: 0.7 }}>
                  Opening finance panel in 5s...
                </span>
              )}
            </div>
          )}

          {success ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Check size={24} style={{ color: '#22c55e' }} />
              </div>
              <h3 style={{ margin: '0 0 8px' }}>Order placed</h3>
              <p className="purchase-muted">The item has been sent to <b>{robloxUser}'s</b> orders. They need to accept the trade.</p>
              <button className="purchase-btn" onClick={onClose} style={{ marginTop: '16px' }}>Done</button>
            </div>
          ) : (
            <form onSubmit={handleBuy}>
              <div className="purchase-step-icon">
                <img src={item.img} alt={item.name} />
              </div>
              <h3>{item.name}</h3>

              <div className="purchase-detail-row">
                <span>RAP</span>
                <b>{item.rapLabel}</b>
              </div>
              <div className="purchase-detail-row">
                <span>Value</span>
                <b>{formatNumber(item.price)} Robux</b>
              </div>
              <div className="purchase-detail-row">
                <span>Seller</span>
                <select
                  value={selectedSeller?.id || ''}
                  onChange={(e) => { const s = sellers.find(s => s.id === e.target.value); setSelectedSeller(s); }}
                  style={{
                    background: 'var(--bg-3)', border: '1px solid var(--line)', borderRadius: '6px',
                    color: 'var(--text)', padding: '4px 8px', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  {sellers.map(s => <option key={s.id} value={s.id}>{s.displayId}</option>)}
                </select>
              </div>
              <div className="purchase-detail-row">
                <span>Price (USD)</span>
                <b className="gold-text">${currentPrice}</b>
              </div>
              <div className="purchase-detail-row">
                <span><Wallet size={14} /> Balance</span>
                <b style={{ color: hasFunds ? '#22c55e' : '#ef4444' }}>${userBalance.toFixed(2)}</b>
              </div>

              <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', margin: '12px 0 6px' }}>
                Recipient Roblox Username
              </label>
              <input
                type="text"
                placeholder="e.g. RobloxPlayer123"
                value={robloxUser}
                onChange={e => setRobloxUser(e.target.value)}
                required
                style={{
                  width: '100%', padding: '10px 14px', background: 'var(--bg-3)', border: '1px solid var(--line)',
                  borderRadius: '8px', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit',
                  outline: 'none', boxSizing: 'border-box', marginBottom: '8px',
                }}
              />

              <button type="submit" className="purchase-btn" disabled={loading} style={{ marginTop: '8px' }}>
                {loading ? <><Clock className="icon" /> Processing...</> : 'Send item'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
