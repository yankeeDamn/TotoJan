export type ServiceType = "travel" | "transport" | "delivery";

export type BookingStatus =
  | "pending"
  | "assigned"
  | "accepted"
  | "arriving"
  | "in_progress"
  | "completed"
  | "cancelled";

export type PaymentMode = "cash" | "upi";
export type PaymentStatus = "pending" | "paid" | "failed";
export type AuthRole = "SUPER_ADMIN" | "DISPATCHER" | "DRIVER";

export type LocalityOption = {
  name: string;
  latitude: number;
  longitude: number;
};

export type BookingFormValues = {
  customerName: string;
  phone: string;
  serviceType: ServiceType;
  pickupLocality: string;
  pickupAddress: string;
  dropLocality: string;
  dropAddress: string;
  goodsDetails?: string;
  specialNote?: string;
  bookingTime: "now" | "schedule";
  scheduledAt?: string;
  priority: boolean;
};

export type OrderSummary = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  serviceType: ServiceType;
  pickupLabel: string;
  dropLabel: string;
  estimatedFare: number;
  finalFare: number | null;
  status: BookingStatus;
  paymentMode: PaymentMode;
  paymentStatus: PaymentStatus;
  scheduledAt: string | null;
  createdAt: string;
  driverName: string | null;
};

export type DashboardSummary = {
  totalOrdersToday: number;
  pendingOrders: number;
  completedOrders: number;
  activeDrivers: number;
};

export type DriverSummary = {
  id: string;
  name: string;
  phone: string;
  vehicleNumber: string;
  isOnline: boolean;
  isVerified: boolean;
  assignedJobs: number;
};

export type FareRuleInput = {
  serviceType: ServiceType;
  baseFare: number;
  shortDistanceFare: number;
  mediumDistanceFare: number;
  longDistanceFare: number;
  priorityCharge: number;
  waitingCharge: number;
};

export type ServiceAreaValidationResult = {
  valid: boolean;
  message: string;
  pickupLocality?: string;
  dropLocality?: string;
};