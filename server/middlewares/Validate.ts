// server/middlewares/validate.ts
import { Request, Response, NextFunction } from "express";

const pick = (obj: Record<string, any>, allowed: string[]) => {
  return allowed.reduce((acc, key) => {
    if (key in obj) acc[key] = obj[key];
    return acc;
  }, {} as Record<string, any>);
};

const sanitizeString = (value: string): string => {
  return value
    .trim()
    .replace(/<script.*?>.*?<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "");
};

// ── 1. Validate /api/tip/generate ──
export const validateGenerate = (req: Request, res: Response, next: NextFunction) => {
  // Allow all fields the frontend sends
  req.body = pick(req.body, ["title", "type", "aspect", "interests", "language", "concise", "consice", "text_overlay"]);

  const { title, type } = req.body;

  if (!title || typeof title !== "string") {
    return res.status(400).json({ error: "Le champ 'title' est requis." });
  }
  if (!type || typeof type !== "string") {
    return res.status(400).json({ error: "Le champ 'type' est requis." });
  }
  if (title.length > 200) {
    return res.status(400).json({ error: "Titre trop long (max 200)." });
  }

  // interests: accept both string and array
// keep interests as array
if (req.body.interests && !Array.isArray(req.body.interests)) {
  req.body.interests = String(req.body.interests).split(",").map((i: string) => i.trim()).filter(Boolean);
}

  req.body.title = sanitizeString(title);
  req.body.type = sanitizeString(type);

  next();
};

// ── 2. Validate /api/contact ──
export const validateContact = (req: Request, res: Response, next: NextFunction) => {
  req.body = pick(req.body, ["name", "email", "message"]);

  const { name, email, message } = req.body;

  if (!name || typeof name !== "string" || name.length > 100) {
    return res.status(400).json({ error: "Nom invalide (max 100)." });
  }
  if (!email || typeof email !== "string" || email.length > 200) {
    return res.status(400).json({ error: "Email invalide." });
  }
  if (!message || typeof message !== "string" || message.length > 2000) {
    return res.status(400).json({ error: "Message invalide (max 2000)." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Format email invalide." });
  }

  req.body.name = sanitizeString(name);
  req.body.email = sanitizeString(email);
  req.body.message = sanitizeString(message);

  next();
};

// ── 3. Validate tip ID ──
export const validateTipId = (req: Request, res: Response, next: NextFunction) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id || !/^[a-f\d]{24}$/i.test(id)) {
    return res.status(400).json({ error: "ID invalide." });
  }
  next();
};