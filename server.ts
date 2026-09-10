import express, { type Request, type Response, type NextFunction } from "express";
import cookieParser from "cookie-parser";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(cookieParser());

// --- SERVER-SIDE SUPABASE CLIENT (SERVICE ROLE) ---
// This client uses the service role key and bypasses RLS. It must NEVER
// run in the browser. SUPABASE_SERVICE_ROLE_KEY must NOT be prefixed with
// VITE_ or Vite will inline it into the public client bundle.
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Server misconfigured: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must both be set. " +
    "Admin login and all admin data operations cannot function without them."
  );
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Rate limiter for login: max 5 failed attempts within 15 minutes per IP.
// Persisted in Supabase (login_attempts table) so it survives restarts and
// is shared across serverless instances — previously an in-memory Map,
// which reset on every cold start and gave no real protection on Vercel.
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

  const { data: attemptRow, error: attemptLookupError } = await supabaseAdmin
    .from("login_attempts")
    .select("attempts, lock_until")
    .eq("ip", ip)
    .maybeSingle();

  if (attemptLookupError) {
    console.error("Failed to check login attempts:", attemptLookupError);
    // Fail open on the rate-limit check itself — a broken rate limiter
    // should not lock everyone out of the login form entirely.
  }

  const lockUntil = attemptRow?.lock_until ? new Date(attemptRow.lock_until).getTime() : 0;
  if (lockUntil > now) {
    const remainingMinutes = Math.ceil((lockUntil - now) / 60000);
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
    const newAttempts = (attemptRow?.attempts || 0) + 1;
    let newLockUntil: string | null = null;
    let attemptsToStore = newAttempts;

    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      newLockUntil = new Date(now + LOCKOUT_WINDOW_MS).toISOString();
      attemptsToStore = 0; // reset counter once locked; lock_until governs the wait
    }

    const { error: upsertError } = await supabaseAdmin.from("login_attempts").upsert({
      ip,
      attempts: attemptsToStore,
      lock_until: newLockUntil,
      last_attempt: new Date(now).toISOString(),
    });

    if (upsertError) {
      console.error("Failed to record login attempt:", upsertError);
    }

    res.status(401).json({
      success: false,
      message: "Invalid administrator credentials."
    });
    return;
  }

  // Login successful: clear any recorded attempts for this IP
  await supabaseAdmin.from("login_attempts").delete().eq("ip", ip);

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

// --- GENERIC ADMIN CRUD FACTORY ---
// Registers list/create/update/delete routes for a Supabase table, all
// behind requireAdminAuth and using the service-role client (so admins see
// every row, not just the ones public RLS would allow anon to read).
interface CrudOptions {
  resourcePath: string;   // URL segment, e.g. "departments"
  table: string;           // Supabase table name
  singular: string;        // JSON response key for one record, e.g. "department"
  orderColumn: string;
  ascending?: boolean;
  requiredFields: string[]; // checked on create; missing -> 400
}

