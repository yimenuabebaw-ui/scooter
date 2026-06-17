import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    maximumFractionDigits: 0
  }).format(amount);

export const formatDateTime = (value: string | Date | null | undefined) => {
  if (!value) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("en-ET", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
};

export const formatMinutes = (minutes: number) => `${minutes} min`;

export const formatDurationClock = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, mins, seconds].map((part) => String(part).padStart(2, "0")).join(":");
};

export const statusLabelMap = {
  available: "Available",
  rented: "Rented",
  maintenance: "Maintenance",
  active: "Active",
  completed: "Completed"
} as const;
