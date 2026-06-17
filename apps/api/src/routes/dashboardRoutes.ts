import { Router } from "express";
import { getDashboardMetrics } from "../controllers/dashboardController";
import { asyncHandler } from "../middleware/asyncHandler";

export const dashboardRouter = Router();

dashboardRouter.get("/metrics", asyncHandler(getDashboardMetrics));
