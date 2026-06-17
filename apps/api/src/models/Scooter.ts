import mongoose, { InferSchemaType, Model } from "mongoose";

export const scooterStatuses = ["available", "rented", "maintenance"] as const;

const scooterSchema = new mongoose.Schema(
  {
    scooterNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    model: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: scooterStatuses,
      default: "available"
    },
    notes: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

export type ScooterDocument = InferSchemaType<typeof scooterSchema> & { _id: mongoose.Types.ObjectId };

export const Scooter = (mongoose.models.Scooter as Model<ScooterDocument>) || mongoose.model("Scooter", scooterSchema);
