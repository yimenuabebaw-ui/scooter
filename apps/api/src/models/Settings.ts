import mongoose, { InferSchemaType, Model } from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    baseFee: {
      type: Number,
      required: true,
      default: 30
    },
    pricePerMinute: {
      type: Number,
      required: true,
      default: 8
    }
  },
  {
    timestamps: true
  }
);

export type SettingsDocument = InferSchemaType<typeof settingsSchema> & { _id: mongoose.Types.ObjectId };

export const Settings = (mongoose.models.Settings as Model<SettingsDocument>) || mongoose.model("Settings", settingsSchema);
