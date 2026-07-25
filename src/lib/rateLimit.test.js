import { describe, it, expect } from 'vitest';
import { rateLimit, getIP } from './rateLimit';

describe('getIP', () => {
  it('reads the first x-forwarded-for entry', () => {
    const req = { headers: { get: (h) => (h === 'x-forwarded-for' ? '1.2.3.4, 5.6.7.8' : null) } };
    expect(getIP(req)).toBe('1.2.3.4');
  });

  it('falls back to localhost when no header', () => {
    const req = { headers: { get: () => null } };
    expect(getIP(req)).toBe('127.0.0.1');
  });
});

describe('rateLimit', () => {
  it('allows up to the limit then blocks', () => {
    const key = 'test-ip-' + Math.random();
    const limit = 3;
    expect(rateLimit(key, limit, 60000).success).toBe(true);
    expect(rateLimit(key, limit, 60000).success).toBe(true);
    expect(rateLimit(key, limit, 60000).success).toBe(true);
    const blocked = rateLimit(key, limit, 60000);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it('uses independent counters per key', () => {
    const keyA = 'perkey-a-' + Math.random();
    const keyB = 'perkey-b-' + Math.random();
    expect(rateLimit(keyA, 1, 60000).success).toBe(true);
    expect(rateLimit(keyA, 1, 60000).success).toBe(false);
    expect(rateLimit(keyB, 1, 60000).success).toBe(true);
  });

  it('returns remaining count that decreases', () => {
    const key = 'rem-' + Math.random();
    const first = rateLimit(key, 5, 60000);
    expect(first.remaining).toBe(4);
  });
});
