import { Request, Response } from "express";
import { z } from "zod";
import { Rental } from "../models/Rental";
import { Scooter, scooterStatuses } from "../models/Scooter";
import { badRequest, notFound } from "../utils/http";

const scooterSchema = z.object({
  scooterNumber: z.string().min(1),
  model: z.string().min(1),
  status: z.enum(scooterStatuses),
  notes: z.string().optional().default("")
});

export const listScooters = async (req: Request, res: Response) => {
  const { search, status, sortBy = "createdAt", order = "desc" } = req.query;
  const filter: Record<string, unknown> = {};

  if (status && scooterStatuses.includes(status as (typeof scooterStatuses)[number])) {
    filter.status = status;
  }

  if (search) {
    filter.$or = [
      { scooterNumber: { $regex: String(search), $options: "i" } },
      { model: { $regex: String(search), $options: "i" } }
    ];
  }

  const scooters = await Scooter.find(filter).sort({
    [String(sortBy)]: order === "asc" ? 1 : -1
  });

  res.json(scooters);
};

export const createScooter = async (req: Request, res: Response) => {
  const parsed = scooterSchema.safeParse(req.body);

  if (!parsed.success) {
    throw badRequest("Invalid scooter payload", parsed.error.flatten());
  }

  const existing = await Scooter.findOne({ scooterNumber: parsed.data.scooterNumber });

  if (existing) {
    throw badRequest("Scooter number already exists");
  }

  const scooter = await Scooter.create(parsed.data);
  res.status(201).json(scooter);
};

export const updateScooter = async (req: Request, res: Response) => {
  const parsed = scooterSchema.partial().safeParse(req.body);

  if (!parsed.success) {
    throw badRequest("Invalid scooter payload", parsed.error.flatten());
  }

  const scooter = await Scooter.findById(req.params.id);

  if (!scooter) {
    throw notFound("Scooter not found");
  }

  if (parsed.data.scooterNumber && parsed.data.scooterNumber !== scooter.scooterNumber) {
    const duplicate = await Scooter.findOne({ scooterNumber: parsed.data.scooterNumber });

    if (duplicate) {
      throw badRequest("Scooter number already exists");
    }
  }

  Object.assign(scooter, parsed.data);
  await scooter.save();

  res.json(scooter);
};

export const deleteScooter = async (req: Request, res: Response) => {
  const scooter = await Scooter.findById(req.params.id);

  if (!scooter) {
    throw notFound("Scooter not found");
  }

  const hasActiveRental = await Rental.exists({
    scooterId: scooter._id,
    status: "active"
  });

  if (hasActiveRental) {
    throw badRequest("Cannot delete a scooter with an active rental");
  }

  await scooter.deleteOne();
  res.status(204).send();
};
