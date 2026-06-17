import bcrypt from "bcryptjs";
import { env } from "../config/env";
import { Admin } from "../models/Admin";
import { getOrCreateSettings } from "./settingsService";

export const seedDefaults = async () => {
  await getOrCreateSettings();

  const adminCount = await Admin.countDocuments();

  if (adminCount === 0) {
    const passwordHash = await bcrypt.hash(env.adminPassword, 12);
    await Admin.create({
      username: env.adminUsername,
      email: env.adminEmail,
      passwordHash
    });
  }
};
