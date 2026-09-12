import express, { type Request, type Response } from "express";
import cookieParser from "cookie-parser";

import authRoutes from "../server/routes/auth.js";
import adminResourceRoutes from "../server/routes/admin-resources.js";
import documentRoutes from "../server/routes/documents.js";
import publicRoutes from "../server/routes/public.js";
import statsRoutes from "../server/routes/stats.js";
import carouselRoutes from "../server/routes/carousel.js";

// --- VERCEL SERVERLESS ENTRYPOINT ---
// This file is what actually runs on Vercel. It replaces server.ts for
// production: server.ts's app.listen()/Vite-middleware pattern is for a
// persistent Node process (local dev, or a non-serverless host) and never
// runs on Vercel at all unless something points at it, which is exactly
// why /api/* was 404ing before this file existed — there was no
// serverless function registered for it.
//
// Deliberately NOT done here, unlike server.ts:
//   - ensureStorageDirs() / seeding local JSON fallback files. Vercel's
//     function filesystem is READ-ONLY outside of /tmp. Those calls use
//     bare fs.mkdirSync/fs.writeFileSync with no try/catch, so running
//     them here would throw on cold start and 500 every single request.
//     Every route in this app already checks Supabase first and only
//     touches local disk as a guarded, try/catch-wrapped fallback, so
//     skipping the eager setup is safe as long as Supabase env vars are
//     actually set (see chat notes on required env vars).
//   - app.listen(). Vercel calls the exported handler directly per
//     request; binding a port here does nothing useful and isn't the
//     serverless contract.
//   - Static file / SPA serving. That's handled by Vercel's static
//     hosting + the rewrites in vercel.json, not by this function.

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(authRoutes);
app.use(adminResourceRoutes);
app.use(documentRoutes);
app.use(publicRoutes);
app.use(statsRoutes);
app.use(carouselRoutes);

// Anything under /api/* that didn't match a route above — return JSON,
// not Vercel's default HTML 404 page (which is what was breaking the
// frontend's res.json() parsing and surfacing as "Connection error").
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `No API route for ${req.method} ${req.path}` });
});

// Vercel's Node runtime invokes an Express app instance directly as the
// request handler (it matches the (req, res) signature it expects).
export default app;
