'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, ShieldOff, ShieldAlert, Crown, X } from 'lucide-react';

function EndSessionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('processing'); // processing | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No token provided.');
      return;
    }

    fetch('/api/auth/end-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setStatus('success');
          setMessage(d.message || 'Session ended successfully.');
        } else {
          setStatus('error');
          setMessage(d.error || 'Failed to end session.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Connection failed. Please try again.');
      });
  }, [token]);

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
        maxWidth: '420px',
        padding: '40px 32px',
        textAlign: 'center',
        position: 'relative'
      }}>
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
          <Crown size={24} />
        </div>

        {status === 'processing' && (
          <>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 8px' }}>Processing...</h2>
            <div className="loading-spinner" style={{ margin: '20px auto' }} />
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ color: '#22c55e', marginBottom: '12px' }}>
              <ShieldOff size={48} style={{ margin: '0 auto' }} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#22c55e', margin: '0 0 8px' }}>Session ended</h2>
            <p style={{ color: '#9ca3af', fontSize: '14px', margin: '0 0 20px' }}>The device has been signed out of your account.</p>
            <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 24px' }}>
              If there are other sessions you don&apos;t recognize, go to Settings → Security to review all active devices.
            </p>
            <button
              onClick={() => router.push('/')}
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
                fontFamily: 'inherit'
              }}
            >
              Go to Home
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ color: '#ef4444', marginBottom: '12px' }}>
              <ShieldAlert size={48} style={{ margin: '0 auto' }} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#ef4444', margin: '0 0 8px' }}>Something went wrong</h2>
            <p style={{ color: '#9ca3af', fontSize: '14px', margin: '0 0 4px' }}>{message}</p>
            <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 24px' }}>
              The link may have expired or already been used.
            </p>
            <button
              onClick={() => router.push('/')}
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
                fontFamily: 'inherit'
              }}
            >
              Go to Home
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function EndSessionPage() {
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
      <EndSessionContent />
    </Suspense>
  );
}
