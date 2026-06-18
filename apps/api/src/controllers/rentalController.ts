import fs from "fs";
import path from "path";
import { Request, Response } from "express";
import { PipelineStage } from "mongoose";
import { z } from "zod";
import { Customer } from "../models/Customer";
import { Rental } from "../models/Rental";
import { Scooter } from "../models/Scooter";
import { env } from "../config/env";
import { calculateDurationMinutes, calculateTotalPrice } from "../services/pricing";
import { getOrCreateSettings } from "../services/settingsService";
import { badRequest, notFound } from "../utils/http";

const createRentalSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().min(1),
  scooterId: z.string().min(1)
});

const paymentSchema = z.object({
  paymentVerified: z.boolean()
});

const historyQuerySchema = z.object({
  customerName: z.string().optional(),
  phoneNumber: z.string().optional(),
  scooterNumber: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.string().optional(),
  order: z.enum(["asc", "desc"]).optional()
});

const clearHistorySchema = z.object({
  startDate: z.string().min(1),
  endDate: z.string().min(1)
});

type RentalSnapshot = {
  _id: { toString(): string };
  status: "active" | "completed";
  startTime: Date;
  endTime?: Date | null;
  durationMinutes: number;
  baseFee: number;
  pricePerMinute: number;
  totalPrice: number;
  pauseStartedAt?: Date | null;
  pausedDurationMs: number;
  paymentVerifiedAt?: Date | null;
  customerId: {
    fullName: string;
    phone: string;
    nationalIdFrontImage: string;
  };
  scooterId: {
    scooterNumber: string;
    model: string;
    status: string;
  };
};

const serializeRental = (rental: RentalSnapshot | null) => {
  if (!rental) {
    return null;
  }

  const durationMinutes =
    rental.status === "completed"
      ? rental.durationMinutes
      : calculateDurationMinutes({
          startTime: rental.startTime,
          pausedDurationMs: rental.pausedDurationMs,
          pauseStartedAt: rental.pauseStartedAt
        });

  const totalPrice =
    rental.status === "completed"
      ? rental.totalPrice
      : calculateTotalPrice(rental.baseFee, rental.pricePerMinute, durationMinutes);

  return {
    id: rental._id.toString(),
    customer: rental.customerId,
    scooter: rental.scooterId,
    startTime: rental.startTime,
    endTime: rental.endTime,
    durationMinutes,
    baseFee: rental.baseFee,
    pricePerMinute: rental.pricePerMinute,
    totalPrice,
    status: rental.status,
    pauseStartedAt: rental.pauseStartedAt,
    pausedDurationMs: rental.pausedDurationMs,
    paymentVerifiedAt: rental.paymentVerifiedAt
  };
};

const loadRentalById = async (id: string) =>
  (await Rental.findById(id).populate("customerId").populate("scooterId", "scooterNumber model status")) as RentalSnapshot | null;

const cleanupCustomerFrontIdIfUnused = async (customerId: string) => {
  const customer = await Customer.findById(customerId);

  if (!customer?.nationalIdFrontImage) {
    return;
  }

  const hasRemainingRental = await Rental.exists({
    customerId,
    status: "completed"
  });

  if (hasRemainingRental) {
    return;
  }

  const absolutePath = path.join(env.uploadDir, customer.nationalIdFrontImage);

  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }

  customer.nationalIdFrontImage = "";
  await customer.save();
};

