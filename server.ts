import express, { type Request, type Response, type NextFunction } from "express";
import cookieParser from "cookie-parser";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServer as createViteServer } from "vite";
import { convertFileToPdf, generateDocxDocument, generateAcademicAbstract } from "./server/document-service";

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(cookieParser());

// Ensure directories exist
const DATA_DIR = path.join(process.cwd(), "data");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
const CAROUSEL_UPLOADS_DIR = path.join(UPLOADS_DIR, "carousel");
const DOCS_UPLOADS_DIR = path.join(UPLOADS_DIR, "documents");

[DATA_DIR, UPLOADS_DIR, CAROUSEL_UPLOADS_DIR, DOCS_UPLOADS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Serve uploaded files statically
app.use("/uploads", express.static(UPLOADS_DIR));

// --- SERVER-SIDE SUPABASE CLIENT (SERVICE ROLE OR ANONYMOUS KEY) ---
// This client is initialized if valid Supabase credentials exist.
// If not configured or using placeholders, the server falls back seamlessly
// to local persistent storage so startup and functionality never fail.
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const isRealSupabaseUrl = Boolean(
  supabaseUrl &&
  !supabaseUrl.includes("your-project.supabase.co") &&
  supabaseUrl.startsWith("http")
);

let supabaseAdmin: SupabaseClient | null = null;
if (isRealSupabaseUrl && supabaseServiceKey) {
  try {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });
    console.log("Supabase client initialized with server-side credentials.");
  } catch (err) {
    console.warn("Could not initialize Supabase client; falling back to local storage:", err);
  }
} else {
  console.log("Operating with integrated local storage (Supabase credentials not configured or using placeholder).");
}

// --- FILE STORAGE HELPERS ---
function readJsonFile<T>(filename: string, fallback: T): T {
  const filePath = path.join(DATA_DIR, filename);
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content) as T;
    }
  } catch (err) {
    console.error(`Error reading ${filename}:`, err);
  }
  // Initialize file with fallback
  try {
    fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), "utf-8");
  } catch (err) {
    console.error(`Error writing default ${filename}:`, err);
  }
  return fallback;
}

function writeJsonFile<T>(filename: string, data: T): void {
  const filePath = path.join(DATA_DIR, filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`Error writing ${filename}:`, err);
  }
}

// --- SEED / DEFAULT DATA ---
const DEFAULT_DEPARTMENTS = [
  {
    id: "d1000000-0000-4000-8000-000000000001",
    name: "Artificial Intelligence",
    slug: "artificial-intelligence",
    description: "Advanced machine learning, neural architectures, cognitive systems, and autonomous robotics research collections.",
    display_order: 1,
    color: "#1d4ed8",
    icon: "code",
    background_image_url: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=1200&q=80",
    is_visible: true,
  },
  {
    id: "d1000000-0000-4000-8000-000000000002",
    name: "Biotechnology",
    slug: "biotechnology",
    description: "Genetic engineering, molecular biology, bio-informatics, and biomedical laboratory literature.",
    display_order: 2,
    color: "#0d9488",
    icon: "atom",
    background_image_url: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80",
    is_visible: true,
  },
  {
    id: "d1000000-0000-4000-8000-000000000003",
    name: "Business Administration",
    slug: "business-administration",
    description: "Strategic management, entrepreneurship, organizational behavior, and military logistics administration.",
    display_order: 3,
    color: "#ea580c",
    icon: "briefcase",
    background_image_url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
    is_visible: true,
  },
  {
    id: "d1000000-0000-4000-8000-000000000004",
    name: "Economics",
    slug: "economics",
    description: "Macroeconomic policy, defense economics, econometric modeling, and resource allocation studies.",
    display_order: 4,
    color: "#4f46e5",
    icon: "chart",
    background_image_url: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1200&q=80",
    is_visible: true,
  },
  {
    id: "d1000000-0000-4000-8000-000000000005",
    name: "Accounting",
    slug: "accounting",
    description: "Financial reporting, auditing, public sector finance, and fiscal compliance journals.",
    display_order: 5,
    color: "#ca8a04",
    icon: "calculator",
    background_image_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80",
    is_visible: true,
  },
  {
    id: "d1000000-0000-4000-8000-000000000006",
    name: "Civil Engineering",
    slug: "civil-engineering",
    description: "Structural engineering, geotechnics, airfield pavements, and heavy infrastructure research.",
    display_order: 6,
    color: "#0284c7",
    icon: "construction",
    background_image_url: "https://images.unsplash.com/photo-1541888946425-d0fbb18f192b?auto=format&fit=crop&w=1200&q=80",
    is_visible: true,
  },
  {
    id: "d1000000-0000-4000-8000-000000000007",
    name: "Mechanical Engineering",
    slug: "mechanical-engineering",
    description: "Thermodynamics, fluid mechanics, machine design, and automotive propulsion systems.",
    display_order: 7,
    color: "#9333ea",
    icon: "circuit",
    background_image_url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80",
    is_visible: true,
  },
  {
    id: "d1000000-0000-4000-8000-000000000008",
    name: "Aerospace Engineering",
    slug: "aerospace-engineering",
    description: "Aircraft design, aerodynamics, propulsion, avionics, and space flight dynamics monographs.",
    display_order: 8,
    color: "#2563eb",
    icon: "construction",
    background_image_url: "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&w=1200&q=80",
    is_visible: true,
  },
  {
    id: "d1000000-0000-4000-8000-000000000009",
    name: "Electrical and Electronics Engineering",
    slug: "electrical-and-electronics-engineering",
    description: "Power systems, microelectronics, control engineering, and electrical machinery publications.",
    display_order: 9,
    color: "#d97706",
    icon: "circuit",
    background_image_url: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1200&q=80",
    is_visible: true,
  },
  {
    id: "d1000000-0000-4000-8000-000000000010",
    name: "Information Communication Engineering",
    slug: "information-communication-engineering",
    description: "Telecommunication networks, optical communications, radar signal processing, and wireless systems.",
    display_order: 10,
    color: "#059669",
    icon: "network",
    background_image_url: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80",
    is_visible: true,
  },
  {
    id: "d1000000-0000-4000-8000-000000000011",
    name: "Cybersecurity",
    slug: "cybersecurity",
    description: "Information assurance, cryptographic protocols, ethical hacking, and tactical network defense.",
    display_order: 11,
    color: "#dc2626",
    icon: "code",
    background_image_url: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80",
    is_visible: true,
  },
];

