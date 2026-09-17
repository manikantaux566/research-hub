const buckets = new Map();

function ipOf(req) {
  return req.ip || req.socket?.remoteAddress || "unknown";
}

/**
 * Minimal fixed-window in-memory rate limiter. Not a production-grade
 * distributed limiter; sufficient for a single-node self-hosted instance.
 * Buckets are pruned on access so memory stays bounded.
 */
export function rateLimit({ windowMs, max, keyPrefix = "auth", message }) {
  return function rateLimitMiddleware(req, res, next) {
    const now = Date.now();
    const key = `${keyPrefix}:${ipOf(req)}`;
    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (bucket.count >= max) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfter));
      return error(res, 429, "rate-limited", message || "Too many attempts. Please try again later.");
    }
    bucket.count += 1;
    return next();
  };
}

export function error(res, status, code, message) {
  if (!res.headersSent) {
    res.status(status).json({ error: { code, message } });
  }
}