export const createRental = async (req: Request, res: Response) => {
  const parsed = createRentalSchema.safeParse(req.body);

  if (!parsed.success) {
    throw badRequest("Invalid rental payload", parsed.error.flatten());
  }

  const files = req.files as
    | {
        frontImage?: Express.Multer.File[];
      }
    | undefined;

  const frontImage = files?.frontImage?.[0];

  if (!frontImage) {
    throw badRequest("Front national ID image is required");
  }

  const scooter = await Scooter.findById(parsed.data.scooterId);

  if (!scooter) {
    throw notFound("Scooter not found");
  }

  if (scooter.status !== "available") {
    throw badRequest("Scooter is not available");
  }

  const activeRental = await Rental.exists({
    scooterId: scooter._id,
    status: "active"
  });

  if (activeRental) {
    throw badRequest("This scooter already has an active rental");
  }

  const customer = await Customer.findOneAndUpdate(
    { phone: parsed.data.phone },
    {
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      nationalIdFrontImage: frontImage.filename
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  );

  if (!customer) {
    throw badRequest("Unable to create or update customer");
  }

  const settings = await getOrCreateSettings();

  const rental = await Rental.create({
    customerId: customer._id,
    scooterId: scooter._id,
    startTime: new Date(),
    baseFee: settings.baseFee,
    pricePerMinute: settings.pricePerMinute,
    status: "active"
  });

  scooter.status = "rented";
  await scooter.save();

  const populated = await loadRentalById(rental._id.toString());
  res.status(201).json(serializeRental(populated));
};

export const listActiveRentals = async (_req: Request, res: Response) => {
  const rentals = (await Rental.find({ status: "active" })
    .sort({ startTime: -1 })
    .populate("customerId", "fullName phone nationalIdFrontImage")
    .populate("scooterId", "scooterNumber model status")) as unknown as RentalSnapshot[];

  res.json(rentals.map((rental) => serializeRental(rental)));
};

export const pauseRental = async (req: Request, res: Response) => {
  const parsed = paymentSchema.safeParse(req.body);

  if (!parsed.success || !parsed.data.paymentVerified) {
    throw badRequest("Payment verification is required before pausing a rental");
  }

  const rental = await Rental.findById(req.params.id);

  if (!rental || rental.status !== "active") {
    throw notFound("Active rental not found");
  }

  if (rental.pauseStartedAt) {
    throw badRequest("Rental is already paused");
  }

  rental.pauseStartedAt = new Date();
  rental.paymentVerifiedAt = rental.paymentVerifiedAt ?? new Date();
  await rental.save();

  const populated = await loadRentalById(rental._id.toString());
  res.json(serializeRental(populated));
};

export const resumeRental = async (req: Request, res: Response) => {
  const rental = await Rental.findById(req.params.id);

  if (!rental || rental.status !== "active") {
    throw notFound("Active rental not found");
  }

  if (!rental.pauseStartedAt) {
    throw badRequest("Rental is not paused");
  }

  rental.pausedDurationMs += Math.max(0, Date.now() - rental.pauseStartedAt.getTime());
  rental.pauseStartedAt = undefined;
  await rental.save();

  const populated = await loadRentalById(rental._id.toString());
  res.json(serializeRental(populated));
};

export const completeRental = async (req: Request, res: Response) => {
  const parsed = paymentSchema.safeParse(req.body);

  if (!parsed.success || !parsed.data.paymentVerified) {
    throw badRequest("Payment verification is required before ending a rental");
  }

  const rental = await Rental.findById(req.params.id);

  if (!rental || rental.status !== "active") {
    throw notFound("Active rental not found");
  }

  const endTime = new Date();

  if (rental.pauseStartedAt) {
    rental.pausedDurationMs += Math.max(0, endTime.getTime() - rental.pauseStartedAt.getTime());
    rental.pauseStartedAt = undefined;
  }

  const durationMinutes = calculateDurationMinutes({
    startTime: rental.startTime,
    endTime,
    pausedDurationMs: rental.pausedDurationMs
  });

  rental.endTime = endTime;
  rental.durationMinutes = durationMinutes;
  rental.totalPrice = calculateTotalPrice(rental.baseFee, rental.pricePerMinute, durationMinutes);
  rental.status = "completed";
  rental.paymentVerifiedAt = rental.paymentVerifiedAt ?? new Date();
  await rental.save();

  const scooter = await Scooter.findById(rental.scooterId);

  if (scooter && scooter.status === "rented") {
    scooter.status = "available";
    await scooter.save();
  }

  const populated = await loadRentalById(rental._id.toString());
  res.json(serializeRental(populated));
};

export const listRentalHistory = async (req: Request, res: Response) => {
  const parsed = historyQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    throw badRequest("Invalid filters", parsed.error.flatten());
  }

  const { customerName, phoneNumber, scooterNumber, startDate, endDate, sortBy = "endTime", order = "desc" } =
    parsed.data;

  const pipeline: PipelineStage[] = [
    { $match: { status: "completed" } },
    {
      $lookup: {
        from: "customers",
        localField: "customerId",
        foreignField: "_id",
        as: "customer"
      }
    },
    {
      $lookup: {
        from: "scooters",
        localField: "scooterId",
        foreignField: "_id",
        as: "scooter"
      }
    },
    { $unwind: "$customer" },
    { $unwind: "$scooter" }
  ];

  const filters: Record<string, unknown> = {};

  if (customerName) {
    filters["customer.fullName"] = { $regex: customerName, $options: "i" };
  }

  if (phoneNumber) {
    filters["customer.phone"] = { $regex: phoneNumber, $options: "i" };
  }

  if (scooterNumber) {
    filters["scooter.scooterNumber"] = { $regex: scooterNumber, $options: "i" };
  }

  if (startDate || endDate) {
    filters.endTime = {};

    if (startDate) {
      (filters.endTime as Record<string, Date>).$gte = new Date(startDate);
    }

    if (endDate) {
      const inclusiveEnd = new Date(endDate);
      inclusiveEnd.setHours(23, 59, 59, 999);
      (filters.endTime as Record<string, Date>).$lte = inclusiveEnd;
    }
  }

  if (Object.keys(filters).length > 0) {
    pipeline.push({ $match: filters } as PipelineStage.Match);
  }

  pipeline.push({
    $sort: {
      [sortBy]: order === "asc" ? 1 : -1
    }
  } as PipelineStage.Sort);

  const rentals = await Rental.aggregate(pipeline);
  const totalRevenue = rentals.reduce((sum, rental) => sum + (rental.totalPrice ?? 0), 0);

  res.json({
    rentals: rentals.map((rental) => ({
      id: rental._id,
      customerName: rental.customer.fullName,
      phoneNumber: rental.customer.phone,
      scooterNumber: rental.scooter.scooterNumber,
      startTime: rental.startTime,
      endTime: rental.endTime,
      durationMinutes: rental.durationMinutes,
      totalPrice: rental.totalPrice,
      status: rental.status,
      nationalIdFrontImage: Boolean(rental.customer.nationalIdFrontImage)
    })),
    totalRevenue
  });
};

