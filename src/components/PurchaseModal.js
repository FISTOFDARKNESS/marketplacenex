'use client';

import { useState } from 'react';
import { X, ArrowLeft, Check, AlertTriangle, ExternalLink, Clock } from 'lucide-react';

const STEPS = { DETAILS: 0, ROBLOX_USER: 1, VERIFY: 2, PAYMENT: 3, CONFIRMATION: 4 };

export default function PurchaseModal({ item, onClose }) {
  const [step, setStep] = useState(STEPS.DETAILS);
  const [robloxUser, setRobloxUser] = useState('');
  const [robloxData, setRobloxData] = useState(null);
  const [verifyData, setVerifyData] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLookupRoblox(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/roblox/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: robloxUser }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to lookup user');
        return;
      }
      setRobloxData(data);
      setStep(STEPS.VERIFY);
    } catch {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/roblox/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ robloxId: robloxData.robloxId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Verification failed');
        return;
      }
      if (!data.inventoryPublic) {
        setError('Your inventory must be public. Enable it in Roblox privacy settings.');
        setLoading(false);
        return;
      }
      setVerifyData(data);
      setStep(STEPS.PAYMENT);
    } catch {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreatePayment() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(item.usdPrice),
          itemName: item.name,
          itemId: item.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create payment');
        return;
      }
      setPaymentData(data);
      setStep(STEPS.CONFIRMATION);
    } catch {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  }

  function renderDetails() {
    return (
      <>
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
          <b>{item.price.toLocaleString()} Robux</b>
        </div>
        <div className="purchase-detail-row">
          <span>Price (USD)</span>
          <b className="gold-text">${item.usdPrice}</b>
        </div>
        <button className="purchase-btn" onClick={() => setStep(STEPS.ROBLOX_USER)}>
          Continue
        </button>
      </>
    );
  }

  function renderRobloxUser() {
    return (
      <>
        <h3>Enter your Roblox username</h3>
        <p className="purchase-muted">We need to verify your account before proceeding.</p>
        <form onSubmit={handleLookupRoblox} className="purchase-form">
          <input
            type="text"
            placeholder="Roblox username"
            value={robloxUser}
            onChange={(e) => setRobloxUser(e.target.value)}
            required
          />
          <button type="submit" className="purchase-btn" disabled={loading}>
            {loading ? 'Looking up...' : 'Look up'}
          </button>
        </form>
      </>
    );
  }

  function renderVerify() {
    return (
      <>
        <div className="purchase-avatar-wrap">
          <img src={robloxData.avatarUrl} alt={robloxData.displayName} className="purchase-avatar" />
        </div>
        <h3>Is this you?</h3>
        <p className="purchase-muted">{robloxData.displayName}</p>
        <p className="purchase-muted" style={{ fontSize: '12px' }}>
          We will check your inventory and membership status.
        </p>
        <div className="purchase-btn-group">
          <button className="purchase-btn purchase-btn-secondary" onClick={() => setStep(STEPS.ROBLOX_USER)}>
            <ArrowLeft className="icon" /> No, go back
          </button>
          <button className="purchase-btn" onClick={handleVerify} disabled={loading}>
            {loading ? 'Checking...' : 'Yes, verify me'}
          </button>
        </div>
      </>
    );
  }

  function renderPayment() {
    return (
      <>
        <div className="purchase-check-icon">
          <Check />
        </div>
        <h3>Verification passed</h3>
        {verifyData && (
          <div className="purchase-verify-badges">
            <span className={`badge ${verifyData.inventoryPublic ? 'badge-ok' : 'badge-fail'}`}>
              {verifyData.inventoryPublic ? 'Inventory: Public' : 'Inventory: Private'}
            </span>
            <span className={`badge ${verifyData.hasPremium ? 'badge-ok' : 'badge-warn'}`}>
              {verifyData.hasPremium ? 'VIP: Active' : 'VIP: Not detected'}
            </span>
          </div>
        )}
        <p className="purchase-muted">
          You meet the requirements. Proceed to payment of <b className="gold-text">${item.usdPrice}</b>.
        </p>
        <button className="purchase-btn" onClick={handleCreatePayment} disabled={loading}>
          {loading ? 'Generating payment...' : 'Proceed to payment'}
        </button>
      </>
    );
  }

  function renderConfirmation() {
    return (
      <>
        <div className="purchase-clock-icon">
          <Clock />
        </div>
        <h3>Payment initiated</h3>
        <p className="purchase-muted">
          Complete your payment through the Cryptomus gateway.
        </p>
        <a
          href={paymentData?.paymentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="purchase-btn purchase-btn-external"
        >
          Pay now <ExternalLink className="icon" />
        </a>
        <div className="purchase-wait-notice">
          <AlertTriangle className="icon" />
          <span>
            After payment, please allow <b>7 to 10 business days</b> for the item to be delivered. Our team will manually verify and process your order.
          </span>
        </div>
        <button className="purchase-btn purchase-btn-secondary" onClick={onClose}>
          Close
        </button>
      </>
    );
  }

  const stepTitles = ['Confirm item', 'Roblox user', 'Verification', 'Payment', 'Done'];

  return (
    <div className="modal-overlay show" onClick={(e) => e.target.classList.contains('modal-overlay') && onClose()}>
      <div className="modal purchase-modal">
        <button className="modal-close" onClick={onClose}>
          <X className="icon" />
        </button>

        <div className="purchase-steps">
          {stepTitles.map((title, i) => (
            <div key={i} className={`purchase-step-indicator ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
              <span className="step-num">{i < step ? <Check /> : i + 1}</span>
              <span className="step-label">{title}</span>
            </div>
          ))}
        </div>

        <div className="purchase-body">
          {error && (
            <div className="purchase-error">
              <AlertTriangle className="icon" /> {error}
            </div>
          )}

          {step === STEPS.DETAILS && renderDetails()}
          {step === STEPS.ROBLOX_USER && renderRobloxUser()}
          {step === STEPS.VERIFY && renderVerify()}
          {step === STEPS.PAYMENT && renderPayment()}
          {step === STEPS.CONFIRMATION && renderConfirmation()}
        </div>
      </div>
    </div>
  );
}
