const tracker = new Map();

// Cleanup memory tracker every 10 minutes to prevent memory leaks
if (typeof global !== 'undefined') {
  if (!global.rateLimitInterval) {
    global.rateLimitInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, value] of tracker.entries()) {
        if (now > value.resetTime) {
          tracker.delete(key);
        }
      }
    }, 600000); // 10 minutes
  }
}

export function getIP(req) {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return '127.0.0.1';
}

export function rateLimit(ip, limit = 10, windowMs = 60000) {
  const now = Date.now();
  
  if (!tracker.has(ip)) {
    tracker.set(ip, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: limit - 1, reset: windowMs };
  }

  const data = tracker.get(ip);

  if (now > data.resetTime) {
    data.count = 1;
    data.resetTime = now + windowMs;
    return { success: true, remaining: limit - 1, reset: windowMs };
  }

  data.count++;
  const remaining = Math.max(0, limit - data.count);
  const reset = Math.max(0, data.resetTime - now);

  if (data.count > limit) {
    return { success: false, remaining, reset };
  }

  return { success: true, remaining, reset };
}
