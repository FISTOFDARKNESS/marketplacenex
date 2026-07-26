const store = new Map();

export function rateLimit(key, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now - entry.start > windowMs) {
    store.set(key, { start: now, count: 1 });
    return { success: true, remaining: maxRequests - 1 };
  }
  if (entry.count >= maxRequests) {
    return { success: false, remaining: 0 };
  }
  entry.count++;
  return { success: true, remaining: maxRequests - entry.count };
}

export function getIP(req) {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || '127.0.0.1';
}
