import { Settings } from "../models/Settings";

export const getOrCreateSettings = async () => {
  let settings = await Settings.findOne().sort({ createdAt: 1 });

  if (!settings) {
    settings = await Settings.create({
      baseFee: 30,
      pricePerMinute: 8
    });
  }

  return settings;
};
