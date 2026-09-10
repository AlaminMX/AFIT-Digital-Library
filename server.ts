import express, { type Request, type Response, type NextFunction } from "express";
import cookieParser from "cookie-parser";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(cookieParser());

// Ensure upload directories and data storage exist
const uploadsDir = path.join(process.cwd(), "public", "uploads", "carousel");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(process.cwd(), "public", "uploads")));

// --- SERVER-SIDE SUPABASE CLIENT (SERVICE ROLE) ---
// This client uses the service role key and bypasses RLS. It must NEVER
// run in the browser. SUPABASE_SERVICE_ROLE_KEY must NOT be prefixed with
// VITE_ or Vite will inline it into the public client bundle.
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Server misconfigured: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must both be set. " +
    "Admin login cannot function without them."
  );
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Rate limiter for login: max 5 failed attempts within 15 minutes per IP
// NOTE: this is still in-memory. On serverless/multi-instance deploys it
// resets per cold start, so it's a soft speed bump, not a hard guarantee.
// Flagged as a separate follow-up — not part of this fix.
interface LoginAttemptRecord {
  attempts: number;
  lockUntil: number;
  lastAttempt: number;
}
const loginAttempts = new Map<string, LoginAttemptRecord>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "127.0.0.1";
}

// Constant-time string comparison to prevent timing attacks
function safeCompare(a: string, b: string): boolean {
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

// Get admin password from environment. No fallback — a hardcoded default
// in a public repo defeats the point of authentication.
function getAdminSecret(): string {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) {
    throw new Error("ADMIN_PASSWORD environment variable is not set.");
  }
  return secret;
}

// --- AUTHENTICATION MIDDLEWARE ---
export async function requireAdminAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const sessionToken = req.cookies?.afit_admin_session ||
    (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null);

  if (!sessionToken) {
    res.status(401).json({ error: "Unauthorized. Authentication session required." });
    return;
  }

  const tokenHash = hashToken(sessionToken);

  const { data: session, error } = await supabaseAdmin
    .from("admin_sessions")
    .select("expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error) {
    console.error("Session lookup failed:", error);
    res.status(500).json({ error: "Session check failed." });
    return;
  }

  if (!session || new Date(session.expires_at).getTime() < Date.now()) {
    if (session) {
      await supabaseAdmin.from("admin_sessions").delete().eq("token_hash", tokenHash);
    }
    res.clearCookie("afit_admin_session");
    res.status(401).json({ error: "Unauthorized. Session expired or invalid." });
    return;
  }

  next();
}

// --- AUTH API ENDPOINTS ---

// Admin Login
app.post("/api/admin/login", async (req: Request, res: Response) => {
  const ip = getClientIp(req);
  const now = Date.now();
  const attemptRecord = loginAttempts.get(ip) || { attempts: 0, lockUntil: 0, lastAttempt: now };

  if (attemptRecord.lockUntil > now) {
    const remainingMinutes = Math.ceil((attemptRecord.lockUntil - now) / 60000);
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
    console.error("Admin login misconfigured:", err);
    res.status(500).json({ success: false, message: "Server is not configured for admin login." });
    return;
  }

  const isValid = safeCompare(password, expectedPassword);

  if (!isValid) {
    attemptRecord.attempts += 1;
    attemptRecord.lastAttempt = now;
    if (attemptRecord.attempts >= MAX_FAILED_ATTEMPTS) {
      attemptRecord.lockUntil = now + LOCKOUT_WINDOW_MS;
      attemptRecord.attempts = 0;
    }
    loginAttempts.set(ip, attemptRecord);

    res.status(401).json({
      success: false,
      message: "Invalid administrator credentials."
    });
    return;
  }

  // Login successful: reset attempts
  loginAttempts.delete(ip);

  // Generate cryptographic token, persist only its hash in Supabase
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(now + SESSION_TTL_MS).toISOString();

  const { error: insertError } = await supabaseAdmin.from("admin_sessions").insert({
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  if (insertError) {
    console.error("Failed to create session:", insertError);
    res.status(500).json({ success: false, message: "Could not start session. Please try again." });
    return;
  }

  // Set secure HttpOnly cookie
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
    token // also provide token in response for optional client-side token header
  });
});

// Check Session Status
app.get("/api/admin/session", async (req: Request, res: Response) => {
  const sessionToken = req.cookies?.afit_admin_session ||
    (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null);

  if (!sessionToken) {
    res.json({ authenticated: false });
    return;
  }

  const tokenHash = hashToken(sessionToken);

  const { data: session, error } = await supabaseAdmin
    .from("admin_sessions")
    .select("expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error) {
    console.error("Session lookup failed:", error);
    res.json({ authenticated: false });
    return;
  }

  if (!session || new Date(session.expires_at).getTime() < Date.now()) {
    if (session) {
      await supabaseAdmin.from("admin_sessions").delete().eq("token_hash", tokenHash);
    }
    res.clearCookie("afit_admin_session");
    res.json({ authenticated: false });
    return;
  }

  res.json({ authenticated: true });
});

