import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "./supabase";

// --- AUTHENTICATION & SESSIONS ---
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
export const activeSessions = new Map<string, { createdAt: number; expiresAt: number }>();

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const loginAttempts = new Map<string, { attempts: number; lockUntil: number; lastAttempt: number }>();

export function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "127.0.0.1";
}

export function safeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "utf-8");
    const bufB = Buffer.from(b, "utf-8");
    if (bufA.length !== bufB.length) {
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

// Previously this fell back to a hardcoded default ("afit2026") when
// ADMIN_PASSWORD was not set, which meant any deployment that forgot to set
// the env var was shipping a publicly-known admin password. It now throws
// instead — callers (server startup, and the login route as defense in
// depth) are expected to treat that as fatal rather than quietly proceeding.
export function getAdminSecret(): string {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret || secret.trim() === "") {
    throw new Error(
      "ADMIN_PASSWORD environment variable is not set. Refusing to start with a hardcoded " +
      "default admin password — set ADMIN_PASSWORD in your environment (see .env.example) " +
      "before starting the server."
    );
  }
  return secret;
}

export async function requireAdminAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const sessionToken = req.cookies?.afit_admin_session ||
    (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null);

  if (!sessionToken) {
    res.status(401).json({ error: "Unauthorized. Authentication session required." });
    return;
  }

  const now = Date.now();

  // 1. Check local session cache
  const localSession = activeSessions.get(sessionToken);
  if (localSession && localSession.expiresAt > now) {
    next();
    return;
  }

  // 2. Check Supabase admin_sessions if configured
  if (supabaseAdmin) {
    try {
      const tokenHash = hashToken(sessionToken);
      const { data: session, error } = await supabaseAdmin
        .from("admin_sessions")
        .select("expires_at")
        .eq("token_hash", tokenHash)
        .maybeSingle();

      if (!error && session && new Date(session.expires_at).getTime() > now) {
        activeSessions.set(sessionToken, {
          createdAt: now,
          expiresAt: new Date(session.expires_at).getTime(),
        });
        next();
        return;
      }
    } catch {
      // Fallback
    }
  }

  res.clearCookie("afit_admin_session");
  res.status(401).json({ error: "Unauthorized. Session expired or invalid." });
}