export const streamRentalDocument = async (req: Request, res: Response) => {
  const rental = await Rental.findById(String(req.params.id)).populate("customerId");

  if (!rental) {
    throw notFound("Rental not found");
  }

  const customer = rental.customerId as unknown as {
    nationalIdFrontImage: string;
  };
  const filename = customer.nationalIdFrontImage;

  if (!filename) {
    throw notFound("Document not found");
  }

  const absolutePath = path.join(env.uploadDir, filename);

  if (!fs.existsSync(absolutePath)) {
    throw notFound("Stored document file not found");
  }

  const download = String(req.query.download ?? "") === "1";
  res.setHeader("Content-Disposition", `${download ? "attachment" : "inline"}; filename="${filename}"`);
  res.sendFile(absolutePath);
};

export const deleteCompletedRentalIds = async (req: Request, res: Response) => {
  const days = Number(req.body?.days ?? req.query.days ?? 0);

  if (!Number.isFinite(days) || days <= 0) {
    throw badRequest("A positive time frame in days is required");
  }

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rentals = await Rental.find({
    status: "completed",
    endTime: { $lte: cutoff }
  }).populate("customerId", "nationalIdFrontImage");

  let deletedCount = 0;

  for (const rental of rentals) {
    const customer = rental.customerId as unknown as { _id: string; nationalIdFrontImage?: string };
    const filename = customer.nationalIdFrontImage;

    if (!filename) {
      continue;
    }

    const absolutePath = path.join(env.uploadDir, filename);

    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    await Customer.updateOne(
      { _id: customer._id },
      {
        $set: { nationalIdFrontImage: "" }
      }
    );
    deletedCount += 1;
  }

  res.json({ deletedCount });
};

export const deleteHistoryRental = async (req: Request, res: Response) => {
  const rental = await Rental.findById(String(req.params.id));

  if (!rental || rental.status !== "completed") {
    throw notFound("Completed rental not found");
  }

  const customerId = String(rental.customerId);
  await rental.deleteOne();
  await cleanupCustomerFrontIdIfUnused(customerId);

  res.status(204).send();
};

export const clearHistoryByDateRange = async (req: Request, res: Response) => {
  const parsed = clearHistorySchema.safeParse(req.body);

  if (!parsed.success) {
    throw badRequest("Valid startDate and endDate are required", parsed.error.flatten());
  }

  const startDate = new Date(parsed.data.startDate);
  const endDate = new Date(parsed.data.endDate);
  endDate.setHours(23, 59, 59, 999);

  const rentals = await Rental.find({
    status: "completed",
    endTime: {
      $gte: startDate,
      $lte: endDate
    }
  });

  const customerIds = [...new Set(rentals.map((rental) => String(rental.customerId)))];

  if (rentals.length > 0) {
    await Rental.deleteMany({
      _id: { $in: rentals.map((rental) => rental._id) }
    });
  }

  for (const customerId of customerIds) {
    await cleanupCustomerFrontIdIfUnused(customerId);
  }

  res.json({ deletedCount: rentals.length });
};
