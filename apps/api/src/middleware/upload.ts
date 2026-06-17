import fs from "fs";
import multer from "multer";
import path from "path";
import { env } from "../config/env";
import { badRequest } from "../utils/http";

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/pdf"
]);

if (!fs.existsSync(env.uploadDir)) {
  fs.mkdirSync(env.uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, env.uploadDir);
  },
  filename: (_req, file, callback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "-");
    callback(null, `${Date.now()}-${base}${ext}`);
  }
});

export const uploadNationalIds = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(badRequest("Unsupported file format. Use JPG, JPEG, PNG, or PDF."));
      return;
    }

    callback(null, true);
  }
});
