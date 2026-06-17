import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/http";

export const notFoundHandler = (_req: Request, _res: Response, next: NextFunction) => {
  next(new ApiError(404, "Route not found"));
};

export const errorHandler = (error: Error | ApiError, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = error instanceof ApiError ? error.statusCode : 500;
  const details = error instanceof ApiError ? error.details : undefined;

  res.status(statusCode).json({
    message: error.message || "Something went wrong",
    details
  });
};
