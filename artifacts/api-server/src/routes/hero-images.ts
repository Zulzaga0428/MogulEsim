import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import { db, heroSlidesTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { uploadImageFromBuffer, deleteImage } from "../lib/cloudflare-images.js";
import { requireAdmin } from "../lib/admin.js";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.get("/hero-slides", async (_req: Request, res: Response) => {
  try {
    const slides = await db
      .select()
      .from(heroSlidesTable)
      .where(eq(heroSlidesTable.active, true))
      .orderBy(asc(heroSlidesTable.sortOrder));
    res.json({ slides });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch hero slides" });
  }
});

router.post("/admin/hero-images/upload", upload.single("image"), async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    const result = await uploadImageFromBuffer(file.buffer, file.originalname, file.mimetype);

    const existingSlides = await db.select().from(heroSlidesTable).orderBy(asc(heroSlidesTable.sortOrder));
    const maxOrder = existingSlides.length > 0 ? Math.max(...existingSlides.map(s => s.sortOrder)) : -1;

    const [slide] = await db.insert(heroSlidesTable).values({
      cloudflareId: result.id,
      url: result.url,
      altText: (req.body.altText as string) || file.originalname,
      sortOrder: maxOrder + 1,
      active: true,
    }).returning();

    res.status(201).json({ slide });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Upload failed" });
  }
});

router.delete("/admin/hero-images/:id", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const id = parseInt(String(req.params.id));
    const [slide] = await db.select().from(heroSlidesTable).where(eq(heroSlidesTable.id, id));
    if (!slide) {
      res.status(404).json({ error: "Slide not found" });
      return;
    }
    await deleteImage(slide.cloudflareId);
    await db.delete(heroSlidesTable).where(eq(heroSlidesTable.id, id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Delete failed" });
  }
});

router.get("/admin/hero-images", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const slides = await db.select().from(heroSlidesTable).orderBy(asc(heroSlidesTable.sortOrder));
    res.json({ slides });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch slides" });
  }
});

export default router;
