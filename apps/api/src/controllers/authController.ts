import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { z } from "zod";
import { Admin } from "../models/Admin";
import { badRequest, unauthorized } from "../utils/http";
import { signAdminToken } from "../utils/jwt";

const loginSchema = z.object({
  login: z.string().min(1),
  password: z.string().min(1)
});

export const loginAdmin = async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    throw badRequest("Invalid login payload", parsed.error.flatten());
  }

  const { login, password } = parsed.data;
  const admin = await Admin.findOne({
    $or: [{ email: login.toLowerCase() }, { username: login }]
  });

  if (!admin) {
    throw unauthorized("Invalid credentials");
  }

  const isMatch = await bcrypt.compare(password, admin.passwordHash);

  if (!isMatch) {
    throw unauthorized("Invalid credentials");
  }

  const token = signAdminToken({
    adminId: admin._id.toString(),
    email: admin.email,
    username: admin.username
  });

  res.json({
    token,
    admin: {
      id: admin._id,
      username: admin.username,
      email: admin.email
    }
  });
};
