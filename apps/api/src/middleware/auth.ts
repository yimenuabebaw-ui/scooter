import { NextFunction, Request, Response } from "express";
import { unauthorized } from "../utils/http";
import { verifyAdminToken } from "../utils/jwt";

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return next(unauthorized("Missing bearer token"));
  }

  try {
    const token = header.slice("Bearer ".length);
    const payload = verifyAdminToken(token);
    req.admin = {
      id: payload.adminId,
      email: payload.email,
      username: payload.username
    };
    return next();
  } catch {
    return next(unauthorized("Invalid or expired token"));
  }
};
