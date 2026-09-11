import express, { type Request, type Response } from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { createServer as createViteServer } from "vite";

import { ensureStorageDirs, UPLOADS_DIR, readJsonFile } from "./server/lib/storage";
import { getAdminSecret } from "./server/lib/auth";
import {
  DEFAULT_DEPARTMENTS,
  DEFAULT_BOOKS,
  DEFAULT_JOURNALS,
  DEFAULT_SLIDES,
  DEFAULT_STATS,
} from "./server/lib/seed-data";

import authRoutes from "./server/routes/auth";
import adminResourceRoutes from "./server/routes/admin-resources";
import documentRoutes from "./server/routes/documents";
import publicRoutes from "./server/routes/public";
import statsRoutes from "./server/routes/stats";
import carouselRoutes from "./server/routes/carousel";

// Fail fast if ADMIN_PASSWORD isn't set, rather than silently falling back
// to a hardcoded default admin password. See server/lib/auth.ts.
try {
  getAdminSecret();
} catch (err) {
  console.error((err as Error).message);
  process.exit(1);
}

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(cookieParser());

// Ensure upload/data directories exist and serve uploaded files statically
ensureStorageDirs();
app.use("/uploads", express.static(UPLOADS_DIR));

// Initialize local JSON fallback files if missing
readJsonFile("departments.json", DEFAULT_DEPARTMENTS);
readJsonFile("books.json", DEFAULT_BOOKS);
readJsonFile("journals.json", DEFAULT_JOURNALS);
readJsonFile("carousel_slides.json", DEFAULT_SLIDES);
readJsonFile("institutional_stats.json", DEFAULT_STATS);

// --- ROUTES ---
app.use(authRoutes);
app.use(adminResourceRoutes);
app.use(documentRoutes);
app.use(publicRoutes);
app.use(statsRoutes);
app.use(carouselRoutes);

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