const DEFAULT_BOOKS = [
  {
    id: "b1000000-0000-4000-8000-000000000001",
    department_id: "d1000000-0000-4000-8000-000000000001",
    title: "Foundations of Artificial Intelligence & Neural Systems",
    author: "Dr. A. K. Bello, Prof. E. N. Okafor",
    description: "Comprehensive textbook covering foundational machine learning algorithms, expert systems, and neural network architectures for defense and aerospace applications.",
    cover_image: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=800&q=80",
    isbn: "978-978-362-101-2",
    publisher: "AFIT Academic Press",
    publication_year: 2024,
    edition: "2nd Edition",
    category: "Machine Learning",
    file_path: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    file_size: "4.2 MB",
    status: "published",
    uploaded_by: "Admin Librarian",
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "b1000000-0000-4000-8000-000000000002",
    department_id: "d1000000-0000-4000-8000-000000000003",
    title: "Principles of Business Administration & Strategic Management",
    author: "Col. M. S. Ibrahim (Retd.), Dr. Chinyere Uzor",
    description: "An authoritative guide to organizational leadership, military logistics management, and corporate strategy in modern institutions.",
    cover_image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
    isbn: "978-978-411-890-5",
    publisher: "Kaduna University Press",
    publication_year: 2023,
    edition: "1st Edition",
    category: "Management",
    file_path: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    file_size: "3.8 MB",
    status: "published",
    uploaded_by: "Admin Librarian",
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "b1000000-0000-4000-8000-000000000003",
    department_id: "d1000000-0000-4000-8000-000000000006",
    title: "Advanced Structural Engineering and Reinforced Concrete Design",
    author: "Engr. Prof. T. D. Aliyu",
    description: "Detailed analysis of load-bearing structures, earthquake-resistant design, and heavy infrastructural materials testing.",
    cover_image: "https://images.unsplash.com/photo-1541888946425-d0fbb18f192b?auto=format&fit=crop&w=800&q=80",
    isbn: "978-978-882-334-1",
    publisher: "Nigerian Society of Engineers Press",
    publication_year: 2024,
    edition: "3rd Edition",
    category: "Civil Engineering",
    file_path: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    file_size: "7.1 MB",
    status: "published",
    uploaded_by: "Admin Librarian",
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z",
  }
];

const DEFAULT_JOURNALS = [
  {
    id: "j1000000-0000-4000-8000-000000000001",
    department_id: "d1000000-0000-4000-8000-000000000001",
    title: "AFIT Journal of Artificial Intelligence & Autonomous Systems",
    description: "Peer-reviewed biannual journal featuring cutting-edge research in UAV autonomy, neural controllers, and cognitive decision support.",
    cover_image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    publisher: "AFIT Research Directorate",
    issn: "2756-9901",
    volume: "Vol. 5",
    issue: "Issue 2",
    publication_date: "2025-06-15",
    category: "Research Journal",
    file_path: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    file_size: "2.9 MB",
    status: "published",
    uploaded_by: "Admin Librarian",
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "j1000000-0000-4000-8000-000000000002",
    department_id: "d1000000-0000-4000-8000-000000000011",
    title: "Nigerian Journal of Cybersecurity & National Security Informatics",
    description: "Scholarly articles on cryptographic protocols, tactical communications encryption, and critical national infrastructure protection.",
    cover_image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80",
    publisher: "AFIT Cybersecurity Center",
    issn: "2811-0423",
    volume: "Vol. 3",
    issue: "Issue 1",
    publication_date: "2025-03-10",
    category: "Cybersecurity",
    file_path: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    file_size: "3.4 MB",
    status: "published",
    uploaded_by: "Admin Librarian",
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z",
  }
];

