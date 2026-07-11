'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, Search, Plus, Check, X, Trash2, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { notificationsSupported, subscribeToPush, unsubscribeFromPush, getExistingSubscription } from '@/lib/notifications';
import { ALERTS_LOCALES } from '@/lib/alertsLocales';

const DURATIONS = [
  { value: 0, label: 'Indefinite' },
  { value: 1, label: '1 day' },
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
];

function formatDuration(duration, createdAt) {
  if (!duration) return null;
  const expires = new Date(new Date(createdAt).getTime() + duration * 86400000);
  const remaining = expires - Date.now();
  if (remaining <= 0) return 'Expired';
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

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
  const [pendingAdd, setPendingAdd] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formPriceUp, setFormPriceUp] = useState(true);
  const [formPriceDown, setFormPriceDown] = useState(false);
  const [formRapUp, setFormRapUp] = useState(false);
  const [formRapDown, setFormRapDown] = useState(false);
  const [formDuration, setFormDuration] = useState(0);

  useEffect(() => {
    setSupported(notificationsSupported());
  }, []);

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
    if (!q.trim()) { setResults([]); setSelectedItem(null); return; }
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

  function selectItem(item) {
    setSelectedItem(item);
    setError('');
    setFormPriceUp(true);
    setFormPriceDown(false);
    setFormRapUp(false);
    setFormRapDown(false);
    setFormDuration(0);
  }

  async function addAlert() {
    if (pendingAdd || !selectedItem) return;
    setError('');
    setPendingAdd(selectedItem.id);
    try {
      const res = await fetch('/api/settings/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: selectedItem.id,
          onPriceUp: formPriceUp, onPriceDown: formPriceDown,
          onRapUp: formRapUp, onRapDown: formRapDown,
          duration: formDuration || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || t.addError); setPendingAdd(null); return; }
      setAlerts((prev) => [{
        id: data.id,
        item: selectedItem,
        onPriceUp: formPriceUp, onPriceDown: formPriceDown,
        onRapUp: formRapUp, onRapDown: formRapDown,
        duration: formDuration || null,
        createdAt: new Date().toISOString(),
      }, ...prev]);
      setSelectedItem(null);
      setPendingAdd(null);
      setSearch('');
      setResults([]);
      loadAlerts().catch(() => {});
    } catch (e) {
      setError(t.addError);
      console.error('[PriceAlerts] addAlert error:', e);
      setPendingAdd(null);
    }
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

            {results.length > 0 && !selectedItem && (
              <div className="pa-results">
                {results.map((it) => (
                  <button key={it.id} className="pa-result" onClick={() => selectItem(it)}>
                    <span className="pa-result-name">{it.name}</span>
                    <Plus size={14} />
                  </button>
                ))}
              </div>
            )}

            {selectedItem && (
              <div className="pa-config">
                <div className="pa-config-head">
                  <span className="pa-config-name">{selectedItem.name}</span>
                  <button className="pa-config-close" onClick={() => { setSelectedItem(null); setError(''); }}>
                    <X size={14} />
                  </button>
                </div>
                <div className="pa-config-label">{t.notifyWhen}</div>
                <div className="pa-flags">
                  <FlagBtn active={formPriceUp} onClick={() => setFormPriceUp(!formPriceUp)} icon={<TrendingUp size={12} />} label={t.priceUp} />
                  <FlagBtn active={formPriceDown} onClick={() => setFormPriceDown(!formPriceDown)} icon={<TrendingDown size={12} />} label={t.priceDown} />
                  <FlagBtn active={formRapUp} onClick={() => setFormRapUp(!formRapUp)} icon={<TrendingUp size={12} />} label={t.rapUp} />
                  <FlagBtn active={formRapDown} onClick={() => setFormRapDown(!formRapDown)} icon={<TrendingDown size={12} />} label={t.rapDown} />
                </div>
                <div className="pa-config-label">{t.forDuration}</div>
                <div className="pa-duration-row">
                  {DURATIONS.map((d) => (
                    <button
                      key={d.value}
                      className={`pa-dur-btn ${formDuration === d.value ? 'active' : ''}`}
                      onClick={() => setFormDuration(d.value)}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
                <button className="pa-add-btn" onClick={addAlert} disabled={pendingAdd}>
                  {pendingAdd ? <span className="pa-spinner" /> : <Plus size={14} />}
                  {t.confirmAdd}
                </button>
              </div>
            )}
          </div>

          <div className="pa-list">
            {alerts.length === 0 && <div className="pa-empty">{t.empty}</div>}
            {alerts.map((a) => {
              const durLabel = formatDuration(a.duration, a.createdAt);
              return (
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
                  {durLabel && (
                    <div className="pa-duration">
                      <Clock size={11} /> {durLabel}
                    </div>
                  )}
                </div>
              );
            })}
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
