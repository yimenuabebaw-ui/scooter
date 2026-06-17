import jwt from "jsonwebtoken";
import { env } from "../config/env";

type JwtPayload = {
  adminId: string;
  email: string;
  username: string;
};

export const signAdminToken = (payload: JwtPayload) =>
  jwt.sign(payload, env.jwtSecret as jwt.Secret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"]
  });

export const verifyAdminToken = (token: string) =>
  jwt.verify(token, env.jwtSecret) as JwtPayload;