const DEFAULT_SLIDES = [
  {
    id: "c1000000-0000-4000-8000-000000000001",
    title: "Aeronautics & Defense Systems Archive",
    description: "Access over 15,000 peer-reviewed technical reports, propulsion research, and aerospace engineering papers.",
    image_url: "https://images.unsplash.com/photo-1517976487502-d5966a3d92fb?auto=format&fit=crop&w=1600&q=80",
    cta_text: "Explore Aerospace Papers",
    cta_url: "/departments/aerospace-engineering",
    display_order: 1,
    is_active: true,
    created_at: "2026-09-09T00:00:00.000Z",
    updated_at: "2026-09-09T00:00:00.000Z",
  },
  {
    id: "c1000000-0000-4000-8000-000000000002",
    title: "Artificial Intelligence & Autonomous Robotics",
    description: "Cutting-edge publications in autonomous control algorithms, cyber defence analytics, and computer vision systems.",
    image_url: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1600&q=80",
    cta_text: "View AI Publications",
    cta_url: "/departments/artificial-intelligence",
    display_order: 2,
    is_active: true,
    created_at: "2026-09-09T00:00:00.000Z",
    updated_at: "2026-09-09T00:00:00.000Z",
  },
  {
    id: "c1000000-0000-4000-8000-000000000003",
    title: "National Defense Journal & Academic Proceedings",
    description: "Official periodicals and strategic military logistics studies published by accredited AFIT faculty boards.",
    image_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80",
    cta_text: "Read Periodicals",
    cta_url: "/departments/cyber-security",
    display_order: 3,
    is_active: true,
    created_at: "2026-09-09T00:00:00.000Z",
    updated_at: "2026-09-09T00:00:00.000Z",
  },
];

interface StatsResponse {
  totalStudents: string;
  academicResources: string;
  activeDepartments: string;
  researchCitations: string;
}

const DEFAULT_STATS: StatsResponse = {
  totalStudents: "12,500+",
  academicResources: "45,000+",
  activeDepartments: "18+",
  researchCitations: "98%",
};

// Initialize JSON files if missing
readJsonFile("departments.json", DEFAULT_DEPARTMENTS);
readJsonFile("books.json", DEFAULT_BOOKS);
readJsonFile("journals.json", DEFAULT_JOURNALS);
readJsonFile("carousel_slides.json", DEFAULT_SLIDES);
readJsonFile("institutional_stats.json", DEFAULT_STATS);

// --- AUTHENTICATION & SESSIONS ---
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const activeSessions = new Map<string, { createdAt: number; expiresAt: number }>();

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const loginAttempts = new Map<string, { attempts: number; lockUntil: number; lastAttempt: number }>();

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "127.0.0.1";
}

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

