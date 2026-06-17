import { config } from "dotenv";
import path from "path";

config();

const apiRoot = path.resolve(__dirname, "..", "..");

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  mongoUri: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/scooter_rental_admin",
  jwtSecret: process.env.JWT_SECRET ?? "replace-with-a-long-random-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "1d",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  adminUsername: process.env.ADMIN_USERNAME ?? "admin",
  adminEmail: process.env.ADMIN_EMAIL ?? "admin@example.com",
  adminPassword: process.env.ADMIN_PASSWORD ?? "ChangeMe123!",
  uploadDir: path.join(apiRoot, "uploads", "ids")
};
