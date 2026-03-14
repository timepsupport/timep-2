// server/middlewares/validate.ts
// Input validation & sanitization middleware — OWASP compliant
// Schema-based, type checks, length limits, rejects unexpected fields

import { Request, Response, NextFunction } from "express";

// ── Helper: strip unexpected fields from object ──
const pick = (obj: Record<string, any>, allowed: string[]) => {
  return allowed.reduce((acc, key) => {
    if (key in obj) acc[key] = obj[key];
    return acc;
  }, {} as Record<string, any>);
};

// ── Helper: sanitize string (trim + remove dangerous chars) ──
const sanitizeString = (value: string): string => {
  return value
    .trim()
    .replace(/<script.*?>.*?<\/script>/gi, "")  // remove script tags
    .replace(/javascript:/gi, "")               // remove js: URIs
    .replace(/on\w+\s*=/gi, "");                // remove event handlers
};

// ── 1. Validate /api/tip/generate ──
export const validateGenerate = (req: Request, res: Response, next: NextFunction) => {
  // Strip unexpected fields — only allow these
  req.body = pick(req.body, ["title", "type", "aspect", "interests", "language"]);

  const { title, type } = req.body;

  // Required fields
  if (!title || typeof title !== "string") {
    return res.status(400).json({ error: "Le champ 'title' est requis et doit être une chaîne." });
  }
  if (!type || typeof type !== "string") {
    return res.status(400).json({ error: "Le champ 'type' est requis et doit être une chaîne." });
  }

  // Length limits
  if (title.length > 200) {
    return res.status(400).json({ error: "Le titre ne peut pas dépasser 200 caractères." });
  }
  if (type.length > 100) {
    return res.status(400).json({ error: "Le type ne peut pas dépasser 100 caractères." });
  }

  // Optional fields type checks
  if (req.body.interests && typeof req.body.interests !== "string") {
    return res.status(400).json({ error: "'interests' doit être une chaîne." });
  }
  if (req.body.interests && req.body.interests.length > 300) {
    return res.status(400).json({ error: "'interests' ne peut pas dépasser 300 caractères." });
  }

  // Sanitize all string fields
  req.body.title = sanitizeString(title);
  req.body.type = sanitizeString(type);
  if (req.body.interests) req.body.interests = sanitizeString(req.body.interests);

  next();
};

// ── 2. Validate /api/contact ──
export const validateContact = (req: Request, res: Response, next: NextFunction) => {
  req.body = pick(req.body, ["name", "email", "message"]);

  const { name, email, message } = req.body;

  if (!name || typeof name !== "string" || name.length > 100) {
    return res.status(400).json({ error: "Nom invalide (max 100 caractères)." });
  }
  if (!email || typeof email !== "string" || email.length > 200) {
    return res.status(400).json({ error: "Email invalide." });
  }
  if (!message || typeof message !== "string" || message.length > 2000) {
    return res.status(400).json({ error: "Message invalide (max 2000 caractères)." });
  }

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Format d'email invalide." });
  }

  req.body.name = sanitizeString(name);
  req.body.email = sanitizeString(email);
  req.body.message = sanitizeString(message);

  next();
};

// ── 3. Validate tip ID params ──
export const validateTipId = (req: Request, res: Response, next: NextFunction) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id || !/^[a-f\d]{24}$/i.test(id)) {
    return res.status(400).json({ error: "ID de tip invalide." });
  }
  next();
};