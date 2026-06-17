import { Request, Response } from "express";
import { Rental } from "../models/Rental";
import { Scooter } from "../models/Scooter";
import { calculateDurationMinutes, calculateTotalPrice } from "../services/pricing";

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const endOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 1);

export const getDashboardMetrics = async (_req: Request, res: Response) => {
  const now = new Date();

  const [totalScooters, availableScooters, activeRentalsCount, todayRevenueAgg, monthRevenueAgg, recentRentals] =
    await Promise.all([
      Scooter.countDocuments(),
      Scooter.countDocuments({ status: "available" }),
      Rental.countDocuments({ status: "active" }),
      Rental.aggregate([
        {
          $match: {
            status: "completed",
            endTime: { $gte: startOfDay(now), $lt: endOfDay(now) }
          }
        },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } }
      ]),
      Rental.aggregate([
        {
          $match: {
            status: "completed",
            endTime: { $gte: startOfMonth(now), $lt: endOfMonth(now) }
          }
        },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } }
      ]),
      Rental.find()
        .sort({ startTime: -1 })
        .limit(6)
        .populate("customerId", "fullName phone")
        .populate("scooterId", "scooterNumber model status")
    ]);

  const serializedRentals = recentRentals.map((rental) => {
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
      id: rental._id,
      status: rental.status,
      startTime: rental.startTime,
      endTime: rental.endTime,
      durationMinutes,
      totalPrice,
      paymentVerifiedAt: rental.paymentVerifiedAt,
      paused: Boolean(rental.pauseStartedAt),
      customer: rental.customerId,
      scooter: rental.scooterId
    };
  });

  res.json({
    totalScooters,
    availableScooters,
    activeRentals: activeRentalsCount,
    todayRevenue: todayRevenueAgg[0]?.total ?? 0,
    monthlyRevenue: monthRevenueAgg[0]?.total ?? 0,
    recentRentals: serializedRentals
  });
};
