import { Request, Response } from "express";
import { z } from "zod";
import { badRequest } from "../utils/http";
import { getOrCreateSettings } from "../services/settingsService";

const settingsSchema = z.object({
  baseFee: z.number().nonnegative(),
  pricePerMinute: z.number().nonnegative()
});

export const getSettings = async (_req: Request, res: Response) => {
  const settings = await getOrCreateSettings();
  res.json(settings);
};

export const updateSettings = async (req: Request, res: Response) => {
  const parsed = settingsSchema.safeParse(req.body);

  if (!parsed.success) {
    throw badRequest("Invalid settings payload", parsed.error.flatten());
  }

  const settings = await getOrCreateSettings();
  settings.baseFee = parsed.data.baseFee;
  settings.pricePerMinute = parsed.data.pricePerMinute;
  await settings.save();

  res.json(settings);
};
