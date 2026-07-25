'use client';

import { Crown } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      color: 'var(--text)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '24px',
      fontFamily: 'Inter, sans-serif',
      gap: '16px',
    }}>
      <div style={{
        width: '56px',
        height: '56px',
        border: '1px solid var(--gold)',
        borderRadius: '14px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--gold)',
      }}>
        <Crown size={28} />
      </div>
      <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>You&apos;re offline</h1>
      <p style={{ color: 'var(--muted)', fontSize: '14px', maxWidth: '320px', margin: 0 }}>
        Check your internet connection and try again. Your data is safe.
      </p>
    </div>
  );
}
