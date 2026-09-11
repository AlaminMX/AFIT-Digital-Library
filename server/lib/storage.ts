import path from "path";
import fs from "fs";

export const DATA_DIR = path.join(process.cwd(), "data");
export const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
export const CAROUSEL_UPLOADS_DIR = path.join(UPLOADS_DIR, "carousel");
export const DOCS_UPLOADS_DIR = path.join(UPLOADS_DIR, "documents");

export function ensureStorageDirs(): void {
  [DATA_DIR, UPLOADS_DIR, CAROUSEL_UPLOADS_DIR, DOCS_UPLOADS_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// --- FILE STORAGE HELPERS ---
// These back the local-disk fallback used whenever Supabase is not configured
// or a Supabase call fails, so the site keeps working either way.
export function readJsonFile<T>(filename: string, fallback: T): T {
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

export function writeJsonFile<T>(filename: string, data: T): void {
  const filePath = path.join(DATA_DIR, filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`Error writing ${filename}:`, err);
  }
}
