import express, { type Request, type Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { supabaseAdmin } from "../lib/supabase";
import { requireAdminAuth } from "../lib/auth";
import { DATA_DIR, DOCS_UPLOADS_DIR } from "../lib/storage";
import { convertFileToPdf, generateDocxDocument, generateAcademicAbstract } from "../document-service";

const router = express.Router();

// --- DOCUMENT CONVERSION & UPLOAD (ANY FORMAT TO PDF) ---
const LIBRARY_BUCKET = "library-documents";

const uploadAnyDocument = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max
});

router.post(
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
router.post(
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
router.post(
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
router.get("/api/documents/download", async (req: Request, res: Response) => {
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

export default router;