function registerAdminCrudRoutes(opts: CrudOptions) {
  const { resourcePath, table, singular, orderColumn, ascending = true, requiredFields } = opts;

  // List all (admin sees every row, published or not, visible or not)
  app.get(`/api/admin/${resourcePath}`, requireAdminAuth, async (_req: Request, res: Response) => {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select("*")
      .order(orderColumn, { ascending });

    if (error) {
      console.error(`Failed to list ${table}:`, error);
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ [resourcePath]: data ?? [] });
  });

  // Create
  app.post(`/api/admin/${resourcePath}`, requireAdminAuth, async (req: Request, res: Response) => {
    const body = req.body || {};
    const missing = requiredFields.filter((field) => !body[field] || String(body[field]).trim() === "");
    if (missing.length > 0) {
      res.status(400).json({ error: `Missing required field(s): ${missing.join(", ")}` });
      return;
    }

    const { data, error } = await supabaseAdmin.from(table).insert(body).select().single();

    if (error) {
      console.error(`Failed to create ${singular}:`, error);
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(201).json({ [singular]: data });
  });

  // Update
  app.put(`/api/admin/${resourcePath}/:id`, requireAdminAuth, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from(table)
      .update(req.body || {})
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Failed to update ${singular}:`, error);
      res.status(400).json({ error: error.message });
      return;
    }

    res.json({ [singular]: data });
  });

  // Delete
  app.delete(`/api/admin/${resourcePath}/:id`, requireAdminAuth, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { error } = await supabaseAdmin.from(table).delete().eq("id", id);

    if (error) {
      console.error(`Failed to delete ${singular}:`, error);
      res.status(400).json({ error: error.message });
      return;
    }

    res.json({ success: true });
  });
}

registerAdminCrudRoutes({
  resourcePath: "departments",
  table: "departments",
  singular: "department",
  orderColumn: "display_order",
  ascending: true,
  requiredFields: ["name", "slug"],
});

registerAdminCrudRoutes({
  resourcePath: "books",
  table: "books",
  singular: "book",
  orderColumn: "created_at",
  ascending: false,
  requiredFields: ["title", "author"],
});

registerAdminCrudRoutes({
  resourcePath: "journals",
  table: "journals",
  singular: "journal",
  orderColumn: "created_at",
  ascending: false,
  requiredFields: ["title"],
});

// --- PROTECTED DOCUMENT (PDF) UPLOAD — Supabase Storage ---
const LIBRARY_BUCKET = "library-documents";

const uploadPdf = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
  fileFilter: (_req, file, cb) => {
    const isPdf =
      file.mimetype === "application/pdf" ||
      path.extname(file.originalname).toLowerCase() === ".pdf";
    if (isPdf) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed."));
    }
  }
});

app.post(
  "/api/admin/upload-document",
  requireAdminAuth,
  uploadPdf.single("document"),
  async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: "No PDF file provided." });
      return;
    }

    const safeName = `doc-${Date.now()}-${crypto.randomBytes(6).toString("hex")}.pdf`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(LIBRARY_BUCKET)
      .upload(safeName, req.file.buffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("Document upload failed:", uploadError);
      res.status(500).json({ error: "Failed to upload document to storage." });
      return;
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(LIBRARY_BUCKET)
      .getPublicUrl(safeName);

    const sizeInMb = (req.file.size / (1024 * 1024)).toFixed(1);

    res.json({
      success: true,
      url: publicUrlData.publicUrl,
      file_size: `${sizeInMb} MB`,
    });
  }
);

// --- INSTITUTIONAL STATS ---
// Single-row table. Public GET (homepage needs it), protected PUT (admin only).

interface StatsRow {
  total_students: string;
  academic_resources: string;
  active_departments: string;
  research_citations: string;
}

interface StatsResponse {
  totalStudents: string;
  academicResources: string;
  activeDepartments: string;
  researchCitations: string;
}

function mapStatsRow(row: StatsRow): StatsResponse {
  return {
    totalStudents: row.total_students,
    academicResources: row.academic_resources,
    activeDepartments: row.active_departments,
    researchCitations: row.research_citations,
  };
}

const DEFAULT_STATS: StatsResponse = {
  totalStudents: "12,500+",
  academicResources: "45,000+",
  activeDepartments: "18+",
  researchCitations: "98%",
};

// Public — homepage reads this directly, no auth
app.get("/api/stats", async (_req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from("institutional_stats")
    .select("total_students, academic_resources, active_departments, research_citations")
    .eq("id", true)
    .maybeSingle();

  if (error || !data) {
    res.json(DEFAULT_STATS);
    return;
  }

  res.json(mapStatsRow(data as StatsRow));
});

// Admin update
app.put("/api/admin/stats", requireAdminAuth, async (req: Request, res: Response) => {
  const { totalStudents, academicResources, activeDepartments, researchCitations } = req.body || {};

  const { data, error } = await supabaseAdmin
    .from("institutional_stats")
    .update({
      total_students: totalStudents,
      academic_resources: academicResources,
      active_departments: activeDepartments,
      research_citations: researchCitations,
    })
    .eq("id", true)
    .select("total_students, academic_resources, active_departments, research_citations")
    .single();

  if (error || !data) {
    console.error("Failed to update institutional stats:", error);
    res.status(400).json({ error: error?.message || "Failed to update stats." });
    return;
  }

  res.json(mapStatsRow(data as StatsRow));
});

// --- CAROUSEL — Supabase table + Supabase Storage ---
// Replaces the old local-disk JSON file and local-disk image uploads,
// neither of which survive a Vercel serverless deploy.
const CAROUSEL_BUCKET = "carousel-images";

// Public — only active slides, ordered
app.get("/api/carousel", async (_req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from("carousel_slides")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Failed to load carousel slides:", error);
    res.json({ slides: [] });
    return;
  }

  res.json({ slides: data ?? [] });
});

// Admin — all slides, active or not
app.get("/api/admin/carousel", requireAdminAuth, async (_req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from("carousel_slides")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Failed to load carousel slides (admin):", error);
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ slides: data ?? [] });
});

app.post("/api/admin/carousel", requireAdminAuth, async (req: Request, res: Response) => {
  const { title, description, image_url, cta_text, cta_url, display_order, is_active } = req.body || {};

  if (!title || !description || !image_url) {
    res.status(400).json({ error: "Title, description, and image URL are required." });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("carousel_slides")
    .insert({
      title: String(title).trim(),
      description: String(description).trim(),
      image_url: String(image_url).trim(),
      cta_text: cta_text ? String(cta_text).trim() : null,
      cta_url: cta_url ? String(cta_url).trim() : null,
      display_order: Number(display_order) || 0,
      is_active: is_active !== false,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create carousel slide:", error);
    res.status(400).json({ error: error.message });
    return;
  }

  res.status(201).json({ success: true, slide: data });
});

app.put("/api/admin/carousel/:id", requireAdminAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, image_url, cta_text, cta_url, display_order, is_active } = req.body || {};

  const updatePayload: Record<string, unknown> = {};
  if (title !== undefined) updatePayload.title = String(title).trim();
  if (description !== undefined) updatePayload.description = String(description).trim();
  if (image_url !== undefined) updatePayload.image_url = String(image_url).trim();
  if (cta_text !== undefined) updatePayload.cta_text = cta_text ? String(cta_text).trim() : null;
  if (cta_url !== undefined) updatePayload.cta_url = cta_url ? String(cta_url).trim() : null;
  if (display_order !== undefined) updatePayload.display_order = Number(display_order);
  if (is_active !== undefined) updatePayload.is_active = Boolean(is_active);

  const { data, error } = await supabaseAdmin
    .from("carousel_slides")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    console.error("Failed to update carousel slide:", error);
    res.status(404).json({ error: error?.message || "Slide not found." });
    return;
  }

  res.json({ success: true, slide: data });
});

app.delete("/api/admin/carousel/:id", requireAdminAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error } = await supabaseAdmin.from("carousel_slides").delete().eq("id", id);

  if (error) {
    console.error("Failed to delete carousel slide:", error);
    res.status(400).json({ error: error.message });
    return;
  }

  res.json({ success: true, message: "Slide deleted successfully." });
});

// Carousel image upload — Supabase Storage, not local disk
const uploadImage = multer({
  storage: multer.memoryStorage(),
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
  uploadImage.single("image"),
  async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: "No image file provided." });
      return;
    }

    const ext = path.extname(req.file.originalname).toLowerCase() || ".jpg";
    const safeName = `carousel-${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(CAROUSEL_BUCKET)
      .upload(safeName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error("Carousel image upload failed:", uploadError);
      res.status(500).json({ error: "Failed to upload image to storage." });
      return;
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(CAROUSEL_BUCKET)
      .getPublicUrl(safeName);

    res.json({
      success: true,
      url: publicUrlData.publicUrl,
      filename: safeName,
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
