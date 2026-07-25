export function getBaseUrl(req) {
  // Use request headers first so it works correctly in both dev (localhost) and production
  const host = req?.headers?.get?.('host');
  if (host) {
    const proto = req?.headers?.get?.('x-forwarded-proto') || 'https';
    return `${proto}://${host}`;
  }
  const origin = req?.headers?.get?.('origin');
  if (origin) return origin;
  // Fallback for environments where headers may not be available
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  return 'http://localhost:3000';
}
