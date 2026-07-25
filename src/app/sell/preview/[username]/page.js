'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Package, ShoppingCart, DollarSign, User, Crown, Loader2, Check, AlertCircle, X } from 'lucide-react';
import { useLang } from '@/lib/LanguageProvider';
import { appLocales } from '@/lib/appLocales';

export default function SellerPreviewPage() {
  const router = useRouter();
  const params = useParams();
  const username = params?.username;
  const { lang } = useLang();
  const t = appLocales[lang].sell;
  const ct = appLocales[lang].common;

  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [buyingId, setBuyingId] = useState(null);
  const [user, setUser] = useState(null);
  const [confirmItem, setConfirmItem] = useState(null);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      setUser(d.authenticated ? d : null);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!username) return;
    fetch(`/api/seller/store/${encodeURIComponent(username)}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setStore(d.store);
        else setError(d.error || 'Store not found');
      })
      .catch(() => setError('Failed to load store'))
      .finally(() => setLoading(false));
  }, [username]);

  async function handleBuy(sellerItemId) {
    if (!user) { router.push('/login'); return; }
    if (user.balance < (store.items.find(i => i.id === sellerItemId)?.priceUsd || 0)) {
      setMsg({ type: 'error', text: appLocales[lang].settings.failedSend });
      return;
    }
    setBuyingId(sellerItemId);
    setMsg(null);
    try {
      const res = await fetch('/api/seller/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerItemId }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ type: 'success', text: t.buySuccess });
        setStore(prev => ({ ...prev, items: prev.items.filter(i => i.id !== sellerItemId) }));
        if (user) setUser(prev => ({ ...prev, balance: data.newBalance }));
      } else {
        setMsg({ type: 'error', text: data.error || t.buyError });
      }
    } catch {
      setMsg({ type: 'error', text: t.buyError });
    } finally {
      setBuyingId(null);
      setConfirmItem(null);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0B0B0F', color: '#fff' }}>
      <div className="sell-preview-header">
        <button className="sell-preview-back" onClick={() => router.back()}>
          ← {ct.back}
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="loading-spinner" /></div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#ef4444' }}>{error}</div>
      ) : store ? (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px' }}>
          <div className="sell-preview-profile">
            <div className="sell-preview-avatar-wrap">
              {store.avatarUrl ? (
                <img src={store.avatarUrl} alt={store.robloxUsername || ''} className="sell-preview-avatar" />
              ) : (
                <div className="sell-preview-avatar sell-preview-avatar-placeholder">
                  <User size={36} />
                </div>
              )}
              <Crown size={20} className="sell-preview-crown" />
            </div>
            <h1 className="sell-preview-name">{store.robloxUsername || 'Unknown'}</h1>
            <div className="sell-preview-stats">
              <div className="sell-preview-stat">
                <DollarSign size={14} />
                <span>${(store.totalValue || 0).toFixed(2)}</span>
              </div>
              <div className="sell-preview-stat">
                <Package size={14} />
                <span>{store.items?.length || 0} {t.listed}</span>
              </div>
              <div className="sell-preview-stat">
                <ShoppingCart size={14} />
                <span>{store.totalSales || 0} {t.sold}</span>
              </div>
            </div>
          </div>

          {msg && (
            <div className={`sell-msg sell-msg-${msg.type}`} style={{ marginBottom: 16 }}>
              {msg.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
              {msg.text}
            </div>
          )}

          {!store.items || store.items.length === 0 ? (
            <div className="table-empty" style={{ padding: 48 }}>
              <Package size={32} style={{ opacity: 0.3 }} />
              <span>{t.sellerEmpty}</span>
            </div>
          ) : (
            <div className="inv-grid">
              {store.items.map(si => {
                const it = si.item || {};
                return (
                  <div key={si.id} className="inv-card">
                    <div className="inv-card-img" style={{ cursor: 'pointer' }} onClick={() => setConfirmItem(si)}>
                      {it.img ? <img src={it.img} alt={it.name || ''} /> : <div className="cell-item-placeholder" />}
                    </div>
                    <div className="inv-card-name">{it.name || 'Unknown'}</div>
                    <div className="inv-card-meta">
                      {it.category && <span className="inv-tag inv-tag-cat">{it.category}</span>}
                      {it.rarity && <span className="inv-tag inv-tag-rar">{it.rarity}</span>}
                    </div>
                    <div className="inv-card-foot">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span className="inv-card-price">{si.priceRobux.toLocaleString()} <span style={{ fontSize: 11, color: '#9ca3af' }}>R$</span></span>
                        <span style={{ fontSize: 11, color: '#6b7280' }}>${si.priceUsd.toFixed(2)}</span>
                      </div>
                      <button
                        className="purchase-btn"
                        style={{ padding: '6px 14px', fontSize: 12 }}
                        disabled={buyingId === si.id}
                        onClick={() => setConfirmItem(si)}
                      >
                        {buyingId === si.id ? <Loader2 size={14} className="spin" /> : t.buyNow}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {confirmItem && !buyingId && (
        <div className="inv-modal-backdrop" onClick={() => setConfirmItem(null)}>
          <div className="inv-modal" onClick={e => e.stopPropagation()}>
            <button className="inv-modal-close" onClick={() => setConfirmItem(null)}><X size={18} /></button>
            <div className="inv-modal-img">
              {confirmItem.item?.img ? <img src={confirmItem.item.img} alt={confirmItem.item?.name || ''} /> : <div className="cell-item-placeholder" />}
            </div>
            <h3 className="inv-modal-title">{confirmItem.item?.name || 'Unknown'}</h3>
            <div className="inv-modal-rows">
              <div><span>{t.robuxPrice}</span><b>{confirmItem.priceRobux.toLocaleString()} R$</b></div>
              <div><span>{t.usdPrice}</span><b>${confirmItem.priceUsd.toFixed(2)}</b></div>
              {confirmItem.item?.rap && <div><span>RAP</span><b>{confirmItem.item.rap.toLocaleString()}</b></div>}
              {confirmItem.item?.category && <div><span>Category</span><b>{confirmItem.item.category}</b></div>}
              {confirmItem.item?.rarity && <div><span>Rarity</span><b>{confirmItem.item.rarity}</b></div>}
            </div>
            <div style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', margin: '4px 0 10px' }}>
              {t.balance}: <strong style={{ color: '#e5e7eb' }}>${(user?.balance || 0).toFixed(2)}</strong>
            </div>
            <button
              className="purchase-btn"
              style={{ width: '100%' }}
              disabled={!user || (user?.balance || 0) < confirmItem.priceUsd}
              onClick={() => handleBuy(confirmItem.id)}
            >
              {!user ? 'Login to Buy' : (user?.balance || 0) < confirmItem.priceUsd ? 'Insufficient Balance' : `${t.buyNow} — $${confirmItem.priceUsd.toFixed(2)}`}
            </button>
            {!user?.robloxId && (
              <div style={{ fontSize: 11, color: '#ef4444', textAlign: 'center', marginTop: 6 }}>
                <AlertCircle size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                Verify your Roblox account to buy
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
