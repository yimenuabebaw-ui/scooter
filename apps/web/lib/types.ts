export type AdminUser = {
  id: string;
  username: string;
  email: string;
};

export type ScooterStatus = "available" | "rented" | "maintenance";
export type RentalStatus = "active" | "completed";

export type Scooter = {
  _id: string;
  scooterNumber: string;
  model: string;
  status: ScooterStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type Settings = {
  _id: string;
  baseFee: number;
  pricePerMinute: number;
  createdAt: string;
  updatedAt: string;
};

export type RentalCustomer = {
  _id: string;
  fullName: string;
  phone: string;
};

export type RentalScooter = {
  _id: string;
  scooterNumber: string;
  model: string;
  status: ScooterStatus;
};

export type Rental = {
  id: string;
  customer: RentalCustomer;
  scooter: RentalScooter;
  startTime: string;
  endTime?: string | null;
  durationMinutes: number;
  baseFee: number;
  pricePerMinute: number;
  totalPrice: number;
  status: RentalStatus;
  pauseStartedAt?: string | null;
  pausedDurationMs?: number;
  paymentVerifiedAt?: string | null;
  elapsedSeconds?: number;
};

export type DashboardMetrics = {
  totalScooters: number;
  availableScooters: number;
  activeRentals: number;
  todayRevenue: number;
  monthlyRevenue: number;
  recentRentals: Rental[];
};

export type RentalHistoryRow = {
  id: string;
  customerName: string;
  phoneNumber: string;
  scooterNumber: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  totalPrice: number;
  status: RentalStatus;
  nationalIdFrontImage: boolean;
};

export type RentalHistoryResponse = {
  rentals: RentalHistoryRow[];
  totalRevenue: number;
};

export type RevenueReport = {
  title: string;
  startDate: string;
  endDate: string;
  rentalCount: number;
  totalRevenue: number;
  averageRentalValue: number;
  rentals: Array<{
    customerName: string;
    phoneNumber: string;
    scooterNumber: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    totalPrice: number;
  }>;
};
