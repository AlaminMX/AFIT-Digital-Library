import express, { type Request, type Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { supabaseAdmin } from "../lib/supabase";
import { requireAdminAuth } from "../lib/auth";
import { readJsonFile, writeJsonFile, CAROUSEL_UPLOADS_DIR } from "../lib/storage";
import { DEFAULT_SLIDES, type CarouselSlideRecord } from "../lib/seed-data";

const router = express.Router();

// --- CAROUSEL ---
const CAROUSEL_BUCKET = "carousel-images";

// Public — only active slides, ordered
router.get("/api/carousel", async (_req: Request, res: Response) => {
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
router.get("/api/admin/carousel", requireAdminAuth, async (_req: Request, res: Response) => {
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

router.post("/api/admin/carousel", requireAdminAuth, async (req: Request, res: Response) => {
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

router.put("/api/admin/carousel/:id", requireAdminAuth, async (req: Request, res: Response) => {
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

router.delete("/api/admin/carousel/:id", requireAdminAuth, async (req: Request, res: Response) => {
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

router.post(
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

export default router;