function getAdminSecret(): string {
  return process.env.ADMIN_PASSWORD || "afit2026";
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

// --- AUTH API ENDPOINTS ---

// Admin Login
app.post("/api/admin/login", async (req: Request, res: Response) => {
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

  const expectedPassword = getAdminSecret();
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
app.get("/api/admin/session", async (req: Request, res: Response) => {
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
app.post("/api/admin/logout", async (req: Request, res: Response) => {
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

// --- GENERIC ADMIN CRUD FACTORY ---
interface CrudOptions {
  resourcePath: string;
  table: string;
  singular: string;
  orderColumn: string;
  ascending?: boolean;
  requiredFields: string[];
  defaultData: Record<string, unknown>[];
}

function registerAdminCrudRoutes(opts: CrudOptions) {
  const { resourcePath, table, singular, orderColumn, ascending = true, requiredFields, defaultData } = opts;
  const jsonFilename = `${resourcePath}.json`;

  // List all
  app.get(`/api/admin/${resourcePath}`, requireAdminAuth, async (_req: Request, res: Response) => {
    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select("*")
          .order(orderColumn, { ascending });

        if (!error && data && data.length > 0) {
          res.json({ [resourcePath]: data });
          return;
        }
      } catch (err) {
        console.warn(`Supabase ${table} read error, using local data:`, err);
      }
    }

    const localData = readJsonFile<Record<string, unknown>[]>(jsonFilename, defaultData);
    localData.sort((a, b) => {
      const valA = a[orderColumn];
      const valB = b[orderColumn];
      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return ascending ? 1 : -1;
      if (valB === undefined || valB === null) return ascending ? -1 : 1;
      return ascending ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });

    res.json({ [resourcePath]: localData });
  });

  // Create
  app.post(`/api/admin/${resourcePath}`, requireAdminAuth, async (req: Request, res: Response) => {
    const body = req.body || {};

    // Auto-resolve optional titles and authors according to institutional standards
    if (resourcePath === "books") {
      if (!body.title || String(body.title).trim() === "") {
        body.title = body.suggested_title || body.original_name?.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ") || "Untitled Academic Monograph";
      }
      if (!body.author || String(body.author).trim() === "") {
        body.author = "AFIT Faculty";
      }
    } else if (resourcePath === "journals") {
      if (!body.title || String(body.title).trim() === "") {
        body.title = body.suggested_title || body.original_name?.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ") || "Untitled Research Paper";
      }
    }

    const missing = requiredFields.filter((field) => !body[field] || String(body[field]).trim() === "");
    if (missing.length > 0) {
      res.status(400).json({ error: `Missing required field(s): ${missing.join(", ")}` });
      return;
    }

    const id = body.id || crypto.randomUUID();
    const now = new Date().toISOString();
    const newRecord = {
      ...body,
      id,
      created_at: body.created_at || now,
      updated_at: now,
    };

    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin.from(table).insert(newRecord).select().single();
        if (!error && data) {
          const items = readJsonFile<Record<string, unknown>[]>(jsonFilename, defaultData);
          items.unshift(data);
          writeJsonFile(jsonFilename, items);
          res.status(201).json({ [singular]: data });
          return;
        }
      } catch (err) {
        console.warn(`Supabase ${table} insert error, saving locally:`, err);
      }
    }

    const items = readJsonFile<Record<string, unknown>[]>(jsonFilename, defaultData);
    items.unshift(newRecord);
    writeJsonFile(jsonFilename, items);
    res.status(201).json({ [singular]: newRecord });
  });

  // Update
  app.put(`/api/admin/${resourcePath}/:id`, requireAdminAuth, async (req: Request, res: Response) => {
    const { id } = req.params;
    const body = req.body || {};
    const now = new Date().toISOString();

    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .update({ ...body, updated_at: now })
          .eq("id", id)
          .select()
          .single();

        if (!error && data) {
          const items = readJsonFile<Record<string, unknown>[]>(jsonFilename, defaultData);
          const idx = items.findIndex((item) => String(item.id) === String(id));
          if (idx !== -1) {
            items[idx] = data;
          } else {
            items.unshift(data);
          }
          writeJsonFile(jsonFilename, items);
          res.json({ [singular]: data });
          return;
        }
      } catch (err) {
        console.warn(`Supabase ${table} update error, saving locally:`, err);
      }
    }

    const items = readJsonFile<Record<string, unknown>[]>(jsonFilename, defaultData);
    const idx = items.findIndex((item) => String(item.id) === String(id));
    if (idx === -1) {
      res.status(404).json({ error: `${singular} not found.` });
      return;
    }

    const updatedRecord = {
      ...items[idx],
      ...body,
      id,
      updated_at: now,
    };
    items[idx] = updatedRecord;
    writeJsonFile(jsonFilename, items);
    res.json({ [singular]: updatedRecord });
  });

  // Delete
  app.delete(`/api/admin/${resourcePath}/:id`, requireAdminAuth, async (req: Request, res: Response) => {
    const { id } = req.params;

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from(table).delete().eq("id", id);
      } catch (err) {
        console.warn(`Supabase ${table} delete error:`, err);
      }
    }

    const items = readJsonFile<Record<string, unknown>[]>(jsonFilename, defaultData);
    const filtered = items.filter((item) => String(item.id) !== String(id));
    writeJsonFile(jsonFilename, filtered);
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
  defaultData: DEFAULT_DEPARTMENTS,
});

registerAdminCrudRoutes({
  resourcePath: "books",
  table: "books",
  singular: "book",
  orderColumn: "created_at",
  ascending: false,
  requiredFields: ["title", "author"],
  defaultData: DEFAULT_BOOKS,
});

registerAdminCrudRoutes({
  resourcePath: "journals",
  table: "journals",
  singular: "journal",
  orderColumn: "created_at",
  ascending: false,
  requiredFields: ["title"],
  defaultData: DEFAULT_JOURNALS,
});

// --- DOCUMENT CONVERSION & UPLOAD (ANY FORMAT TO PDF) ---
const LIBRARY_BUCKET = "library-documents";

const uploadAnyDocument = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max
});

