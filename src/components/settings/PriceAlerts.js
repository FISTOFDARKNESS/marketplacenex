'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, Search, Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { notificationsSupported, subscribeToPush, unsubscribeFromPush, getExistingSubscription } from '@/lib/notifications';
import { ALERTS_LOCALES } from '@/lib/alertsLocales';

export default function PriceAlerts({ lang = 'en' }) {
  const t = ALERTS_LOCALES[lang] || ALERTS_LOCALES.en;
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [supported, setSupported] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { setSupported(notificationsSupported()); }, []);

  const loadAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/alerts');
      if (res.status === 401) { setError(t.notAuthenticated); return; }
      const data = await res.json();
      if (data.success) {
        setAlerts(data.alerts);
      }
    } catch { /* ignore */ }
  }, [t]);

  useEffect(() => {
    (async () => {
      const sub = await getExistingSubscription().catch(() => null);
      if (sub) setEnabled(true);
      await loadAlerts();
    })();
  }, [loadAlerts]);

  async function handleEnableToggle() {
    setError('');
    setBusy(true);
    try {
      if (enabled) {
        await unsubscribeFromPush();
        setEnabled(false);
      } else {
        await subscribeToPush();
        setEnabled(true);
      }
    } catch (e) {
      const msg = e?.message || e?.toString() || String(e);
      const detail = `[${e?.name || 'Error'}] ${msg}`;
      console.error('[Push] enable error:', { message: msg, name: e?.name, stack: e?.stack, full: e });
      if (msg === 'denied') setError(`${t.permissionDenied} (${msg})`);
      else if (msg === 'vapid-missing') setError(`${t.vapidMissing} (${msg})`);
      else if (msg === 'not-supported') setError(`${t.notSupported} (${msg})`);
      else if (msg === 'not-authenticated') setError(t.notAuthenticated);
      else setError(`${t.enableError} (${msg})`);
    } finally {
      setBusy(false);
    }
  }

  async function runSearch(q) {
    setSearch(q);
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/items?search=${encodeURIComponent(q)}&limit=12`);
      const data = await res.json();
      if (data.success) {
        const existing = new Set(alerts.map((a) => a.item?.id));
        setResults((data.items || []).filter((i) => !existing.has(i.id)).slice(0, 8));
      }
    } catch { /* ignore */ }
    finally { setSearching(false); }
  }

  async function addAlert(item) {
    setError('');
    // no limit
    try {
      const res = await fetch('/api/settings/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          onPriceUp: true, onPriceDown: false, onRapUp: false, onRapDown: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || t.addError); return; }
      setSearch('');
      setResults([]);
      await loadAlerts();
    } catch { setError(t.addError); }
  }

  async function patchAlert(id, patch) {
    try {
      await fetch(`/api/settings/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      await loadAlerts();
    } catch { /* ignore */ }
  }

  async function removeAlert(id) {
    try {
      await fetch(`/api/settings/alerts/${id}`, { method: 'DELETE' });
      await loadAlerts();
    } catch { /* ignore */ }
  }

  return (
    <div className="price-alerts">
      {supported !== null && (
        <div className="pa-enable-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {enabled ? <Bell size={16} style={{ color: '#FFD700' }} /> : <BellOff size={16} style={{ color: '#9ca3af' }} />}
            <span style={{ fontSize: '13px', color: enabled ? '#FFD700' : '#9ca3af' }}>
              {enabled ? t.enabled : t.disabled}
            </span>
          </div>
          {supported && (
            <button
              className="pa-toggle"
              onClick={handleEnableToggle}
              disabled={busy}
              style={enabled ? { borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444' } : {}}
            >
              {busy ? t.processing : enabled ? t.disable : t.enable}
            </button>
          )}
        </div>
      )}

      {supported === false && <div className="pa-note">{t.notSupported}</div>}
      {error && <div className="pa-error">{error}</div>}

      {enabled && (
        <>
          <div className="pa-picker">
            <div className="pa-search-wrap">
              <Search size={14} className="pa-search-icon" />
              <input
                className="pa-search"
                placeholder={t.searchPlaceholder}
                value={search}
                onChange={(e) => runSearch(e.target.value)}
              />
            </div>
            {searching && <div className="pa-search-hint">{t.searching}</div>}
            {results.length > 0 && (
              <div className="pa-results">
                {results.map((it) => (
                  <button key={it.id} className="pa-result" onClick={() => addAlert(it)}>
                    <span className="pa-result-name">{it.name}</span>
                    <Plus size={14} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pa-list">
            {alerts.length === 0 && <div className="pa-empty">{t.empty}</div>}
            {alerts.map((a) => (
              <div key={a.id} className="pa-item">
                <div className="pa-item-head">
                  <span className="pa-item-name">{a.item?.name || 'Unknown'}</span>
                  <button className="pa-remove" onClick={() => removeAlert(a.id)} aria-label={t.remove}>
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="pa-flags">
                  <FlagBtn active={a.onPriceUp} onClick={() => patchAlert(a.id, { onPriceUp: !a.onPriceUp })} icon={<TrendingUp size={12} />} label={t.priceUp} />
                  <FlagBtn active={a.onPriceDown} onClick={() => patchAlert(a.id, { onPriceDown: !a.onPriceDown })} icon={<TrendingDown size={12} />} label={t.priceDown} />
                  <FlagBtn active={a.onRapUp} onClick={() => patchAlert(a.id, { onRapUp: !a.onRapUp })} icon={<TrendingUp size={12} />} label={t.rapUp} />
                  <FlagBtn active={a.onRapDown} onClick={() => patchAlert(a.id, { onRapDown: !a.onRapDown })} icon={<TrendingDown size={12} />} label={t.rapDown} />
                </div>
              </div>
            ))}
          </div>
          <div className="pa-counter">{alerts.length}</div>
        </>
      )}
    </div>
  );
}

function FlagBtn({ active, onClick, icon, label }) {
  return (
    <button className={`pa-flag ${active ? 'active' : ''}`} onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  );
}
