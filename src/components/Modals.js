'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { locales } from '@/lib/locales';
import { formatNumber } from '@/lib/format';

export function DetailModal({ item, onClose, onBuy }) {
  if (!item) return null;

  return (
    <div className="modal-overlay show" onClick={(e) => e.target.classList.contains('modal-overlay') && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>
          <X className="icon" />
        </button>
        <div className="modal-img">
          <img src={item.img} alt={item.name} />
        </div>
        <div className="modal-body">
          <span className="rarity-pill">{item.rarity[0].toUpperCase() + item.rarity.slice(1)}</span>
          <h2>{item.name}</h2>
          <div className="modal-stat-row">
            <div>
              <span>RAP</span>
              <b>{item.rapLabel}</b>
            </div>
            <div>
              <span>Price</span>
              <b style={{ color: 'var(--gold)' }}>${formatNumber(item.price)}</b>
            </div>
          </div>
          <button
            className="modal-buy"
            onClick={() => {
              onBuy(item);
              onClose();
            }}
          >
            Buy now
          </button>
        </div>
      </div>
    </div>
  );
}

export function AuthModal({ type, onClose, onSubmit, lang = 'en' }) {
  const [currentType, setCurrentType] = useState(type); // 'login' | 'register' | 'forgot'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const t = locales[lang].auth;

  const handleGoogleLogin = async (response) => {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Google sign-in failed');
      } else {
        onSubmit(data.user);
        onClose();
      }
    } catch (err) {
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        const gcContainer = document.getElementById('recaptcha-container');
        if (gcContainer && window.grecaptcha) {
          try { window.grecaptcha.render(gcContainer, { sitekey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY }); } catch {}
        }

        if (window.google) {
          const btnContainer = document.getElementById('google-signin-btn');
          if (btnContainer) {
            window.google.accounts.id.initialize({
              client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '855427189196-dummyclientid.apps.googleusercontent.com',
              callback: handleGoogleLogin,
            });
            window.google.accounts.id.renderButton(btnContainer, {
              theme: 'outline',
              size: 'large',
              width: btnContainer.offsetWidth || 352,
            });
          }
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [currentType]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    let recaptchaToken = '';
    try { recaptchaToken = window.grecaptcha?.getResponse?.() ?? ''; } catch {}
    if (!recaptchaToken) {
      setError('Please complete the reCAPTCHA verification');
      setLoading(false);
      return;
    }

    try {
      if (currentType === 'forgot') {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, recaptchaToken }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || t.resetError);
        } else {
          setMessage(t.resetSuccess);
        }
        return;
      }

      const endpoint = currentType === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = currentType === 'login' 
        ? { username, password, recaptchaToken } 
        : { username, email, password, recaptchaToken };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
      } else {
        onSubmit(data.user);
        onClose();
      }
    } catch (err) {
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay show" onClick={(e) => e.target.classList.contains('modal-overlay') && onClose()}>
      <div className="modal" style={{ gridTemplateColumns: '1fr', maxWidth: '400px' }}>
        <button className="modal-close" onClick={onClose}>
          <X className="icon" />
        </button>
        <div className="modal-body" style={{ display: 'block' }}>
          <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>
            {currentType === 'login' ? t.welcome : currentType === 'register' ? t.create : t.forgot}
          </h2>

          {error && (
            <div style={{ color: 'var(--red)', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
              {error}
            </div>
          )}

          {message && (
            <div style={{ color: 'var(--green)', background: 'rgba(74, 222, 128, 0.1)', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
              {message}
            </div>
          )}

          <form onSubmit={handleFormSubmit}>
            {currentType !== 'forgot' && (
              <div className="auth-input-group">
                <label>{t.username}</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. jrblocks"
                />
              </div>
            )}

            {(currentType === 'register' || currentType === 'forgot') && (
              <div className="auth-input-group">
                <label>{t.email}</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. user@domain.com"
                />
              </div>
            )}

            {currentType !== 'forgot' && (
              <div className="auth-input-group" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label>{t.password}</label>
                  {currentType === 'login' && (
                    <span
                      style={{ fontSize: '12px', cursor: 'pointer', color: 'var(--gold)', userSelect: 'none' }}
                      onClick={() => {
                        setCurrentType('forgot');
                        setError('');
                        setMessage('');
                        if (typeof window !== 'undefined' && window.grecaptcha) {
                          window.grecaptcha.reset();
                        }
                      }}
                    >
                      {t.toggleForgot}
                    </span>
                  )}
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            )}

            <div id="recaptcha-container" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center', minHeight: '78px' }}></div>
            <button type="submit" className="modal-buy" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Processing...' : currentType === 'login' ? t.submitLogin : currentType === 'register' ? t.submitRegister : t.submitForgot}
            </button>
          </form>

          {currentType !== 'forgot' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', color: 'var(--muted)', fontSize: '12px' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--line)' }}></div>
                <span style={{ padding: '0 10px', textTransform: 'uppercase' }}>{t.or}</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--line)' }}></div>
              </div>

              <div id="google-signin-btn" style={{ width: '100%', display: 'flex', justifyContent: 'center', minHeight: '40px' }}></div>
            </>
          )}

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <span
              className="auth-toggle-link"
              style={{ cursor: 'pointer', fontSize: '13px', color: 'var(--muted)' }}
                  onClick={() => {
                    setCurrentType(currentType === 'login' ? 'register' : 'login');
                    setError('');
                    setMessage('');
                    if (typeof window !== 'undefined' && window.grecaptcha) {
                      window.grecaptcha.reset();
                    }
                  }}
            >
              {currentType === 'login' ? t.toggleRegister : t.toggleLogin}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

