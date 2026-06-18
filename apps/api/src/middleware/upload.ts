import multer from "multer";
import { badRequest } from "../utils/http";

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/pdf"
]);

export const uploadNationalIds = multer({
  storage: multer.memoryStorage(),
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
