export function getBaseUrl(req) {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  const origin = req?.headers?.get?.('origin');
  if (origin) return origin;
  const host = req?.headers?.get?.('host');
  if (host) {
    const proto = req?.headers?.get?.('x-forwarded-proto') || 'https';
    return `${proto}://${host}`;
  }
  return 'http://localhost:3000';
}
