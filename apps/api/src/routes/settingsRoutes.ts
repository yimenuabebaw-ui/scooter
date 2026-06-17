import { Router } from "express";
import { getSettings, updateSettings } from "../controllers/settingsController";
import { asyncHandler } from "../middleware/asyncHandler";

export const settingsRouter = Router();

settingsRouter.get("/", asyncHandler(getSettings));
settingsRouter.put("/", asyncHandler(updateSettings));
