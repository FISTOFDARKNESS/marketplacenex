import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from './db';
import { sendLoginAlertEmail } from './email';
import { getBaseUrl } from './url';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-default-key';

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function parseUserAgent(ua = '') {
  let browser = 'Unknown';
  let os = 'Unknown';
  if (/Edg\//.test(ua)) browser = 'Edge';
  else if (/OPR\/|Opera/.test(ua)) browser = 'Opera';
  else if (/Chrome\//.test(ua)) browser = 'Chrome';
  else if (/Firefox\//.test(ua)) browser = 'Firefox';
  else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) browser = 'Safari';

  if (/Windows NT 10/.test(ua)) os = 'Windows';
  else if (/Windows/.test(ua)) os = 'Windows';
  else if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/Mac OS X|Macintosh/.test(ua)) os = 'macOS';
  else if (/Linux/.test(ua)) os = 'Linux';

  return { browser, os };
}

export async function createSession(userId, req) {
  const ua = req?.headers?.get?.('user-agent') || '';
  const ip = req?.headers?.get?.('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
  const { browser, os } = parseUserAgent(ua);
  const device = `${browser} on ${os}`;
  const session = await prisma.session.create({
    data: { userId, jti: crypto.randomUUID(), device, browser, os, ip },
  });
  return session.jti;
}

export async function sendNewLoginAlert(userId, sessionJti, req) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { gmail: true, gmailVerified: true },
    });
    if (!user?.gmailVerified || !user?.gmail) return;

    const ua = req?.headers?.get?.('user-agent') || '';
    const ip = req?.headers?.get?.('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const { browser, os } = parseUserAgent(ua);
    const device = `${browser} on ${os}`;
    const token = generateEndSessionToken(sessionJti, userId);

    const baseUrl = getBaseUrl(req);
    await sendLoginAlertEmail(user.gmail, token, { browser, os, device, ip }, baseUrl);
  } catch (e) {
    console.error('Failed to send login alert:', e);
  }
}

export async function destroySession(jti) {
  if (!jti) return;
  try {
    await prisma.session.deleteMany({ where: { jti } });
  } catch (e) {
    // ignore
  }
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function generateEndSessionToken(sessionId, userId) {
  return jwt.sign(
    { sessionId, userId, purpose: 'end-session' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}