// Admin Logout
app.post("/api/admin/logout", async (req: Request, res: Response) => {
  const sessionToken = req.cookies?.afit_admin_session ||
    (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null);

  if (sessionToken) {
    await supabaseAdmin.from("admin_sessions").delete().eq("token_hash", hashToken(sessionToken));
  }

  res.clearCookie("afit_admin_session", { path: "/" });
  res.json({ success: true, message: "Logged out successfully." });
});

// --- CAROUSEL DATA STORAGE HELPERS ---
const CAROUSEL_FILE = path.join(process.cwd(), "data", "carousel_slides.json");

export interface CarouselSlide {
  id: string;
  title: string;
  description: string;
  image_url: string;
  cta_text?: string;
  cta_url?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function readCarouselSlides(): CarouselSlide[] {
  try {
    if (fs.existsSync(CAROUSEL_FILE)) {
      const content = fs.readFileSync(CAROUSEL_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Error reading carousel slides:", err);
  }
  return [];
}

function writeCarouselSlides(slides: CarouselSlide[]): boolean {
  try {
    fs.writeFileSync(CAROUSEL_FILE, JSON.stringify(slides, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error saving carousel slides:", err);
    return false;
  }
}

// --- PUBLIC CAROUSEL API ---
// Only returns active slides ordered by display_order
app.get("/api/carousel", (_req: Request, res: Response) => {
  const slides = readCarouselSlides();
  const activeSlides = slides
    .filter((s) => s.is_active)
    .sort((a, b) => a.display_order - b.display_order);

  res.json({ slides: activeSlides });
});

// --- PROTECTED ADMIN CAROUSEL API ---

// Get all slides (active & inactive)
app.get("/api/admin/carousel", requireAdminAuth, (_req: Request, res: Response) => {
  const slides = readCarouselSlides();
  slides.sort((a, b) => a.display_order - b.display_order);
  res.json({ slides });
});

// Create new slide
app.post("/api/admin/carousel", requireAdminAuth, (req: Request, res: Response) => {
  const { title, description, image_url, cta_text, cta_url, display_order, is_active } = req.body;

  if (!title || !description || !image_url) {
    res.status(400).json({ error: "Title, description, and image URL are required." });
    return;
  }

  const slides = readCarouselSlides();
  const newSlide: CarouselSlide = {
    id: `slide-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
    title: String(title).trim(),
    description: String(description).trim(),
    image_url: String(image_url).trim(),
    cta_text: cta_text ? String(cta_text).trim() : undefined,
    cta_url: cta_url ? String(cta_url).trim() : undefined,
    display_order: Number(display_order) || slides.length + 1,
    is_active: is_active !== false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  slides.push(newSlide);
  writeCarouselSlides(slides);

  res.status(201).json({ success: true, slide: newSlide });
});

// Update slide
app.put("/api/admin/carousel/:id", requireAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const slides = readCarouselSlides();
  const index = slides.findIndex((s) => s.id === id);

  if (index === -1) {
    res.status(404).json({ error: "Slide not found." });
    return;
  }

  const current = slides[index];
  const { title, description, image_url, cta_text, cta_url, display_order, is_active } = req.body;

  slides[index] = {
    ...current,
    title: title !== undefined ? String(title).trim() : current.title,
    description: description !== undefined ? String(description).trim() : current.description,
    image_url: image_url !== undefined ? String(image_url).trim() : current.image_url,
    cta_text: cta_text !== undefined ? String(cta_text).trim() : current.cta_text,
    cta_url: cta_url !== undefined ? String(cta_url).trim() : current.cta_url,
    display_order: display_order !== undefined ? Number(display_order) : current.display_order,
    is_active: is_active !== undefined ? Boolean(is_active) : current.is_active,
    updated_at: new Date().toISOString()
  };

  writeCarouselSlides(slides);
  res.json({ success: true, slide: slides[index] });
});

// Delete slide
app.delete("/api/admin/carousel/:id", requireAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const slides = readCarouselSlides();
  const filtered = slides.filter((s) => s.id !== id);

  if (filtered.length === slides.length) {
    res.status(404).json({ error: "Slide not found." });
    return;
  }

  writeCarouselSlides(filtered);
  res.json({ success: true, message: "Slide deleted successfully." });
});

// --- PROTECTED IMAGE UPLOAD API ---
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `carousel-${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|avif|gif/;
    const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
    const mime = file.mimetype.toLowerCase();
    if (allowed.test(ext) || allowed.test(mime)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (JPEG, PNG, WebP, AVIF, GIF) are allowed."));
    }
  }
});

app.post(
  "/api/admin/upload",
  requireAdminAuth,
  upload.single("image"),
  (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: "No image file provided." });
      return;
    }

    const publicUrl = `/uploads/carousel/${req.file.filename}`;
    res.json({
      success: true,
      url: publicUrl,
      filename: req.file.filename,
      size: req.file.size
    });
  }
);

// --- VITE MIDDLEWARE & STATIC SERVING ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AFIT eLibrary server listening on port ${PORT}`);
  });
}

startServer();
