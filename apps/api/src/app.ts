import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { apiRouter } from "./routes";
import { connectDatabase } from "./config/db";
import { seedDefaults } from "./services/bootstrap";


export const app = express();

app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Database initialization for Vercel
let isInitialized = false;
app.use(async (_req, _res, next) => {
  if (!isInitialized) {
    try {
      await connectDatabase();
      await seedDefaults();
      isInitialized = true;
    } catch (error) {
      console.error("Database initialization failed:", error);
    }
  }
  next();
});

app.use("/api", apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
