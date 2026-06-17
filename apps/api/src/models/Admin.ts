import mongoose, { InferSchemaType, Model } from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

export type AdminDocument = InferSchemaType<typeof adminSchema> & { _id: mongoose.Types.ObjectId };

export const Admin = (mongoose.models.Admin as Model<AdminDocument>) || mongoose.model("Admin", adminSchema);
