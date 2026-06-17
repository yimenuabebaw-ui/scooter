import { Router } from "express";
import { createScooter, deleteScooter, listScooters, updateScooter } from "../controllers/scooterController";
import { asyncHandler } from "../middleware/asyncHandler";

export const scooterRouter = Router();

scooterRouter.get("/", asyncHandler(listScooters));
scooterRouter.post("/", asyncHandler(createScooter));
scooterRouter.patch("/:id", asyncHandler(updateScooter));
scooterRouter.delete("/:id", asyncHandler(deleteScooter));
