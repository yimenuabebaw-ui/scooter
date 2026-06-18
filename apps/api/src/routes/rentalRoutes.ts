import { Router } from "express";
import {
  completeRental,
  clearHistoryByDateRange,
  deleteCompletedRentalIds,
  deleteHistoryRental,
  createRental,
  listActiveRentals,
  listRentalHistory,
  pauseRental,
  resumeRental,
  streamRentalDocument
} from "../controllers/rentalController";
import { asyncHandler } from "../middleware/asyncHandler";
import { uploadNationalIds } from "../middleware/upload";

export const rentalRouter = Router();

rentalRouter.get("/active", asyncHandler(listActiveRentals));
rentalRouter.get("/history", asyncHandler(listRentalHistory));
rentalRouter.delete("/history", asyncHandler(clearHistoryByDateRange));
rentalRouter.delete("/history/ids", asyncHandler(deleteCompletedRentalIds));
rentalRouter.delete("/history/:id", asyncHandler(deleteHistoryRental));
rentalRouter.get("/:id/documents/front", asyncHandler(streamRentalDocument));
rentalRouter.post(
  "/",
  uploadNationalIds.fields([
    { name: "frontImage", maxCount: 1 }
  ]),
  asyncHandler(createRental)
);
rentalRouter.patch("/:id/pause", asyncHandler(pauseRental));
rentalRouter.patch("/:id/resume", asyncHandler(resumeRental));
rentalRouter.patch("/:id/complete", asyncHandler(completeRental));
