'use client';

import { useState, useEffect } from 'react';
import { X, Shield, Check, AlertTriangle, Copy, ExternalLink, Clock, Package, Backpack, UserCheck, Search } from 'lucide-react';

export function VerifyModal({ user, onClose }) {
  const [step, setStep] = useState('start');
  const [robloxUser, setRobloxUser] = useState('');
  const [robloxId, setRobloxId] = useState(null);
  const [phrase, setPhrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

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
      setRobloxId(data.robloxId);
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
    <div className="modal-overlay show" onClick={(e) => e.target.classList.contains('modal-overlay') && onClose()}>
      <div className="modal" style={{ maxWidth: '440px' }}>
        <button className="modal-close" onClick={onClose}><X className="icon" /></button>
        <div className="purchase-body">
          {error && <div className="purchase-error"><AlertTriangle className="icon" /> {error}</div>}

          {step === 'start' && (
            <form onSubmit={handleStart} style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Shield size={24} style={{ color: '#f59e0b' }} />
              </div>
              <h3 style={{ margin: '0 0 6px' }}>Verify Roblox Account</h3>
              <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 16px' }}>Link your Roblox account to receive items directly</p>
              <input
                type="text" placeholder="Roblox username" value={robloxUser}
                onChange={e => setRobloxUser(e.target.value)} required
                style={{
                  width: '100%', padding: '10px 14px', background: 'var(--bg-3)', border: '1px solid var(--line)',
                  borderRadius: '8px', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit',
                  outline: 'none', boxSizing: 'border-box', marginBottom: '12px',
                }}
              />
              <button type="submit" className="purchase-btn" disabled={loading}>
                {loading ? 'Generating...' : 'Start verification'}
              </button>
            </form>
          )}

          {step === 'phrase' && (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <h3 style={{ margin: '0 0 6px' }}>Set your Roblox bio</h3>
              <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 16px' }}>
                Copy this phrase and paste it in your Roblox bio for <b>{robloxUser}</b>
              </p>
              <div style={{
                background: '#1a1a1e', border: '1px solid #2a2a2e', borderRadius: '10px',
                padding: '16px', marginBottom: '16px', fontSize: '18px', fontWeight: 700,
                color: '#fbbf24', letterSpacing: '0.5px',
              }}>
                {phrase}
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
                <button onClick={handleCopy} style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#1a1a1e',
                  border: '1px solid #2a2a2e', borderRadius: '8px', color: '#d1d5db', cursor: 'pointer',
                  fontSize: '13px', fontFamily: 'inherit',
                }}>
                  {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                </button>
                <a href="https://www.roblox.com/users/profile/edit" target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#1a1a1e',
                  border: '1px solid #2a2a2e', borderRadius: '8px', color: '#d1d5db', cursor: 'pointer',
                  fontSize: '13px', textDecoration: 'none',
                }}>
                  <ExternalLink size={14} /> Open Roblox
                </a>
              </div>
              <button className="purchase-btn" onClick={handleCheck} disabled={loading}>
                {loading ? 'Checking...' : 'I\'ve set my bio'}
              </button>
            </div>
          )}

          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Check size={24} style={{ color: '#22c55e' }} />
              </div>
              <h3 style={{ margin: '0 0 6px' }}>Account verified!</h3>
              <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 16px' }}>
                Your Roblox account <b>{robloxUser}</b> is now linked
              </p>
              <button className="purchase-btn" onClick={onClose}>Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function OrdersModal({ user, onClose }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/orders')
      .then(r => r.json())
      .then(d => { if (d.success) setOrders(d.orders); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="modal-overlay show" onClick={(e) => e.target.classList.contains('modal-overlay') && onClose()}>
      <div className="modal" style={{ maxWidth: '480px', maxHeight: '80vh', overflowY: 'auto' }}>
        <button className="modal-close" onClick={onClose}><X className="icon" /></button>
        <div className="purchase-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Package size={20} style={{ color: '#f59e0b' }} />
            <h3 style={{ margin: 0 }}>Orders</h3>
          </div>

          {loading ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '24px' }}>Loading...</p>
          ) : orders.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '24px' }}>No orders yet</p>
          ) : (
            orders.map(o => (
              <div key={o.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                background: '#1a1a1e', borderRadius: '10px', marginBottom: '8px',
              }}>
                <img src={o.item.img} alt={o.item.name} style={{ width: 48, height: 48, borderRadius: '6px', objectFit: 'cover' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#e5e7eb', marginBottom: '2px' }}>{o.item.name}</div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>for {o.robloxUser}</div>
                </div>
                <span style={{
                  fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px',
                  background: o.status === 'PENDING' ? 'rgba(245,158,11,0.12)' : 'rgba(34,197,94,0.12)',
                  color: o.status === 'PENDING' ? '#f59e0b' : '#22c55e',
                }}>
                  {o.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function InventoryModal({ user, onClose }) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/inventory')
      .then(r => r.json())
      .then(d => { if (d.success) setInventory(d.inventory); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="modal-overlay show" onClick={(e) => e.target.classList.contains('modal-overlay') && onClose()}>
      <div className="modal" style={{ maxWidth: '480px', maxHeight: '80vh', overflowY: 'auto' }}>
        <button className="modal-close" onClick={onClose}><X className="icon" /></button>
        <div className="purchase-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Backpack size={20} style={{ color: '#22c55e' }} />
            <h3 style={{ margin: 0 }}>Inventory ({inventory.length})</h3>
          </div>

          {loading ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '24px' }}>Loading...</p>
          ) : inventory.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '24px' }}>No items yet</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {inventory.map(inv => (
                <div key={inv.id} style={{
                  background: '#1a1a1e', borderRadius: '10px', padding: '12px', textAlign: 'center',
                }}>
                  <img src={inv.item.img} alt={inv.item.name} style={{ width: '100%', aspectRatio: '1', borderRadius: '6px', objectFit: 'cover', marginBottom: '8px' }} />
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#e5e7eb' }}>{inv.item.name}</div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>${inv.item.usdPrice}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AdminOrdersModal({ user, onClose }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  function fetchAllOrders() {
    setLoading(true);
    fetch('/api/orders?all=true')
      .then(r => r.json())
      .then(d => { if (d.success) setOrders(d.orders); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchAllOrders(); }, []);

  async function handleApprove(orderId) {
    try {
      const res = await fetch('/api/admin/approve-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      if (res.ok) fetchAllOrders();
    } catch {}
  }

  const pendingOrders = orders.filter(o => o.status === 'PENDING');

  return (
    <div className="modal-overlay show" onClick={(e) => e.target.classList.contains('modal-overlay') && onClose()}>
      <div className="modal" style={{ maxWidth: '520px', maxHeight: '80vh', overflowY: 'auto' }}>
        <button className="modal-close" onClick={onClose}><X className="icon" /></button>
        <div className="purchase-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Shield size={20} style={{ color: '#ef4444' }} />
            <h3 style={{ margin: 0 }}>Admin — Pending Orders ({pendingOrders.length})</h3>
          </div>

          {loading ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '24px' }}>Loading...</p>
          ) : pendingOrders.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '24px' }}>No pending orders</p>
          ) : (
            pendingOrders.map(o => (
              <div key={o.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                background: '#1a1a1e', borderRadius: '10px', marginBottom: '8px',
              }}>
                <img src={o.item?.img} alt={o.item?.name} style={{ width: 48, height: 48, borderRadius: '6px', objectFit: 'cover' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#e5e7eb', marginBottom: '2px' }}>{o.item?.name}</div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>User: {o.user?.username || o.userId} → {o.robloxUser}</div>
                </div>
                <button onClick={() => handleApprove(o.id)} style={{
                  padding: '6px 14px', background: '#22c55e', border: 'none', borderRadius: '6px',
                  color: '#000', fontWeight: 700, fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  Approve
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
