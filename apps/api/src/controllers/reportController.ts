import { Request, Response } from "express";
import { PipelineStage } from "mongoose";
import { z } from "zod";
import { Rental } from "../models/Rental";
import { buildRevenueExcel, buildRevenuePdf, ReportRentalRow } from "../services/reportExport";
import { badRequest } from "../utils/http";

const reportQuerySchema = z.object({
  preset: z.enum(["daily", "monthly", "custom"]).default("daily"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  format: z.enum(["excel", "pdf"]).optional()
});

const getRange = (preset: "daily" | "monthly" | "custom", startDate?: string, endDate?: string) => {
  const now = new Date();

  if (preset === "daily") {
    return {
      title: "Daily Revenue Report",
      start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    };
  }

  if (preset === "monthly") {
    return {
      title: "Monthly Revenue Report",
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 1)
    };
  }

  if (!startDate || !endDate) {
    throw badRequest("Custom range requires startDate and endDate");
  }

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  return {
    title: "Custom Revenue Report",
    start: new Date(startDate),
    end
  };
};

const fetchReportRows = async (start: Date, end: Date) => {
  type ReportRentalDocument = {
    customerId: {
      fullName: string;
      phone: string;
    };
    scooterId: {
      scooterNumber: string;
    };
    startTime: Date;
    endTime: Date | null;
    durationMinutes: number;
    totalPrice: number;
  };

  const rentals = (await Rental.find({
    status: "completed",
    endTime: { $gte: start, $lte: end }
  })
    .populate("customerId", "fullName phone")
    .populate("scooterId", "scooterNumber")) as unknown as ReportRentalDocument[];

  const rows: ReportRentalRow[] = rentals.map((rental) => ({
    customerName: rental.customerId.fullName,
    phoneNumber: rental.customerId.phone,
    scooterNumber: rental.scooterId.scooterNumber,
    startTime: rental.startTime,
    endTime: rental.endTime ?? rental.startTime,
    durationMinutes: rental.durationMinutes,
    totalPrice: rental.totalPrice
  }));

  return rows;
};

export const getRevenueReport = async (req: Request, res: Response) => {
  const parsed = reportQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    throw badRequest("Invalid report filters", parsed.error.flatten());
  }

  const { preset, startDate, endDate } = parsed.data;
  const range = getRange(preset, startDate, endDate);
  const rows = await fetchReportRows(range.start, range.end);
  const totalRevenue = rows.reduce((sum, row) => sum + row.totalPrice, 0);

  res.json({
    title: range.title,
    startDate: range.start,
    endDate: range.end,
    rentalCount: rows.length,
    totalRevenue,
    averageRentalValue: rows.length ? Number((totalRevenue / rows.length).toFixed(2)) : 0,
    rentals: rows
  });
};

export const exportRevenueReport = async (req: Request, res: Response) => {
  const parsed = reportQuerySchema.safeParse(req.query);

  if (!parsed.success || !parsed.data.format) {
    throw badRequest("A valid export format is required");
  }

  const { preset, startDate, endDate, format } = parsed.data;
  const range = getRange(preset, startDate, endDate);
  const rows = await fetchReportRows(range.start, range.end);
  const totalRevenue = rows.reduce((sum, row) => sum + row.totalPrice, 0);
  const filenameDate = new Date().toISOString().slice(0, 10);

  if (format === "excel") {
    const buffer = await buildRevenueExcel(rows, {
      title: range.title,
      totalRevenue,
      rentalCount: rows.length
    });
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="revenue-report-${filenameDate}.xlsx"`);
    res.send(buffer);
    return;
  }

  const pdf = await buildRevenuePdf(rows, {
    title: range.title,
    totalRevenue,
    rentalCount: rows.length
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="revenue-report-${filenameDate}.pdf"`);
  res.send(pdf);
};
