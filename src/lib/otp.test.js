import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma before importing otp
vi.mock('./db', () => ({
  prisma: {
    otpChallenge: {
      updateMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from './db';
import { generateOtp, createOtpChallenge, verifyOtpChallenge } from './otp';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('generateOtp', () => {
  it('returns an 8-digit numeric string', () => {
    const code = generateOtp();
    expect(code).toMatch(/^\d{8}$/);
  });

  it('produces different codes on repeated calls', () => {
    const a = generateOtp();
    const b = generateOtp();
    expect(a).not.toBe(b);
  });
});

describe('createOtpChallenge', () => {
  it('invalidates previous challenges and creates a new hashed one', async () => {
    const code = await createOtpChallenge({
      userId: 'u1',
      type: 'gmail-verify',
      channel: 'email',
      target: 'a@gmail.com',
    });

    expect(prisma.otpChallenge.updateMany).toHaveBeenCalledWith({
      where: { userId: 'u1', type: 'gmail-verify', consumedAt: null },
      data: { consumedAt: expect.any(Date) },
    });
    expect(prisma.otpChallenge.create).toHaveBeenCalledWith({
      data: {
        userId: 'u1',
        type: 'gmail-verify',
        channel: 'email',
        target: 'a@gmail.com',
        codeHash: expect.any(String),
        expiresAt: expect.any(Date),
      },
    });
    // returned code must be the plaintext (8 digits) that gets emailed
    expect(code).toMatch(/^\d{8}$/);
  });
});

describe('verifyOtpChallenge', () => {
  it('returns ok:false when no active challenge exists', async () => {
    prisma.otpChallenge.findFirst.mockResolvedValue(null);
    const res = await verifyOtpChallenge({ userId: 'u1', type: 'gmail-verify', code: '12345678' });
    expect(res.ok).toBe(false);
  });

  it('returns ok:false when the challenge is expired', async () => {
    prisma.otpChallenge.findFirst.mockResolvedValue({
      id: 'c1',
      codeHash: 'hash',
      expiresAt: new Date(Date.now() - 1000),
    });
    const res = await verifyOtpChallenge({ userId: 'u1', type: 'gmail-verify', code: '12345678' });
    expect(res.ok).toBe(false);
  });

  it('returns ok:false on wrong code and does not consume', async () => {
    prisma.otpChallenge.findFirst.mockResolvedValue({
      id: 'c1',
      codeHash: 'hash',
      expiresAt: new Date(Date.now() + 60000),
    });
    const res = await verifyOtpChallenge({ userId: 'u1', type: 'gmail-verify', code: '00000000' });
    expect(res.ok).toBe(false);
    expect(prisma.otpChallenge.update).not.toHaveBeenCalled();
  });

  it('returns ok:true and consumes the challenge on correct code', async () => {
    prisma.otpChallenge.findFirst.mockResolvedValue({
      id: 'c1',
      codeHash: await require('bcryptjs').hash('12345678', 10),
      expiresAt: new Date(Date.now() + 60000),
    });
    const res = await verifyOtpChallenge({ userId: 'u1', type: 'gmail-verify', code: '12345678' });
    expect(res.ok).toBe(true);
    expect(prisma.otpChallenge.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { consumedAt: expect.any(Date) },
    });
  });
});
