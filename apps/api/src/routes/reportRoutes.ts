import { Router } from "express";
import { exportRevenueReport, getRevenueReport } from "../controllers/reportController";
import { asyncHandler } from "../middleware/asyncHandler";

export const reportRouter = Router();

reportRouter.get("/", asyncHandler(getRevenueReport));
reportRouter.get("/export", asyncHandler(exportRevenueReport));
