import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { loginAdmin } from "../controllers/authController";

export const authRouter = Router();

authRouter.post("/login", asyncHandler(loginAdmin));
