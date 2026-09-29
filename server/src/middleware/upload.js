import multer from "multer";

/**
 * In-memory file storage — files are piped directly to Cloudinary
 * without touching disk. Limits:
 *   - 1 file per request, field name "image"
 *   - 5 MB max
 *   - image/* only
 */
const storage = multer.memoryStorage();

export const uploadListingImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"), false);
    }
    cb(null, true);
  },
}).single("image");
