import express, { type Request, type Response } from "express";
import crypto from "crypto";
import { supabaseAdmin } from "../lib/supabase";
import {
  SESSION_TTL_MS,
  activeSessions,
  hashToken,
  MAX_FAILED_ATTEMPTS,
  LOCKOUT_WINDOW_MS,
  loginAttempts,
  getClientIp,
  safeCompare,
  getAdminSecret,
} from "../lib/auth";

const router = express.Router();

// --- AUTH API ENDPOINTS ---

// Admin Login
router.post("/api/admin/login", async (req: Request, res: Response) => {
  const ip = getClientIp(req);
  const now = Date.now();

  // Rate limiter check
  const attemptRow = loginAttempts.get(ip) || { attempts: 0, lockUntil: 0, lastAttempt: now };
  if (attemptRow.lockUntil > now) {
    const remainingMinutes = Math.ceil((attemptRow.lockUntil - now) / 60000);
    res.status(429).json({
      success: false,
      message: `Too many failed login attempts. Please wait ${remainingMinutes} minute(s) before trying again.`
    });
    return;
  }

  const { password } = req.body || {};
  if (!password || typeof password !== "string") {
    res.status(400).json({ success: false, message: "Invalid administrator credentials." });
    return;
  }

  let expectedPassword: string;
  try {
    expectedPassword = getAdminSecret();
  } catch (err) {
    // ADMIN_PASSWORD isn't configured. Server startup already refuses to
    // boot without it, but this stays as defense in depth rather than
    // ever falling back to a hardcoded password.
    console.error((err as Error).message);
    res.status(500).json({ success: false, message: "Admin authentication is not configured on this server." });
    return;
  }

  const isValid = safeCompare(password, expectedPassword);

  if (!isValid) {
    attemptRow.attempts += 1;
    attemptRow.lastAttempt = now;
    if (attemptRow.attempts >= MAX_FAILED_ATTEMPTS) {
      attemptRow.lockUntil = now + LOCKOUT_WINDOW_MS;
      attemptRow.attempts = 0;
    }
    loginAttempts.set(ip, attemptRow);

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from("login_attempts").upsert({
          ip,
          attempts: attemptRow.attempts,
          lock_until: attemptRow.lockUntil > now ? new Date(attemptRow.lockUntil).toISOString() : null,
          last_attempt: new Date(now).toISOString(),
        });
      } catch {
        // Ignored
      }
    }

    res.status(401).json({ success: false, message: "Invalid administrator credentials." });
    return;
  }

  // Success: clear rate limiter
  loginAttempts.delete(ip);
  if (supabaseAdmin) {
    try {
      await supabaseAdmin.from("login_attempts").delete().eq("ip", ip);
    } catch {
      // Ignored
    }
  }

  // Issue session token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = now + SESSION_TTL_MS;
  activeSessions.set(token, {
    createdAt: now,
    expiresAt
  });

  if (supabaseAdmin) {
    try {
      await supabaseAdmin.from("admin_sessions").insert({
        token_hash: hashToken(token),
        expires_at: new Date(expiresAt).toISOString(),
      });
    } catch {
      // Handled via local activeSessions
    }
  }

  res.cookie("afit_admin_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TTL_MS,
    path: "/"
  });

  res.json({
    success: true,
    message: "Admin authentication successful.",
    token
  });
});

// Check Session Status
router.get("/api/admin/session", async (req: Request, res: Response) => {
  const sessionToken = req.cookies?.afit_admin_session ||
    (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null);

  if (!sessionToken) {
    res.json({ authenticated: false });
    return;
  }

  const now = Date.now();
  const localSession = activeSessions.get(sessionToken);
  if (localSession && localSession.expiresAt > now) {
    res.json({ authenticated: true });
    return;
  }

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
        res.json({ authenticated: true });
        return;
      }
    } catch {
      // Fallback
    }
  }

  res.clearCookie("afit_admin_session");
  res.json({ authenticated: false });
});

// Admin Logout
router.post("/api/admin/logout", async (req: Request, res: Response) => {
  const sessionToken = req.cookies?.afit_admin_session ||
    (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null);

  if (sessionToken) {
    activeSessions.delete(sessionToken);
    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from("admin_sessions").delete().eq("token_hash", hashToken(sessionToken));
      } catch {
        // Ignored
      }
    }
  }

  res.clearCookie("afit_admin_session", { path: "/" });
  res.json({ success: true, message: "Logged out successfully." });
});

export default router;
