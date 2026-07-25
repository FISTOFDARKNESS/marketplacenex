import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword, signToken, verifyToken } from './auth';

describe('Auth Helpers', () => {
  it('should hash a password and compare it correctly', async () => {
    const password = 'my-secret-password-123';
    const hash = await hashPassword(password);
    
    expect(hash).not.toBe(password);
    
    const isMatch = await comparePassword(password, hash);
    expect(isMatch).toBe(true);

    const isMatchWrong = await comparePassword('wrong-password', hash);
    expect(isMatchWrong).toBe(false);
  });

  it('should sign and verify tokens correctly', () => {
    const payload = { id: 'user-123', username: 'tester', role: 'admin' };
    const token = signToken(payload);
    
    expect(token).toBeTypeOf('string');

    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded.id).toBe(payload.id);
    expect(decoded.username).toBe(payload.username);
    expect(decoded.role).toBe(payload.role);
  });

  it('should return null for invalid tokens', () => {
    const decoded = verifyToken('invalid.token.value');
    expect(decoded).toBeNull();
  });
});
