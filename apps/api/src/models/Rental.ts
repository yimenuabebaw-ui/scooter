import mongoose, { InferSchemaType, Model } from "mongoose";

export const rentalStatuses = ["active", "completed"] as const;

const rentalSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true
    },
    scooterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scooter",
      required: true
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now
    },
    endTime: {
      type: Date
    },
    durationMinutes: {
      type: Number,
      default: 0
    },
    baseFee: {
      type: Number,
      required: true
    },
    pricePerMinute: {
      type: Number,
      required: true
    },
    totalPrice: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: rentalStatuses,
      default: "active"
    },
    pauseStartedAt: {
      type: Date
    },
    pausedDurationMs: {
      type: Number,
      default: 0
    },
    paymentVerifiedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

rentalSchema.index({ status: 1, startTime: -1 });
rentalSchema.index({ endTime: -1 });

export type RentalDocument = InferSchemaType<typeof rentalSchema> & { _id: mongoose.Types.ObjectId };

export const Rental = (mongoose.models.Rental as Model<RentalDocument>) || mongoose.model("Rental", rentalSchema);
