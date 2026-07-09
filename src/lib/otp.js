import { prisma } from './db';
import bcrypt from 'bcryptjs';

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const OTP_LENGTH = 8;

export function generateOtp() {
  let code = '';
  for (let i = 0; i < OTP_LENGTH; i++) code += Math.floor(Math.random() * 10);
  return code;
}

export async function createOtpChallenge({ userId, type, channel, target }) {
  const code = generateOtp();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  await prisma.otpChallenge.updateMany({
    where: { userId, type, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  await prisma.otpChallenge.create({
    data: { userId, type, channel, target, codeHash, expiresAt },
  });
  return code;
}

export async function verifyOtpChallenge({ userId, type, code }) {
  const challenge = await prisma.otpChallenge.findFirst({
    where: { userId, type, consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  if (!challenge) return { ok: false, error: 'Nenhum código ativo. Solicite um novo.' };
  if (new Date(challenge.expiresAt) < new Date()) {
    return { ok: false, error: 'Código expirado. Solicite um novo.' };
  }
  const match = await bcrypt.compare(code, challenge.codeHash);
  if (!match) return { ok: false, error: 'Código inválido.' };
  await prisma.otpChallenge.update({ where: { id: challenge.id }, data: { consumedAt: new Date() } });
  return { ok: true };
}
