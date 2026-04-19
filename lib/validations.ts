import { z } from "zod";

const phoneRegex = /^(?:\+91)?[6-9]\d{9}$/;

export const bookingSchema = z
  .object({
    customerName: z.string().min(2, "Enter your name"),
    phone: z.string().regex(phoneRegex, "Enter a valid phone number"),
    serviceType: z.enum(["travel", "transport", "delivery"]),
    pickupLocality: z.string().min(2, "Select pickup locality"),
    pickupAddress: z.string().min(5, "Enter pickup details"),
    dropLocality: z.string().min(2, "Select drop locality"),
    dropAddress: z.string().min(5, "Enter drop details"),
    goodsDetails: z.string().optional(),
    specialNote: z.string().optional(),
    bookingTime: z.enum(["now", "schedule"]),
    scheduledAt: z.string().optional(),
    priority: z.boolean().default(false),
  })
  .superRefine((data, context) => {
    if ((data.serviceType === "transport" || data.serviceType === "delivery") && !data.goodsDetails?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Goods or parcel details are required for this service",
        path: ["goodsDetails"],
      });
    }

    if (data.bookingTime === "schedule" && !data.scheduledAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select a scheduled time",
        path: ["scheduledAt"],
      });
    }
  });

export const fareEstimateSchema = z.object({
  serviceType: z.enum(["travel", "transport", "delivery"]),
  pickupLocality: z.string().min(2),
  dropLocality: z.string().min(2),
  priority: z.boolean().optional().default(false),
});

export const adminLoginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Enter your password"),
});

export const driverLoginSchema = z.object({
  phone: z.string().regex(phoneRegex, "Enter a valid phone number"),
  password: z.string().min(6, "Enter your password"),
});

export const assignDriverSchema = z.object({
  driverId: z.string().cuid("Invalid driver"),
});

export const orderStatusSchema = z.object({
  status: z.enum(["pending", "assigned", "accepted", "arriving", "in_progress", "completed", "cancelled"]),
  note: z.string().optional(),
  finalFare: z.number().nonnegative().optional(),
  paymentMode: z.enum(["cash", "upi"]).optional(),
  paymentStatus: z.enum(["pending", "paid", "failed"]).optional(),
});

export const driverSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().min(2, "Enter driver name"),
  phone: z.string().regex(phoneRegex, "Enter a valid phone number"),
  vehicleNumber: z.string().min(5, "Enter vehicle number"),
  password: z.string().min(6, "Enter at least 6 characters").optional(),
  isOnline: z.boolean().default(false),
  isVerified: z.boolean().default(true),
});

export const availabilitySchema = z.object({
  isOnline: z.boolean(),
});

export const fareRuleSchema = z.object({
  serviceType: z.enum(["travel", "transport", "delivery"]),
  baseFare: z.number().min(0),
  shortDistanceFare: z.number().min(0),
  mediumDistanceFare: z.number().min(0),
  longDistanceFare: z.number().min(0),
  priorityCharge: z.number().min(0),
  waitingCharge: z.number().min(0),
  isActive: z.boolean().default(true),
});

export const serviceAreaValidationSchema = z.object({
  pickupLocality: z.string().min(2),
  dropLocality: z.string().min(2),
});