app.post(
  "/api/admin/upload-document",
  requireAdminAuth,
  uploadAnyDocument.single("document"),
  async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: "No document file provided." });
      return;
    }

    try {
      // Convert any file format (DOCX, TXT, images, etc.) to standard PDF
      const { pdfBuffer, extractedText } = await convertFileToPdf(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      const safeName = `doc-${Date.now()}-${crypto.randomBytes(6).toString("hex")}.pdf`;
      const sizeInMb = (pdfBuffer.length / (1024 * 1024)).toFixed(1);
      const cleanTitle = req.file.originalname.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").trim();

      if (supabaseAdmin) {
        try {
          const { error: uploadError } = await supabaseAdmin.storage
            .from(LIBRARY_BUCKET)
            .upload(safeName, pdfBuffer, {
              contentType: "application/pdf",
              upsert: false,
            });

          if (!uploadError) {
            const { data: publicUrlData } = supabaseAdmin.storage
              .from(LIBRARY_BUCKET)
              .getPublicUrl(safeName);

            res.json({
              success: true,
              url: publicUrlData.publicUrl,
              file_size: `${sizeInMb} MB`,
              original_name: req.file.originalname,
              suggested_title: cleanTitle,
              extracted_text: extractedText.slice(0, 2500),
            });
            return;
          }
          console.warn("Supabase document storage failed, using local disk:", uploadError);
        } catch (err) {
          console.warn("Supabase document storage threw error, using local disk:", err);
        }
      }

      const filePath = path.join(DOCS_UPLOADS_DIR, safeName);
      fs.writeFileSync(filePath, pdfBuffer);
      res.json({
        success: true,
        url: `/uploads/documents/${safeName}`,
        file_size: `${sizeInMb} MB`,
        original_name: req.file.originalname,
        suggested_title: cleanTitle,
        extracted_text: extractedText.slice(0, 2500),
      });
    } catch (err) {
      console.error("Document conversion or save failed:", err);
      res.status(500).json({ error: "Failed to convert and store document as PDF." });
    }
  }
);

// Batch multi-file document upload
app.post(
  "/api/admin/upload-documents",
  requireAdminAuth,
  uploadAnyDocument.array("documents", 25),
  async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: "No files provided for batch upload." });
      return;
    }

    try {
      const results = [];
      for (const file of files) {
        const { pdfBuffer, extractedText } = await convertFileToPdf(
          file.buffer,
          file.originalname,
          file.mimetype
        );

        const safeName = `doc-${Date.now()}-${crypto.randomBytes(6).toString("hex")}.pdf`;
        const sizeInMb = (pdfBuffer.length / (1024 * 1024)).toFixed(1);
        const cleanTitle = file.originalname.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").trim();

        let fileUrl = `/uploads/documents/${safeName}`;

        if (supabaseAdmin) {
          try {
            const { error: uploadError } = await supabaseAdmin.storage
              .from(LIBRARY_BUCKET)
              .upload(safeName, pdfBuffer, {
                contentType: "application/pdf",
                upsert: false,
              });

            if (!uploadError) {
              const { data: publicUrlData } = supabaseAdmin.storage
                .from(LIBRARY_BUCKET)
                .getPublicUrl(safeName);
              fileUrl = publicUrlData.publicUrl;
            }
          } catch (err) {
            console.warn("Supabase batch upload item warning:", err);
          }
        }

        if (!fileUrl.startsWith("http")) {
          const filePath = path.join(DOCS_UPLOADS_DIR, safeName);
          fs.writeFileSync(filePath, pdfBuffer);
        }

        // Generate preliminary auto-abstract
        const abstract = await generateAcademicAbstract({
          title: cleanTitle,
          excerpt: extractedText.slice(0, 1000),
        });

        results.push({
          url: fileUrl,
          file_size: `${sizeInMb} MB`,
          original_name: file.originalname,
          suggested_title: cleanTitle,
          abstract,
        });
      }

      res.json({ success: true, documents: results });
    } catch (err) {
      console.error("Batch document upload failed:", err);
      res.status(500).json({ error: "Batch document processing failed." });
    }
  }
);

// Auto-generate academic abstract endpoint
app.post(
  "/api/admin/generate-abstract",
  requireAdminAuth,
  async (req: Request, res: Response) => {
    try {
      const { title, author, department, excerpt, type } = req.body;
      const abstract = await generateAcademicAbstract({
        title: String(title || "Academic Research Publication"),
        author: author ? String(author) : undefined,
        department: department ? String(department) : undefined,
        excerpt: excerpt ? String(excerpt) : undefined,
        type: type === "journal" ? "journal" : "book",
      });
      res.json({ success: true, abstract });
    } catch (err) {
      console.error("Generate abstract error:", err);
      res.status(500).json({ error: "Failed to generate abstract." });
    }
  }
);

