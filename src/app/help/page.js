'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HelpCircle, Send, Clock, Check, AlertTriangle } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { useLang } from '@/lib/LanguageProvider';
import { appLocales } from '@/lib/appLocales';

const COOLDOWN_KEY = 'nexblox_help_cooldown';
const COOLDOWN_MS = 60000;

export default function HelpPage() {
  const router = useRouter();
  const { lang } = useLang();
  const t = appLocales[lang].help;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null); // 'sent' | 'error'
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.authenticated) { router.push('/'); return; }
      if (d.user) { setName(d.user.username); setEmail(d.user.email || ''); }
    });

    const last = parseInt(localStorage.getItem(COOLDOWN_KEY) || '0');
    const remaining = COOLDOWN_MS - (Date.now() - last);
    if (remaining > 0) setCooldown(Math.ceil(remaining / 1000));
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (cooldown > 0) return;
    setSending(true); setStatus(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      if (!res.ok) { setStatus('error'); return; }
      setStatus('sent');
      localStorage.setItem(COOLDOWN_KEY, Date.now().toString());
      setCooldown(60);
      setMessage('');
    } catch {
      setStatus('error');
    } finally {
      setSending(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  return (
    <div className="app-layout">
      <Sidebar onLogout={handleLogout} />
      <main className="main-content">
        <div className="page-top">
          <div>
            <h1 className="page-title">{t.title}</h1>
            <p className="page-desc">{t.desc}</p>
          </div>
        </div>

        <div className="help-card">
          <div className="help-card-header">
            <HelpCircle size={18} style={{ color: '#f59e0b' }} />
            <span>{t.contactSupport}</span>
          </div>

          {status === 'sent' && (
            <div className="help-success">
              <Check size={16} /> {t.success}
            </div>
          )}
          {status === 'error' && (
            <div className="help-error">
              <AlertTriangle size={16} /> {t.error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="help-form">
            <div className="help-field">
              <label>{t.yourName}</label>
              <div className="help-static">{name || '...'}</div>
            </div>
            <div className="help-field">
              <label>{t.yourEmail}</label>
              <div className="help-static">{email || 'Not provided'}</div>
            </div>
            <div className="help-field">
              <label>{t.message}</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} required placeholder="Describe your issue or question..." rows={5} />
            </div>
            <button type="submit" className="help-submit" disabled={sending || cooldown > 0}>
              {sending ? (
                t.sending
              ) : cooldown > 0 ? (
                <><Clock size={14} /> {t.wait.replace('{n}', cooldown)}</>
              ) : (
                <><Send size={14} /> {t.sendMessage}</>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
