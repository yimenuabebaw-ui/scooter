import mongoose, { InferSchemaType, Model } from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    nationalIdFrontImage: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

customerSchema.index({ phone: 1 });

export type CustomerDocument = InferSchemaType<typeof customerSchema> & { _id: mongoose.Types.ObjectId };

export const Customer = (mongoose.models.Customer as Model<CustomerDocument>) || mongoose.model("Customer", customerSchema);
