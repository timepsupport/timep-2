// server/middlewares/rateLimiter.ts
// Manual rate limiting — no external dependency
// Uses in-memory Map to track requests per IP

import { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const createLimiter = (maxRequests: number, windowMs: number) => {
  const store = new Map<string, RateLimitEntry>();

  // Clean up expired entries every 5 minutes
  setInterval(() => {
    const now = Date.now();
    store.forEach((entry, key) => {
      if (now > entry.resetAt) store.delete(key);
    });
  }, 5 * 60 * 1000);

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0] ?? req.ip ?? "unknown";
    const now = Date.now();
    const entry = store.get(ip);

    if (!entry || now > entry.resetAt) {
      store.set(ip, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (entry.count >= maxRequests) {
      res.status(429).json({
        error: "Too many requests",
        message: "Vous avez dépassé la limite de requêtes. Réessayez dans quelques minutes.",
      });
      return;
    }

    entry.count++;
    next();
  };
};

// 100 req / 15min / IP — global
export const globalLimiter = createLimiter(100, 15 * 60 * 1000);

// 20 req / min / IP — generate
export const generateLimiter = createLimiter(20, 60 * 1000);

// 5 req / hour / IP — contact
export const contactLimiter = createLimiter(5, 60 * 60 * 1000);

// 10 req / 15min / IP — auth
export const authLimiter = createLimiter(10, 15 * 60 * 1000);