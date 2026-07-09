'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Crown, Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useLang } from '@/lib/LanguageProvider';
import { appLocales } from '@/lib/appLocales';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const { lang } = useLang();
  const t = appLocales[lang].reset;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError(t.invalidToken);
      return;
    }

    if (password.length < 6) {
      setError(t.minPassword);
      return;
    }

    if (password !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t.updateError);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/');
        }, 3000);
      }
    } catch (err) {
      setError(t.connectionFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      color: 'var(--text)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        background: 'var(--bg-2)',
        border: '1px solid var(--line)',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '440px',
        padding: '40px 32px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        position: 'relative'
      }}>
        {/* Decorative upper glow */}
        <div style={{
          position: 'absolute',
          top: '-150px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '300px',
          height: '200px',
          background: 'radial-gradient(circle, var(--gold-glow) 0%, transparent 70%)',
          opacity: 0.25,
          pointerEvents: 'none'
        }} />

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '1px solid var(--gold)',
            borderRadius: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--gold)',
            marginBottom: '16px'
          }}>
            <Crown style={{ width: '24px', height: '24px' }} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'Poppins, sans-serif' }}>
            {t.reset}
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '8px' }}>
            {t.enterNewPassword}
          </p>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ color: 'var(--green)', marginBottom: '16px' }}>
              <CheckCircle2 style={{ width: '56px', height: '56px', margin: '0 auto' }} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: 'var(--green)' }}>
              {t.updateSuccess}
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
              {t.redirecting}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                color: 'var(--red)',
                background: 'rgba(239, 68, 68, 0.1)',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '20px',
                textAlign: 'center',
                border: '1px solid rgba(239, 68, 68, 0.2)'
              }}>
                {error}
              </div>
            )}

            <div className="auth-input-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--muted)', marginBottom: '8px' }}>
                {t.newPassword}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  background: 'var(--bg)',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  color: 'var(--text)',
                  outline: 'none',
                  fontSize: '14px'
                }}
              />
            </div>

            <div className="auth-input-group" style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--muted)', marginBottom: '8px' }}>
                {t.confirmPassword}
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  background: 'var(--bg)',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  color: 'var(--text)',
                  outline: 'none',
                  fontSize: '14px'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: 'var(--gold)',
                color: '#1A1600',
                padding: '14px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 0 15px var(--gold-glow)'}
              onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
            >
              <Lock style={{ width: '16px', height: '16px' }} />
              {loading ? appLocales[lang].common.loading : t.updatePassword}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', borderTop: '1px solid var(--line)', paddingTop: '20px', marginTop: '8px' }}>
          <button
            onClick={() => router.push('/')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'color 0.15s'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = 'var(--text)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'var(--muted)'}
          >
            <ArrowLeft style={{ width: '14px', height: '14px' }} />
            {t.backHome}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text)',
        fontFamily: 'Inter, sans-serif'
      }}>
        Loading...
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
