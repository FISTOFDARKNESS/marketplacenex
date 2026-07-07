'use client';

import { useState, useEffect } from 'react';
import { X, Wallet, ArrowUpRight, ArrowDownLeft, Clock, Check, AlertTriangle, Bitcoin, DollarSign, CreditCard } from 'lucide-react';

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

  useEffect(() => {
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
  }, [user]);

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
      const balRes = await fetch('/api/balance');
      const balData = await balRes.json();
      if (balData.success) setBalance(balData.balance);
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
      if (data.deposit?.paymentUrl) {
        window.open(data.deposit.paymentUrl, '_blank');
      }
      setDepositAmount('');
      const balRes = await fetch('/api/balance');
      const balData = await balRes.json();
      if (balData.success) setBalance(balData.balance);
    } catch { setError('Connection failed'); }
    finally { setLoading(false); }
  }

  function queueStatus(w) {
    if (w.status === 'COMPLETED') return 'Transferred';
    const elapsed = Math.floor((Date.now() - new Date(w.updatedAt || w.createdAt).getTime()) / 60000);
    const steps = Math.floor(elapsed / 5);
    return `#${Math.max(0, w.queuePos - steps * (Math.floor(Math.random() * 10 + 5)))}`;
  }

  if (!user) return null;

  return (
    <div className="modal-overlay show" onClick={(e) => e.target.classList.contains('modal-overlay') && onClose()}>
      <div className="modal finance-modal">
        <button className="modal-close" onClick={onClose}><X className="icon" /></button>

        <div className="finance-tabs">
          <button className={`finance-tab ${tab === 'balance' ? 'active' : ''}`} onClick={() => setTab('balance')}>
            <Wallet className="icon" /> Balance
          </button>
          <button className={`finance-tab ${tab === 'withdraw' ? 'active' : ''}`} onClick={() => setTab('withdraw')}>
            <ArrowUpRight className="icon" /> Withdraw
          </button>
          <button className={`finance-tab ${tab === 'deposit' ? 'active' : ''}`} onClick={() => setTab('deposit')}>
            <ArrowDownLeft className="icon" /> Deposit
          </button>
        </div>

        <div className="finance-body">
          {error && <div className="purchase-error"><AlertTriangle className="icon" /> {error}</div>}

          {tab === 'balance' && (
            <div className="finance-balance">
              <h3>Your Balance</h3>
              <div className="balance-amount">${balance.toFixed(2)} USD</div>
              <p className="purchase-muted">≈ {Math.floor(balance / 0.0035).toLocaleString()} Robux</p>
              <div className="finance-queues">
                <h4>Withdrawal Queues</h4>
                {['receber', 'enviar'].map(t => (
                  <div key={t} className="queue-section">
                    <h5>{t === 'receber' ? 'Receber' : 'Enviar'}</h5>
                    {withdrawals[t].length === 0 ? (
                      <p className="purchase-muted">No active {t} withdrawals</p>
                    ) : (
                      withdrawals[t].slice(0, 5).map(w => (
                        <div key={w.id} className="queue-item">
                          <span>{w.amount.toLocaleString()} Robux</span>
                          <span className={`queue-pos ${w.status === 'COMPLETED' ? 'done' : ''}`}>
                            {w.status === 'COMPLETED' ? <><Check className="icon" /> Done</> : <><Clock className="icon" /> {queueStatus(w)}</>}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'withdraw' && (
            <form onSubmit={handleWithdraw} className="finance-form">
              <h3>Withdraw Robux</h3>
              <p className="purchase-muted">Convert your balance to Robux. Enters a processing queue.</p>
              <div className="queue-type-select">
                <button type="button" className={`qt-btn ${withdrawType === 'receber' ? 'active' : ''}`} onClick={() => setWithdrawType('receber')}>Receber</button>
                <button type="button" className={`qt-btn ${withdrawType === 'enviar' ? 'active' : ''}`} onClick={() => setWithdrawType('enviar')}>Enviar</button>
              </div>
              <input type="number" placeholder="Amount in Robux" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} required min="1" />
              <p className="purchase-muted" style={{ fontSize: '11px' }}>≈ ${((parseFloat(withdrawAmount) || 0) * 0.0035).toFixed(2)} USD will be deducted</p>
              <button type="submit" className="purchase-btn" disabled={loading}>{loading ? 'Processing...' : 'Withdraw'}</button>
            </form>
          )}

          {tab === 'deposit' && (
            <form onSubmit={handleDeposit} className="finance-form">
              <h3>Buy Robux Credits</h3>
              <p className="purchase-muted">Purchase site credits to use on the marketplace.</p>
              <div className="payment-methods">
                {[
                  { id: 'crypto', label: 'Crypto', icon: <Bitcoin className="icon" /> },
                  { id: 'paypal', label: 'PayPal', icon: <DollarSign className="icon" /> },
                  { id: 'cashapp', label: 'Cash App', icon: <CreditCard className="icon" /> },
                ].map(m => (
                  <button key={m.id} type="button" className={`pm-btn ${depositMethod === m.id ? 'active' : ''}`} onClick={() => setDepositMethod(m.id)}>
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>
              <input type="number" placeholder="USD amount" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} required min="1" step="0.01" />
              <p className="purchase-muted" style={{ fontSize: '11px' }}>
                You get ≈ {Math.floor((parseFloat(depositAmount) || 0) * 100 * { crypto: 1, paypal: 0.95, cashapp: 0.97 }[depositMethod]).toLocaleString()} Robux
              </p>
              <button type="submit" className="purchase-btn" disabled={loading}>{loading ? 'Processing...' : 'Buy now'}</button>
            </form>
          )}
        </div>
      </div>

      <style>{`
        .finance-modal { max-width: 500px; }
        .finance-tabs { display: flex; gap: 4px; margin-bottom: 20px; background: var(--bg-3); border-radius: 8px; padding: 4px; }
        .finance-tab { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; border: none; background: transparent; color: var(--text-muted); border-radius: 6px; cursor: pointer; font-size: 13px; font-family: inherit; transition: all 0.15s; }
        .finance-tab.active { background: var(--accent); color: #000; }
        .finance-body { min-height: 200px; }
        .finance-balance h3 { margin: 0 0 8px; font-size: 14px; color: var(--text-muted); }
        .balance-amount { font-size: 32px; font-weight: 700; color: var(--accent); margin-bottom: 4px; }
        .finance-queues { margin-top: 24px; }
        .finance-queues h4 { font-size: 13px; color: var(--text-muted); margin: 0 0 12px; }
        .queue-section { margin-bottom: 16px; }
        .queue-section h5 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); margin: 0 0 8px; }
        .queue-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: var(--bg-3); border-radius: 6px; margin-bottom: 4px; font-size: 13px; }
        .queue-pos { display: flex; align-items: center; gap: 4px; color: var(--accent); }
        .queue-pos.done { color: #22c55e; }
        .queue-pos .icon { width: 14px; height: 14px; }
        .finance-form h3 { margin: 0 0 8px; }
        .finance-form input { width: 100%; padding: 10px 14px; background: var(--bg-3); border: 1px solid var(--line); border-radius: 6px; color: var(--text); font-size: 14px; font-family: inherit; outline: none; margin-bottom: 8px; box-sizing: border-box; }
        .finance-form input:focus { border-color: var(--accent); }
        .queue-type-select, .payment-methods { display: flex; gap: 4px; margin-bottom: 12px; background: var(--bg-3); border-radius: 6px; padding: 4px; }
        .qt-btn, .pm-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px; border: none; background: transparent; color: var(--text-muted); border-radius: 6px; cursor: pointer; font-size: 13px; font-family: inherit; transition: all 0.15s; }
        .qt-btn.active, .pm-btn.active { background: var(--accent); color: #000; }
      `}</style>
    </div>
  );
}
