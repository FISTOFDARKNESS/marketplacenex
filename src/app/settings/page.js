'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Shield, Check, Copy, ExternalLink, AlertTriangle, Eye, EyeOff, Trash2, RefreshCw, Smartphone, Monitor, ShieldCheck, Send, LogOut, X } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { useLang } from '@/lib/LanguageProvider';
import { appLocales } from '@/lib/appLocales';

export default function SettingsPage() {
  const router = useRouter();
  const { lang } = useLang();
  const t = appLocales[lang].settings;
  const [user, setUser] = useState(null);
  const [method, setMethod] = useState('bio');
  const [step, setStep] = useState('start');
  const [robloxUser, setRobloxUser] = useState('');
  const [phrase, setPhrase] = useState('');
  const [cookie, setCookie] = useState('');
  const [showCookie, setShowCookie] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [cookieStatus, setCookieStatus] = useState(null);

  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [gmailInput, setGmailInput] = useState('');
  const [gmailSent, setGmailSent] = useState(false);
  const [gmailCode, setGmailCode] = useState('');
  const [gmailBusy, setGmailBusy] = useState(false);
  const [gmailMsg, setGmailMsg] = useState(null);
  const [otpSession, setOtpSession] = useState(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpMsg, setOtpMsg] = useState(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.authenticated) { router.push('/'); return; }
      setUser(d.user);
      // Check saved cookie validity
      fetch('/api/roblox/check-cookie').then(r => r.json()).then(s => {
        setCookieStatus(s);
        if (s.hasCookie && !s.valid) {
          setError('Your saved Roblox cookie has expired. Please enter a new one.');
          setMethod('cookie');
        }
      }).catch(() => {});
    });
  }, []);

  async function handleBioStart(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/roblox/verify-start', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ robloxUsername: robloxUser.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setPhrase(data.phrase); setStep('phrase');
    } catch { setError('Connection failed'); }
    finally { setLoading(false); }
  }

  async function handleBioCheck() {
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/roblox/verify-check', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      if (!data.success) { setError(data.message); return; }
      setStep('done');
      setUser(prev => ({ ...prev, robloxUsername: data.robloxUsername }));
    } catch { setError('Connection failed'); }
    finally { setLoading(false); }
  }

  async function handleCookieVerify(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/roblox/verify-cookie', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookie: cookie.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setStep('done');
      setUser(prev => ({ ...prev, robloxUsername: data.robloxUsername }));
      setCookieStatus({ valid: true, hasCookie: true, robloxUsername: data.robloxUsername });
    } catch { setError('Connection failed'); }
    finally { setLoading(false); }
  }

  async function handleUnlink() {
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/roblox/unlink', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setUser(prev => ({ ...prev, robloxId: null, robloxUsername: null }));
      setCookieStatus(null);
      setStep('start');
      setMethod('bio');
    } catch { setError('Connection failed'); }
    finally { setLoading(false); }
  }

  function handleCopy() {
    navigator.clipboard.writeText(phrase);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  function switchMethod(m) {
    setMethod(m);
    setStep('start');
    setError('');
    setPhrase('');
    setRobloxUser('');
    setCookie('');
  }

  const isLinked = user?.robloxUsername;

  useEffect(() => {
    if (!user) return;
    setSessionsLoading(true);
    fetch('/api/security/sessions')
      .then(r => r.json())
      .then(d => { if (d.success) setSessions(d.sessions); })
      .catch(() => {})
      .finally(() => setSessionsLoading(false));
    const beat = setInterval(() => {
      fetch('/api/security/heartbeat', { method: 'POST' }).catch(() => {});
    }, 30000);
    return () => clearInterval(beat);
  }, [user]);

  function setGmailError(msg, ok = false) { setGmailMsg({ text: msg, ok }); }

  async function handleGmailSend() {
    setGmailMsg(null); setGmailBusy(true);
    try {
      const res = await fetch('/api/security/gmail/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gmail: gmailInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setGmailError(data.error); return; }
      setGmailSent(true); setGmailError('Code sent to your Gmail.', true);
    } catch { setGmailError('Failed to send code'); }
    finally { setGmailBusy(false); }
  }

  async function handleGmailVerify() {
    setGmailMsg(null); setGmailBusy(true);
    try {
      const res = await fetch('/api/security/gmail/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: gmailCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setGmailError(data.error); return; }
      setUser(prev => ({ ...prev, gmail: data.gmail, gmailVerified: true }));
      setGmailSent(false); setGmailInput(''); setGmailCode('');
      setGmailError('Gmail verified successfully!', true);
    } catch { setGmailError('Failed to verify code'); }
    finally { setGmailBusy(false); }
  }

  function openOtp(sessionId) {
    setOtpSession(sessionId); setOtpCode(''); setOtpMsg(null);
  }

  async function handleSendOtp() {
    setOtpMsg(null); setOtpBusy(true);
    try {
      const res = await fetch('/api/security/session/send-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: otpSession }),
      });
      const data = await res.json();
      if (!res.ok) {       setOtpMsg({ text: data.error, ok: false }); return; }
      setOtpMsg({ text: t.codeSentEmail, ok: true });
    } catch { setOtpMsg({ text: t.failedSendCode, ok: false }); }
    finally { setOtpBusy(false); }
  }

  async function handleRevoke() {
    setOtpMsg(null); setOtpBusy(true);
    try {
      const res = await fetch('/api/security/session/revoke', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: otpSession, code: otpCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setOtpMsg({ text: data.error, ok: false }); return; }
      setSessions(prev => prev.filter(s => s.id !== otpSession));
      setOtpSession(null); setOtpCode('');
    } catch { setOtpMsg({ text: t.failedEndSession, ok: false }); }
    finally { setOtpBusy(false); }
  }

  return (
    <div className="app-layout">
      <Sidebar onLogout={handleLogout} />
      <main className="main-content">
        <div className="page-top">
          <div>
            <h1 className="page-title">{t.pageTitle}</h1>
            <p className="page-desc">{t.pageDesc}</p>
          </div>
        </div>

        <div className="settings-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <User size={18} style={{ color: '#9ca3af' }} />
            <h3 style={{ margin: 0, fontSize: '15px' }}>{t.account}</h3>
          </div>
          <div style={{ background: '#1a1a1e', borderRadius: '10px', padding: '16px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{t.username}</div>
            <div style={{ fontSize: '14px', color: '#e5e7eb', fontWeight: 600 }}>{user?.username || '...'}</div>
          </div>
        </div>

        <div className="settings-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Shield size={18} style={{ color: '#f59e0b' }} />
            <h3 style={{ margin: 0, fontSize: '15px' }}>{t.robloxVerification}</h3>
          </div>

          {cookieStatus?.hasCookie && !cookieStatus?.valid && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontSize: '13px', padding: '10px 14px', background: 'rgba(245,158,11,0.1)', borderRadius: '8px', marginBottom: '12px', border: '1px solid rgba(245,158,11,0.2)' }}>
              <RefreshCw size={14} /> {t.cookieExpired}
            </div>
          )}

          {isLinked && (step === 'start' || step === 'done') && cookieStatus?.valid !== false ? (
            <div style={{ background: '#1a1a1e', borderRadius: '10px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#22c55e', marginBottom: '12px', padding: '8px 12px', background: 'rgba(34,197,94,0.08)', borderRadius: '8px' }}>
                <Check size={14} /> {t.alreadyLinked} <b>{user.robloxUsername}</b>
              </div>
              <button onClick={handleUnlink} disabled={loading} className="purchase-btn purchase-btn-secondary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Trash2 size={14} /> {loading ? appLocales[lang].common.loading : t.unlink}
              </button>
            </div>
          ) : (
            <>
              <div style={{ background: '#1a1a1e', borderRadius: '10px', padding: '4px', marginBottom: '12px', display: 'flex' }}>
                <button onClick={() => switchMethod('bio')}
                  style={{
                    flex: 1, padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer',
                    background: method === 'bio' ? 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,180,0,0.08))' : 'transparent',
                    color: method === 'bio' ? '#FFD700' : '#9ca3af', fontWeight: method === 'bio' ? 600 : 400,
                    fontSize: '13px', fontFamily: 'inherit', transition: 'all 0.2s',
                  }}>
                  {t.bioVerification}
                </button>
                <button onClick={() => switchMethod('cookie')}
                  style={{
                    flex: 1, padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer',
                    background: method === 'cookie' ? 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,180,0,0.08))' : 'transparent',
                    color: method === 'cookie' ? '#FFD700' : '#9ca3af', fontWeight: method === 'cookie' ? 600 : 400,
                    fontSize: '13px', fontFamily: 'inherit', transition: 'all 0.2s',
                  }}>
                  {t.cookieVerification}
                </button>
              </div>

              <div style={{ background: '#1a1a1e', borderRadius: '10px', padding: '16px' }}>
                {error && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '13px', padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', marginBottom: '12px' }}>
                    <AlertTriangle size={14} /> {error}
                  </div>
                )}

                {step === 'start' && method === 'bio' && (
                  <div>
                    <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 12px' }}>
                      {t.bioDesc}
                    </p>
                    <form onSubmit={handleBioStart} style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text" placeholder={t.verify} value={robloxUser}
                        onChange={e => setRobloxUser(e.target.value)} required
                        style={{
                          flex: 1, padding: '12px 14px', background: '#0f0f13', border: '1px solid #2a2a2e',
                          borderRadius: '8px', color: '#e5e7eb', fontSize: '14px', outline: 'none', fontFamily: 'inherit',
                        }}
                      />
                      <button type="submit" className="purchase-btn" disabled={loading} style={{ padding: '12px 16px', whiteSpace: 'nowrap', fontSize: '13px' }}>
                          {loading ? '...' : t.verify}
                      </button>
                    </form>
                  </div>
                )}

                {step === 'start' && method === 'cookie' && (
                  <div>
                    <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 12px' }}>
                      {t.cookieDesc}
                    </p>
                    <form onSubmit={handleCookieVerify}>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                          <input
                            type={showCookie ? 'text' : 'password'} placeholder=".ROBLOSECURITY cookie" value={cookie}
                            onChange={e => setCookie(e.target.value)} required
                            style={{
                              width: '100%', padding: '12px 14px', paddingRight: '40px', background: '#0f0f13',
                              border: '1px solid #2a2a2e', borderRadius: '8px', color: '#e5e7eb', fontSize: '13px',
                              outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box',
                            }}
                          />
                          <button type="button" onClick={() => setShowCookie(!showCookie)}
                            style={{
                              position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                              background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '4px',
                            }}>
                            {showCookie ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        <button type="submit" className="purchase-btn" disabled={loading}
                          style={{ padding: '12px 14px', fontSize: '13px', whiteSpace: 'nowrap' }}>
                        {loading ? '...' : t.verify}
                        </button>
                      </div>
                    </form>
                    <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.5 }}>
                      <b style={{ color: '#f59e0b' }}>{t.howToGetCookie}</b>
                      <ol style={{ margin: '4px 0 0', paddingLeft: '16px' }}>
                        <li>Go to <a href="https://www.roblox.com" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa' }}>Roblox.com</a> and log in</li>
                        <li>Open DevTools (F12) → Application → Cookies → <b>.ROBLOSECURITY</b></li>
                        <li>Copy the value (starts with <b>_|</b>)</li>
                      </ol>
                    </div>
                  </div>
                )}

                {step === 'phrase' && (
                  <div>
                    <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 12px' }}>
                      {t.phraseDesc} <b>{robloxUser}</b>
                    </p>
                    <div style={{ background: '#0f0f13', border: '1px solid #2a2a2e', borderRadius: '10px', padding: '16px', fontSize: '18px', fontWeight: 700, color: '#fbbf24', textAlign: 'center', marginBottom: '12px', letterSpacing: '0.5px' }}>
                      {phrase}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <button onClick={handleCopy} className="verify-btn-secondary">
                        {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                      </button>
                      <a href="https://www.roblox.com/users/profile/edit" target="_blank" rel="noopener noreferrer" className="verify-btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#0f0f13', border: '1px solid #2a2a2e', borderRadius: '8px', color: '#d1d5db', textDecoration: 'none', fontSize: '13px' }}>
                        <ExternalLink size={14} /> {t.openRoblox}
                      </a>
                    </div>
                    <button className="purchase-btn" onClick={handleBioCheck} disabled={loading} style={{ width: '100%' }}>
                      {loading ? appLocales[lang].common.loading : t.iveSetBio}
                    </button>
                  </div>
                )}

                {step === 'done' && (
                  <div style={{ textAlign: 'center', padding: '12px 0' }}>
                    <Check size={32} style={{ color: '#22c55e', marginBottom: '8px' }} />
                    <p style={{ color: '#22c55e', fontSize: '14px', fontWeight: 600, margin: 0 }}>{t.verifiedTitle}</p>
                    <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>
                      <b>{user?.robloxUsername || 'Roblox account'}</b> {t.verifiedText}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="settings-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <ShieldCheck size={18} style={{ color: '#22c55e' }} />
            <h3 style={{ margin: 0, fontSize: '15px' }}>{t.security}</h3>
          </div>

          <div style={{ background: '#1a1a1e', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#d1d5db', marginBottom: '12px' }}>
              <Smartphone size={14} /> {t.gmail}
            </div>
            {user?.gmailVerified ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ fontSize: '14px', color: '#e5e7eb' }}>{user.gmail}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#22c55e', fontSize: '12px' }}>
                  <ShieldCheck size={13} /> {t.verified}
                </span>
              </div>
            ) : gmailSent ? (
              <div>
                {gmailMsg && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', padding: '8px 12px', borderRadius: '8px', marginBottom: '12px', color: gmailMsg.ok ? '#22c55e' : '#ef4444', background: gmailMsg.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }}>
                    {gmailMsg.ok ? <Check size={14} /> : <AlertTriangle size={14} />} {gmailMsg.text}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text" inputMode="numeric" placeholder={t.codePlaceholder} value={gmailCode}
                    onChange={e => setGmailCode(e.target.value)} required
                    style={{ flex: 1, padding: '12px 14px', background: '#0f0f13', border: '1px solid #2a2a2e', borderRadius: '8px', color: '#e5e7eb', fontSize: '14px', outline: 'none', fontFamily: 'inherit', letterSpacing: '2px' }}
                  />
                  <button type="button" className="purchase-btn" onClick={handleGmailVerify} disabled={gmailBusy} style={{ padding: '12px 16px', whiteSpace: 'nowrap', fontSize: '13px' }}>
                    {gmailBusy ? '...' : t.verifyCode}
                  </button>
                </div>
                  <button type="button" onClick={() => { setGmailSent(false); setGmailMsg(null); }} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '12px', cursor: 'pointer', marginTop: '8px', fontFamily: 'inherit' }}>
                    {appLocales[lang].common.cancel}
                  </button>
              </div>
            ) : (
              <div>
                {gmailMsg && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', padding: '8px 12px', borderRadius: '8px', marginBottom: '12px', color: gmailMsg.ok ? '#22c55e' : '#ef4444', background: gmailMsg.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }}>
                    {gmailMsg.ok ? <Check size={14} /> : <AlertTriangle size={14} />} {gmailMsg.text}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text" placeholder={t.gmailPlaceholder} value={gmailInput}
                    onChange={e => setGmailInput(e.target.value)} required
                    style={{ flex: 1, padding: '12px 14px', background: '#0f0f13', border: '1px solid #2a2a2e', borderRadius: '8px', color: '#e5e7eb', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}
                  />
                  <button type="button" className="purchase-btn" onClick={handleGmailSend} disabled={gmailBusy} style={{ padding: '12px 16px', whiteSpace: 'nowrap', fontSize: '13px' }}>
                    {gmailBusy ? '...' : t.sendCode}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div style={{ background: '#1a1a1e', borderRadius: '10px', padding: '16px' }}>
            <div style={{ fontSize: '13px', color: '#d1d5db', marginBottom: '12px' }}>{t.activeDevices}</div>
            {sessionsLoading ? (
              <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>{appLocales[lang].common.loading}</p>
            ) : sessions.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>{t.noSessions}</p>
            ) : (
              <div className="sec-devices">
                {sessions.map(s => (
                  <div key={s.id} className="sec-device">
                    <div className="sec-device-icon">
                      {s.os === 'iOS' || s.os === 'Android' ? <Smartphone size={16} /> : <Monitor size={16} />}
                    </div>
                    <div className="sec-device-body">
                      <div className="sec-device-name">
                        {s.device}{s.isCurrent && <span className="sec-badge-current">{t.thisDevice}</span>}
                      </div>
                      <div className="sec-device-meta">{s.ip} · {new Date(s.lastSeen).toLocaleString()}</div>
                    </div>
                    <div className="sec-device-right">
                      <span className={`sec-status ${s.online ? 'on' : 'off'}`}>{s.online ? t.online : t.offline}</span>
                      {!s.isCurrent && (
                        <button className="sec-revoke" onClick={() => openOtp(s.id)}>
                          <LogOut size={13} /> {t.logoutDevice}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {otpSession && (
        <div className="inv-modal-backdrop" onClick={() => setOtpSession(null)}>
          <div className="inv-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <button className="inv-modal-close" onClick={() => setOtpSession(null)}><X size={18} /></button>
            <h3 className="inv-modal-title">{t.confirmLogout}</h3>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 14px', textAlign: 'center' }}>
              {t.confirmLogoutText}
            </p>
            {otpMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', padding: '8px 12px', borderRadius: '8px', marginBottom: '12px', color: otpMsg.ok ? '#22c55e' : '#ef4444', background: otpMsg.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }}>
                {otpMsg.ok ? <Check size={14} /> : <AlertTriangle size={14} />} {otpMsg.text}
              </div>
            )}
            <input
              className="inv-range-input"
              style={{ width: '100%', textAlign: 'center', letterSpacing: '4px', fontSize: '18px', marginBottom: '12px' }}
              value={otpCode}
              onChange={e => setOtpCode(e.target.value)}
              placeholder="00000000"
              maxLength={8}
              inputMode="numeric"
            />
            <button className="purchase-btn" style={{ width: '100%', marginBottom: '8px' }} onClick={handleRevoke} disabled={otpBusy}>
              {otpBusy ? appLocales[lang].common.loading : t.endSession}
            </button>
            <button className="verify-btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleSendOtp} disabled={otpBusy}>
              <Send size={14} /> {t.resendCode}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