// Download document in PDF or DOCX format
app.get("/api/documents/download", async (req: Request, res: Response) => {
  try {
    const type = req.query.type === "journal" ? "journal" : "book";
    const id = String(req.query.id || "");
    const format = req.query.format === "docx" ? "docx" : "pdf";

    if (!id) {
      res.status(400).json({ error: "Missing document id." });
      return;
    }

    let item: Record<string, unknown> | null = null;
    let deptName = "Academic Department";

    // 1. Fetch record from Supabase or local files
    if (supabaseAdmin) {
      const table = type === "journal" ? "journals" : "books";
      const { data } = await supabaseAdmin.from(table).select("*").eq("id", id).maybeSingle();
      item = data as Record<string, unknown> | null;
    }

    if (!item) {
      const filePath = path.join(DATA_DIR, `${type}s.json`);
      if (fs.existsSync(filePath)) {
        const list = JSON.parse(fs.readFileSync(filePath, "utf-8")) as Array<Record<string, unknown>>;
        item = list.find((x) => String(x.id) === id) ?? null;
      }
    }

    if (!item) {
      res.status(404).json({ error: "Document not found." });
      return;
    }

    // Resolve department name
    if (item.department_id) {
      if (supabaseAdmin) {
        const { data: dept } = await supabaseAdmin.from("departments").select("name").eq("id", item.department_id).maybeSingle();
        if (dept?.name) deptName = dept.name;
      }
      if (deptName === "Academic Department") {
        const deptPath = path.join(DATA_DIR, "departments.json");
        if (fs.existsSync(deptPath)) {
          const depts = JSON.parse(fs.readFileSync(deptPath, "utf-8")) as Array<Record<string, unknown>>;
          const d = depts.find((x) => String(x.id) === String(item?.department_id));
          if (d?.name && typeof d.name === "string") deptName = d.name;
        }
      }
    }

    const safeTitle = String(item.title || "document").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60);

    // Format DOCX
    if (format === "docx") {
      const docxBuffer = await generateDocxDocument({
        title: item.title,
        author: item.author,
        publisher: item.publisher,
        departmentName: deptName,
        description: item.description,
        year: item.publication_year || item.publication_date,
        isbn: item.isbn,
        issn: item.issn,
        volume: item.volume,
        issue: item.issue,
        type: type,
      });

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.setHeader("Content-Disposition", `attachment; filename="${safeTitle}.docx"`);
      res.send(docxBuffer);
      return;
    }

    // Format PDF
    const isInline = req.query.inline === "true" || req.query.preview === "true";
    const pdfDisposition = isInline ? `inline; filename="${safeTitle}.pdf"` : `attachment; filename="${safeTitle}.pdf"`;

    const filePath = item.file_path;
    if (filePath && typeof filePath === "string" && filePath.startsWith("/uploads/")) {
      const localDiskPath = path.join(process.cwd(), "public", filePath);
      if (fs.existsSync(localDiskPath)) {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", pdfDisposition);
        if (isInline) res.setHeader("X-Frame-Options", "SAMEORIGIN");
        fs.createReadStream(localDiskPath).pipe(res);
        return;
      }
    }

    if (filePath && typeof filePath === "string" && filePath.startsWith("http")) {
      try {
        const fetchRes = await fetch(filePath);
        if (fetchRes.ok && fetchRes.body) {
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader("Content-Disposition", pdfDisposition);
          if (isInline) res.setHeader("X-Frame-Options", "SAMEORIGIN");
          const arrayBuffer = await fetchRes.arrayBuffer();
          res.send(Buffer.from(arrayBuffer));
          return;
        }
      } catch (e) {
        console.warn("Could not pipe remote PDF, falling back:", e);
      }
      res.redirect(filePath);
      return;
    }

    // Fallback: generate a PDF using convertFileToPdf
    const fallbackText = `${item.title}\n\nAuthor: ${item.author || item.publisher || "AFIT Faculty"}\nDepartment: ${deptName}\n\nAbstract:\n${item.description || "Institutional research paper archived at the Air Force Institute of Technology."}`;
    const { pdfBuffer } = await convertFileToPdf(Buffer.from(fallbackText), `${safeTitle}.txt`, "text/plain");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", pdfDisposition);
    if (isInline) res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Download document failed:", err);
    res.status(500).json({ error: "Failed to generate download file." });
  }
});

// --- PUBLIC ACCELERATED ENDPOINTS: DEPARTMENTS, BOOKS, JOURNALS ---
app.get("/api/departments", async (_req: Request, res: Response) => {
  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from("departments")
        .select("*")
        .eq("is_visible", true)
        .order("display_order", { ascending: true });

      if (!error && data && data.length > 0) {
        res.json({ departments: data });
        return;
      }
    } catch (err) {
      console.warn("Supabase public departments read error, using local fallback:", err);
    }
  }

  const localDepts = readJsonFile<Record<string, unknown>[]>("departments.json", DEFAULT_DEPARTMENTS);
  const visible = localDepts.filter((d) => d.is_visible !== false);
  res.json({ departments: visible });
});

app.get("/api/departments/:slug", async (req: Request, res: Response) => {
  const { slug } = req.params;
  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from("departments")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (!error && data) {
        res.json({ department: data });
        return;
      }
    } catch (err) {
      console.warn("Supabase public department slug read error, using local fallback:", err);
    }
  }

  const localDepts = readJsonFile<Record<string, unknown>[]>("departments.json", DEFAULT_DEPARTMENTS);
  const found = localDepts.find((d) => d.slug === slug);
  if (found) {
    res.json({ department: found });
  } else {
    res.status(404).json({ error: "Department not found" });
  }
});

