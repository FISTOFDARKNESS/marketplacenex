import { describe, it, expect } from 'vitest';
import { getBaseUrl } from './url';

describe('getBaseUrl', () => {
  it('uses the host header with https when x-forwarded-proto present', () => {
    const req = {
      headers: {
        get: (h) => {
          if (h === 'host') return 'marketplacenexblox.vercel.app';
          if (h === 'x-forwarded-proto') return 'https';
          return null;
        },
      },
    };
    expect(getBaseUrl(req)).toBe('https://marketplacenexblox.vercel.app');
  });

  it('defaults to https when no x-forwarded-proto', () => {
    const req = {
      headers: {
        get: (h) => (h === 'host' ? 'localhost:3000' : null),
      },
    };
    expect(getBaseUrl(req)).toBe('https://localhost:3000');
  });

  it('prefers host over origin', () => {
    const req = {
      headers: {
        get: (h) => {
          if (h === 'host') return 'example.com';
          if (h === 'origin') return 'http://other.com';
          return null;
        },
      },
    };
    expect(getBaseUrl(req)).toBe('https://example.com');
  });

  it('falls back to NEXT_PUBLIC_APP_URL when no headers', () => {
    const prev = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = 'https://fallback.example.com';
    expect(getBaseUrl({ headers: { get: () => null } })).toBe('https://fallback.example.com');
    process.env.NEXT_PUBLIC_APP_URL = prev;
  });
});
