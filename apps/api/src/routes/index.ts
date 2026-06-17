import { Router } from "express";
import { authRouter } from "./authRoutes";
import { dashboardRouter } from "./dashboardRoutes";
import { rentalRouter } from "./rentalRoutes";
import { reportRouter } from "./reportRoutes";
import { scooterRouter } from "./scooterRoutes";
import { settingsRouter } from "./settingsRoutes";
import { requireAuth } from "../middleware/auth";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use(requireAuth);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/scooters", scooterRouter);
apiRouter.use("/rentals", rentalRouter);
apiRouter.use("/settings", settingsRouter);
apiRouter.use("/reports", reportRouter);