app.get("/api/books", async (req: Request, res: Response) => {
  const departmentId = typeof req.query.department_id === "string" ? req.query.department_id : null;

  if (supabaseAdmin) {
    try {
      let query = supabaseAdmin
        .from("books")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (departmentId) {
        query = query.eq("department_id", departmentId);
      }

      const { data, error } = await query;
      if (!error && data) {
        res.json({ books: data });
        return;
      }
    } catch (err) {
      console.warn("Supabase public books read error, using local fallback:", err);
    }
  }

  const localBooks = readJsonFile<Record<string, unknown>[]>("books.json", DEFAULT_BOOKS);
  let result = localBooks.filter((b) => b.status !== "draft");
  if (departmentId) {
    result = result.filter((b) => String(b.department_id) === departmentId);
  }
  res.json({ books: result });
});

app.get("/api/journals", async (req: Request, res: Response) => {
  const departmentId = typeof req.query.department_id === "string" ? req.query.department_id : null;

  if (supabaseAdmin) {
    try {
      let query = supabaseAdmin
        .from("journals")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (departmentId) {
        query = query.eq("department_id", departmentId);
      }

      const { data, error } = await query;
      if (!error && data) {
        res.json({ journals: data });
        return;
      }
    } catch (err) {
      console.warn("Supabase public journals read error, using local fallback:", err);
    }
  }

  const localJournals = readJsonFile<Record<string, unknown>[]>("journals.json", DEFAULT_JOURNALS);
  let result = localJournals.filter((j) => j.status !== "draft");
  if (departmentId) {
    result = result.filter((j) => String(j.department_id) === departmentId);
  }
  res.json({ journals: result });
});


// --- INSTITUTIONAL STATS ---
app.get("/api/stats", async (_req: Request, res: Response) => {
  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from("institutional_stats")
        .select("total_students, academic_resources, active_departments, research_citations")
        .eq("id", true)
        .maybeSingle();

      if (!error && data) {
        res.json({
          totalStudents: data.total_students,
          academicResources: data.academic_resources,
          activeDepartments: data.active_departments,
          researchCitations: data.research_citations,
        });
        return;
      }
    } catch {
      // Fallback to local
    }
  }

  const stats = readJsonFile<StatsResponse>("institutional_stats.json", DEFAULT_STATS);
  res.json(stats);
});

app.put("/api/admin/stats", requireAdminAuth, async (req: Request, res: Response) => {
  const { totalStudents, academicResources, activeDepartments, researchCitations } = req.body || {};

  const updated: StatsResponse = {
    totalStudents: totalStudents || DEFAULT_STATS.totalStudents,
    academicResources: academicResources || DEFAULT_STATS.academicResources,
    activeDepartments: activeDepartments || DEFAULT_STATS.activeDepartments,
    researchCitations: researchCitations || DEFAULT_STATS.researchCitations,
  };

  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from("institutional_stats")
        .upsert({
          id: true,
          total_students: updated.totalStudents,
          academic_resources: updated.academicResources,
          active_departments: updated.activeDepartments,
          research_citations: updated.researchCitations,
        })
        .select()
        .single();

      if (!error && data) {
        writeJsonFile("institutional_stats.json", updated);
        res.json(updated);
        return;
      }
    } catch (err) {
      console.warn("Failed to update stats in Supabase, updating locally:", err);
    }
  }

  writeJsonFile("institutional_stats.json", updated);
  res.json(updated);
});

// --- CAROUSEL ---
const CAROUSEL_BUCKET = "carousel-images";

interface CarouselSlideRecord {
  id: string;
  title: string;
  description: string;
  image_url: string;
  cta_text?: string | null;
  cta_url?: string | null;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Public — only active slides, ordered
app.get("/api/carousel", async (_req: Request, res: Response) => {
  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from("carousel_slides")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (!error && data && data.length > 0) {
        res.json({ slides: data });
        return;
      }
    } catch (err) {
      console.warn("Supabase carousel read error, using local data:", err);
    }
  }

  const slides = readJsonFile<CarouselSlideRecord[]>("carousel_slides.json", DEFAULT_SLIDES);
  const activeSlides = slides
    .filter((s) => s.is_active)
    .sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0));
  res.json({ slides: activeSlides });
});

// Admin — all slides, ordered
app.get("/api/admin/carousel", requireAdminAuth, async (_req: Request, res: Response) => {
  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from("carousel_slides")
        .select("*")
        .order("display_order", { ascending: true });

      if (!error && data && data.length > 0) {
        res.json({ slides: data });
        return;
      }
    } catch (err) {
      console.warn("Supabase admin carousel read error, using local data:", err);
    }
  }

  const slides = readJsonFile<CarouselSlideRecord[]>("carousel_slides.json", DEFAULT_SLIDES);
  slides.sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0));
  res.json({ slides });
});

