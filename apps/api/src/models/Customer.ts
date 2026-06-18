import mongoose, { InferSchemaType, Model } from "mongoose";

const nationalIdImageSchema = new mongoose.Schema(
  {
    data: {
      type: Buffer,
      required: true
    },
    contentType: {
      type: String,
      required: true
    },
    filename: {
      type: String,
      required: true
    }
  },
  {
    _id: false
  }
);

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
      type: nationalIdImageSchema,
      default: null
    }
  },
  {
    timestamps: true
  }
);

customerSchema.index({ phone: 1 });

export type CustomerDocument = InferSchemaType<typeof customerSchema> & { _id: mongoose.Types.ObjectId };

export const Customer = (mongoose.models.Customer as Model<CustomerDocument>) || mongoose.model("Customer", customerSchema);
