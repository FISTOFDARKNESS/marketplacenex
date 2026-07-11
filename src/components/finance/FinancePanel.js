'use client';

import { useState, useEffect } from 'react';
import {
  X, Wallet, ArrowUpRight, ArrowDownLeft, Clock, Check,
  AlertTriangle, Bitcoin, DollarSign, CreditCard, TrendingUp,
  History, ExternalLink, Gauge, Zap, Layers
} from 'lucide-react';
import { formatNumber } from '@/lib/format';
import DepositRobux from '@/components/deposit/DepositRobux';

export default function FinancePanel({ user, onClose }) {
  const [tab, setTab] = useState('balance');
  const [balance, setBalance] = useState(0);
  const [withdrawals, setWithdrawals] = useState({ receber: [], enviar: [] });
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawType, setWithdrawType] = useState('receber');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState('crypto');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function fetchFinanceData() {
    if (!user) return;
    fetch('/api/balance')
      .then(r => r.json())
      .then(d => { if (d.success) setBalance(d.balance); })
      .catch(() => {});
    Promise.all([
      fetch('/api/withdraw?type=receber').then(r => r.json()),
      fetch('/api/withdraw?type=enviar').then(r => r.json()),
    ]).then(([r, e]) => {
      if (r.success) setWithdrawals(prev => ({ ...prev, receber: r.withdrawals }));
      if (e.success) setWithdrawals(prev => ({ ...prev, enviar: e.withdrawals }));
    }).catch(() => {});
  }

  useEffect(() => { fetchFinanceData(); }, [user]);
  useEffect(() => { if (user && tab === 'balance') fetchFinanceData(); }, [tab, user]);

  async function handleWithdraw(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(withdrawAmount), type: withdrawType }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setWithdrawAmount('');
      if (data.newBalance != null) setBalance(data.newBalance);
      else {
        const balRes = await fetch('/api/balance');
        const balData = await balRes.json();
        if (balData.success) setBalance(balData.balance);
      }
      const qRes = await fetch(`/api/withdraw?type=${withdrawType}`);
      const qData = await qRes.json();
      if (qData.success) setWithdrawals(prev => ({ ...prev, [withdrawType]: qData.withdrawals }));
    } catch { setError('Connection failed'); }
    finally { setLoading(false); }
  }

  async function handleDeposit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usdAmount: parseFloat(depositAmount), paymentMethod: depositMethod }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      if (data.deposit?.paymentUrl) window.open(data.deposit.paymentUrl, '_blank');
      if (data.newBalance != null) setBalance(data.newBalance);
      else {
        const balRes = await fetch('/api/balance');
        const balData = await balRes.json();
        if (balData.success) setBalance(balData.balance);
      }
      setDepositAmount('');
    } catch { setError('Connection failed'); }
    finally { setLoading(false); }
  }

  function queueStatus(w) {
    if (w.status === 'COMPLETED') return { label: 'Completed', done: true };
    const elapsed = Math.floor((Date.now() - new Date(w.updatedAt || w.createdAt).getTime()) / 60000);
    const steps = Math.floor(elapsed / 5);
    const seed = w.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const perStep = 5 + (seed % 10);
    const pos = Math.max(0, w.queuePos - steps * perStep);
    const progress = Math.min(100, ((10000 - pos) / 10000) * 100);
    return { label: `#${formatNumber(pos)}`, done: false, progress };
  }

  if (!user) return null;

  const robuxRate = 0.0035;

  return (
    <div className="modal-overlay show" onClick={(e) => e.target.classList.contains('modal-overlay') && onClose()}>
      <div className="finance-modal">
        <button className="modal-close" onClick={onClose}><X size={20} /></button>

        <div className="fm-header">
          <Wallet size={22} className="fm-header-icon" />
          <span>Finance</span>
        </div>

        <div className="fm-tabs">
          {[
            { key: 'balance', icon: <Wallet size={16} />, label: 'Balance' },
            { key: 'withdraw', icon: <ArrowUpRight size={16} />, label: 'Withdraw' },
            { key: 'deposit', icon: <ArrowDownLeft size={16} />, label: 'Deposit' },
          ].map(t => (
            <button
              key={t.key}
              className={`fm-tab ${tab === t.key ? 'active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="fm-body">
          {error && (
            <div className="fm-error">
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          {tab === 'balance' && (
            <div className="fm-balance">
              <div className="fm-balance-card">
                <div className="fm-balance-top">
                  <span className="fm-balance-label">Available Balance</span>
                  <TrendingUp size={16} className="fm-balance-icon" />
                </div>
                <div className="fm-balance-amount">${balance.toFixed(2)}</div>
                <div className="fm-balance-convert">
                  ≈ {formatNumber(Math.floor(balance / robuxRate))} Robux
                </div>
              </div>

              {withdrawals.receber.length > 0 || withdrawals.enviar.length > 0 ? (
                <div className="fm-queues">
                  <div className="fm-queues-header">
                    <Layers size={16} />
                    <span>Active Queues</span>
                  </div>
                  {['receber', 'enviar'].map(t => {
                    const items = withdrawals[t].filter(w => w.status !== 'COMPLETED').slice(0, 4);
                    if (items.length === 0) return null;
                    const isRed = t === 'enviar';
                    return (
                      <div key={t} className="fm-queue-group">
                        <div className={`fm-queue-group-label ${isRed ? 'red' : ''}`}>
                          <Zap size={12} />
                          {t === 'receber' ? 'Receiving' : 'Sending'}
                        </div>
                        {items.map(w => {
                          const st = queueStatus(w);
                          return (
                            <div key={w.id} className={`fm-queue-item ${st.done ? 'done' : ''}`}>
                              <div className="fm-qi-left">
                                <div className="fm-qi-amount">{formatNumber(w.amount)} Robux</div>
                                <div className="fm-qi-progress-bar">
                                  <div className="fm-qi-progress-fill" style={{ width: `${st.progress || 0}%` }} />
                                </div>
                              </div>
                              <div className={`fm-qi-right ${st.done ? 'done' : ''}`}>
                                {st.done ? (
                                  <><Check size={12} /> Done</>
                                ) : (
                                  <><Gauge size={12} /> {st.label}</>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="fm-empty">
                  <History size={32} />
                  <p>No withdrawal activity yet</p>
                </div>
              )}
            </div>
          )}

          {tab === 'withdraw' && (
            <form onSubmit={handleWithdraw} className="fm-form">
              <div className="fm-form-header">
                <ArrowUpRight size={20} />
                <div>
                  <h3>Withdraw Robux</h3>
                  <p className="fm-sub">Convert balance to Robux via processing queue</p>
                </div>
              </div>

              <div className="fm-toggle">
                <button type="button" className={`fm-toggle-btn ${withdrawType === 'receber' ? 'active' : ''}`} onClick={() => setWithdrawType('receber')}>
                  <Zap size={14} /> Receber
                </button>
                <button type="button" className={`fm-toggle-btn ${withdrawType === 'enviar' ? 'active' : ''}`} onClick={() => setWithdrawType('enviar')}>
                  <ArrowUpRight size={14} /> Enviar
                </button>
              </div>

              <div className="fm-input-wrap">
                <label className="fm-label">Amount (Robux)</label>
                <input
                  type="number"
                  placeholder="e.g. 10000"
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  required min="7143"
                />
              </div>

              <div className="fm-conversion">
                <span>≈ ${((parseFloat(withdrawAmount) || 0) * robuxRate).toFixed(2)} USD · Minimum $25 (7,143 Robux)</span>
              </div>

              <button type="submit" className="fm-btn" disabled={loading || !withdrawAmount}>
                {loading ? <><Clock size={16} /> Processing...</> : 'Submit Withdrawal'}
              </button>
            </form>
          )}

          {tab === 'deposit' && (
            <>
              {depositMethod === 'robux' ? (
                <DepositRobux
                  user={user}
                  onClose={() => setDepositMethod('crypto')}
                  onDepositComplete={(newBalance) => {
                    setBalance(newBalance);
                    setDepositMethod('crypto');
                  }}
                  onOpenLinkRoblox={() => window.open('/settings', '_blank')}
                />
              ) : (
              <form onSubmit={handleDeposit} className="fm-form">
                <div className="fm-form-header">
                  <ArrowDownLeft size={20} />
                  <div>
                    <h3>Deposit Funds</h3>
                    <p className="fm-sub">Choose a payment method</p>
                  </div>
                </div>

                <label className="fm-label">Payment Method</label>
                <div className="fm-pm-grid">
                  {[
                    { id: 'crypto', icon: <Bitcoin size={18} />, label: 'Crypto', bonus: '1.0x' },
                    { id: 'paypal', icon: <DollarSign size={18} />, label: 'PayPal', bonus: '0.95x' },
                    { id: 'cashapp', icon: <CreditCard size={18} />, label: 'Cash App', bonus: '0.97x' },
                    { id: 'robux', icon: <Wallet size={18} />, label: 'Robux', bonus: '-' },
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      className={`fm-pm-card ${depositMethod === m.id ? 'active' : ''}`}
                      onClick={() => setDepositMethod(m.id)}
                    >
                      {m.icon}
                      <span className="fm-pm-label">{m.label}</span>
                      <span className="fm-pm-bonus">{m.bonus}</span>
                    </button>
                  ))}
                </div>

                {depositMethod !== 'robux' && (<>
                <label className="fm-label">Select Amount</label>
                <div className="fm-amount-grid">
                  {[25, 50, 100, 500, 1000, 10000].map(amt => {
                    const robux = Math.floor(amt * 100 * { crypto: 1, paypal: 0.95, cashapp: 0.97 }[depositMethod]);
                    const selected = parseFloat(depositAmount) === amt;
                    return (
                      <button
                        key={amt}
                        type="button"
                        className={`fm-amount-btn ${selected ? 'active' : ''}`}
                        onClick={() => setDepositAmount(selected ? '' : String(amt))}
                      >
                        <span className="fm-amt-usd">${formatNumber(amt)}</span>
                        <span className="fm-amt-robux">≈ {formatNumber(robux)} Robux</span>
                      </button>
                    );
                  })}
                </div>

                <button type="submit" className="fm-btn" disabled={loading || !depositAmount}>
                  {loading ? <><Clock size={16} /> Processing...</> : (
                    <>{depositMethod === 'crypto' ? <Bitcoin size={16} /> : depositMethod === 'paypal' ? <DollarSign size={16} /> : <CreditCard size={16} />} Pay ${formatNumber(parseFloat(depositAmount || 0))} USD</>
                  )}
                </button>
                </>)}
              </form>
              )}
            </>
          )}
        </div>

        <div className="fm-footer">
          <span>NexBlox Finance</span>
        </div>
      </div>

      <style>{`
        .finance-modal {
          background: rgba(17, 17, 19, 0.75);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          max-width: 480px;
          width: 100%;
          position: relative;
          animation: modalIn 0.25s ease-out;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.03), 0 20px 60px rgba(0,0,0,0.5);
          max-height: 90vh;
          overflow-y: auto;
        }
        .finance-modal::-webkit-scrollbar { width: 4px; }
        .finance-modal::-webkit-scrollbar-thumb { background: #2a2a2e; border-radius: 4px; }

        .fm-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 20px 24px 0;
          font-size: 18px;
          font-weight: 700;
          color: #fff;
        }
        .fm-header-icon { color: #f59e0b; }

        .fm-tabs {
          display: flex;
          gap: 6px;
          margin: 16px 24px 0;
          padding: 4px;
          background: rgba(26, 26, 30, 0.5);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
        }
        .fm-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 12px;
          border: none;
          background: transparent;
          color: #6b7280;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          font-family: inherit;
          font-weight: 500;
          transition: all 0.2s;
        }
        .fm-tab:hover { color: #d1d5db; }
        .fm-tab.active {
          background: #f59e0b;
          color: #000;
          font-weight: 600;
        }

        .fm-body { padding: 20px 24px; min-height: 220px; }

        .fm-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 8px;
          color: #fca5a5;
          font-size: 13px;
          margin-bottom: 16px;
        }

        .fm-balance-card {
          background: rgba(30, 30, 36, 0.5);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
        }
        .fm-balance-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .fm-balance-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500; }
        .fm-balance-icon { color: #f59e0b; }
        .fm-balance-amount { font-size: 36px; font-weight: 800; color: #fff; letter-spacing: -0.5px; margin-bottom: 4px; }
        .fm-balance-convert { font-size: 13px; color: #6b7280; }

        .fm-queues-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #d1d5db;
          margin-bottom: 12px;
        }
        .fm-queues-header svg { color: #f59e0b; }

        .fm-queue-group { margin-bottom: 14px; }
        .fm-queue-group-label {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #22c55e;
          margin-bottom: 6px;
        }
        .fm-queue-group-label.red { color: #ef4444; }

        .fm-queue-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 14px;
          background: rgba(26, 26, 30, 0.5);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 8px;
          margin-bottom: 4px;
          transition: background 0.15s;
        }
        .fm-queue-item:hover { background: rgba(32, 32, 36, 0.6); }
        .fm-queue-item.done { opacity: 0.6; }
        .fm-qi-left { flex: 1; min-width: 0; }
        .fm-qi-amount { font-size: 13px; font-weight: 600; color: #e5e7eb; margin-bottom: 6px; }
        .fm-qi-progress-bar { height: 3px; background: #2a2a2e; border-radius: 2px; overflow: hidden; }
        .fm-qi-progress-fill { height: 100%; background: linear-gradient(90deg, #f59e0b, #fbbf24); border-radius: 2px; transition: width 0.5s; }
        .fm-qi-right {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 600;
          color: #f59e0b;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .fm-qi-right.done { color: #22c55e; }

        .fm-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 40px 0;
          color: #4b5563;
        }
        .fm-empty p { font-size: 14px; margin: 0; }

        .fm-form { }
        .fm-form-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 20px;
        }
        .fm-form-header svg { color: #f59e0b; margin-top: 2px; flex-shrink: 0; }
        .fm-form-header h3 { margin: 0; font-size: 16px; font-weight: 700; color: #fff; }
        .fm-sub { margin: 4px 0 0; font-size: 13px; color: #6b7280; }

        .fm-toggle {
          display: flex;
          gap: 6px;
          margin-bottom: 16px;
          padding: 4px;
          background: rgba(26, 26, 30, 0.5);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 8px;
        }
        .fm-toggle-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px;
          border: none;
          background: transparent;
          color: #6b7280;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-family: inherit;
          font-weight: 500;
          transition: all 0.2s;
        }
        .fm-toggle-btn.active { background: #f59e0b; color: #000; font-weight: 600; }
        .fm-toggle-btn:not(.active):hover { color: #d1d5db; }

        .fm-pm-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-bottom: 16px;
        }

        .fm-amount-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-bottom: 16px;
        }
        .fm-amount-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 16px 8px;
          background: rgba(26, 26, 30, 0.5);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }
        .fm-amount-btn:hover { border-color: rgba(255,255,255,0.15); }
        .fm-amount-btn.active { border-color: #f59e0b; background: rgba(245,158,11,0.12); }
        .fm-amt-usd { font-size: 16px; font-weight: 700; color: #fff; }
        .fm-amount-btn.active .fm-amt-usd { color: #fbbf24; }
        .fm-amt-robux { font-size: 10px; color: #6b7280; }
        .fm-pm-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 14px 8px;
          background: rgba(26, 26, 30, 0.5);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
          color: #6b7280;
        }
        .fm-pm-card:hover { border-color: rgba(255,255,255,0.15); color: #d1d5db; }
        .fm-pm-card.active { border-color: #f59e0b; background: rgba(245,158,11,0.12); color: #fff; }
        .fm-pm-card svg { color: currentColor; }
        .fm-pm-label { font-size: 12px; font-weight: 600; }
        .fm-pm-bonus { font-size: 10px; color: #22c55e; font-weight: 500; background: rgba(34,197,94,0.12); padding: 2px 8px; border-radius: 4px; }

        .fm-input-wrap { margin-bottom: 12px; }
        .fm-label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: #9ca3af;
          margin-bottom: 6px;
        }
        .fm-input-wrap input {
          width: 100%;
          padding: 12px 14px;
          background: rgba(26, 26, 30, 0.5);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          color: #fff;
          font-size: 15px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .fm-input-wrap input:focus { border-color: #f59e0b; }
        .fm-input-wrap input::placeholder { color: #4b5563; }

        .fm-conversion {
          padding: 10px 14px;
          background: rgba(245,158,11,0.06);
          border: 1px solid rgba(245,158,11,0.12);
          border-radius: 8px;
          margin-bottom: 16px;
        }
        .fm-conversion span { font-size: 12px; color: #9ca3af; }

        .fm-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 12px;
          background: #f59e0b;
          border: none;
          border-radius: 10px;
          color: #000;
          font-size: 14px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.15s;
        }
        .fm-btn:hover:not(:disabled) { background: #fbbf24; transform: translateY(-1px); }
        .fm-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

        .fm-footer {
          text-align: center;
          padding: 0 24px 20px;
          font-size: 11px;
          color: #4b5563;
        }

        @keyframes modalIn {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
