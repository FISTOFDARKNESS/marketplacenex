import { prisma } from './db';
import { getIP } from './rateLimit';

/**
 * Fire-and-forget audit logging. Never throws — failures are logged server-side
 * but do not break the calling request.
 */
export async function logAudit({ action, userId, target, req, meta } = {}) {
  try {
    const ip = req ? getIP(req) : undefined;
    await prisma.auditLog.create({
      data: {
        action,
        userId: userId || null,
        target: target || null,
        ip: ip || null,
        meta: meta ? (typeof meta === 'string' ? { note: meta } : meta) : undefined,
      },
    });
  } catch (e) {
    console.error('Audit log failed:', e?.message || e);
  }
}