app.post("/api/admin/carousel", requireAdminAuth, async (req: Request, res: Response) => {
  const { title, description, image_url, cta_text, cta_url, display_order, is_active } = req.body || {};

  if (!title || !description || !image_url) {
    res.status(400).json({ error: "Title, description, and image URL are required." });
    return;
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const newSlide: CarouselSlideRecord = {
    id,
    title: String(title).trim(),
    description: String(description).trim(),
    image_url: String(image_url).trim(),
    cta_text: cta_text ? String(cta_text).trim() : null,
    cta_url: cta_url ? String(cta_url).trim() : null,
    display_order: Number(display_order) || 0,
    is_active: is_active !== false,
    created_at: now,
    updated_at: now,
  };

  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from("carousel_slides")
        .insert(newSlide)
        .select()
        .single();

      if (!error && data) {
        const slides = readJsonFile<CarouselSlideRecord[]>("carousel_slides.json", DEFAULT_SLIDES);
        slides.push(data);
        writeJsonFile("carousel_slides.json", slides);
        res.status(201).json({ success: true, slide: data });
        return;
      }
    } catch (err) {
      console.warn("Supabase carousel create error, saving locally:", err);
    }
  }

  const slides = readJsonFile<CarouselSlideRecord[]>("carousel_slides.json", DEFAULT_SLIDES);
  slides.push(newSlide);
  writeJsonFile("carousel_slides.json", slides);
  res.status(201).json({ success: true, slide: newSlide });
});

app.put("/api/admin/carousel/:id", requireAdminAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, image_url, cta_text, cta_url, display_order, is_active } = req.body || {};
  const now = new Date().toISOString();

  const updatePayload: Record<string, unknown> = { updated_at: now };
  if (title !== undefined) updatePayload.title = String(title).trim();
  if (description !== undefined) updatePayload.description = String(description).trim();
  if (image_url !== undefined) updatePayload.image_url = String(image_url).trim();
  if (cta_text !== undefined) updatePayload.cta_text = cta_text ? String(cta_text).trim() : null;
  if (cta_url !== undefined) updatePayload.cta_url = cta_url ? String(cta_url).trim() : null;
  if (display_order !== undefined) updatePayload.display_order = Number(display_order);
  if (is_active !== undefined) updatePayload.is_active = Boolean(is_active);

  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from("carousel_slides")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();

      if (!error && data) {
        const slides = readJsonFile<CarouselSlideRecord[]>("carousel_slides.json", DEFAULT_SLIDES);
        const idx = slides.findIndex((s) => String(s.id) === String(id));
        if (idx !== -1) slides[idx] = data;
        writeJsonFile("carousel_slides.json", slides);
        res.json({ success: true, slide: data });
        return;
      }
    } catch (err) {
      console.warn("Supabase carousel update error, updating locally:", err);
    }
  }

  const slides = readJsonFile<CarouselSlideRecord[]>("carousel_slides.json", DEFAULT_SLIDES);
  const idx = slides.findIndex((s) => String(s.id) === String(id));
  if (idx === -1) {
    res.status(404).json({ error: "Slide not found." });
    return;
  }

  const updatedSlide = {
    ...slides[idx],
    ...updatePayload,
    id,
  };
  slides[idx] = updatedSlide;
  writeJsonFile("carousel_slides.json", slides);
  res.json({ success: true, slide: updatedSlide });
});

app.delete("/api/admin/carousel/:id", requireAdminAuth, async (req: Request, res: Response) => {
  const { id } = req.params;

  if (supabaseAdmin) {
    try {
      await supabaseAdmin.from("carousel_slides").delete().eq("id", id);
    } catch (err) {
      console.warn("Supabase carousel delete error:", err);
    }
  }

  const slides = readJsonFile<CarouselSlideRecord[]>("carousel_slides.json", DEFAULT_SLIDES);
  const filtered = slides.filter((s) => String(s.id) !== String(id));
  writeJsonFile("carousel_slides.json", filtered);
  res.json({ success: true, message: "Slide deleted successfully." });
});

// Institutional image upload (carousel covers, department backgrounds, resource covers)
const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
    const mime = file.mimetype.toLowerCase();
    const isImage = mime.startsWith("image/") || /jpeg|jpg|png|webp|avif|gif|svg|bmp|tiff|tif|heic|heif|ico/.test(ext);
    if (isImage) {
      cb(null, true);
    } else {
      cb(new Error("Please upload a valid image file."));
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

    if (supabaseAdmin) {
      try {
        const { error: uploadError } = await supabaseAdmin.storage
          .from(CAROUSEL_BUCKET)
          .upload(safeName, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: false,
          });

        if (!uploadError) {
          const { data: publicUrlData } = supabaseAdmin.storage
            .from(CAROUSEL_BUCKET)
            .getPublicUrl(safeName);

          res.json({
            success: true,
            url: publicUrlData.publicUrl,
            filename: safeName,
            size: req.file.size
          });
          return;
        }
        console.warn("Supabase image storage failed, using local disk:", uploadError);
      } catch (err) {
        console.warn("Supabase image storage threw error, using local disk:", err);
      }
    }

    try {
      const filePath = path.join(CAROUSEL_UPLOADS_DIR, safeName);
      fs.writeFileSync(filePath, req.file.buffer);
      res.json({
        success: true,
        url: `/uploads/carousel/${safeName}`,
        filename: safeName,
        size: req.file.size
      });
    } catch (err) {
      console.error("Local image save failed:", err);
      res.status(500).json({ error: "Failed to store image file." });
    }
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
