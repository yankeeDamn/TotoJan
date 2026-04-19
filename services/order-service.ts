import bcrypt from "bcryptjs";
import { endOfDay, startOfDay } from "date-fns";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { estimateFareFromRule } from "@/lib/fare";
import { validateRampurhatServiceArea } from "@/lib/service-area";
import { createOrderNumber, decimalToNumber } from "@/lib/utils";
import { bookingSchema, driverSchema } from "@/lib/validations";
import type { DashboardSummary, DriverSummary, OrderSummary } from "@/types";

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: { customer: true; driver: true };
}>;

function serializeOrder(order: OrderWithRelations): OrderSummary {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customer.name,
    phone: order.customer.phone,
    serviceType: order.serviceType,
    pickupLabel: `${order.pickupLocality}, ${order.pickupAddress}`,
    dropLabel: `${order.dropLocality}, ${order.dropAddress}`,
    estimatedFare: decimalToNumber(order.estimatedFare) ?? 0,
    finalFare: decimalToNumber(order.finalFare),
    status: order.status,
    paymentMode: order.paymentMode,
    paymentStatus: order.paymentStatus,
    scheduledAt: order.scheduledAt?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
    driverName: order.driver?.name ?? null,
  };
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const [totalOrdersToday, pendingOrders, completedOrders, activeDrivers] = await Promise.all([
    db.order.count({
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    }),
    db.order.count({ where: { status: { in: ["pending", "assigned", "accepted", "arriving", "in_progress"] } } }),
    db.order.count({ where: { status: "completed" } }),
    db.driver.count({ where: { isOnline: true, isVerified: true } }),
  ]);

  return {
    totalOrdersToday,
    pendingOrders,
    completedOrders,
    activeDrivers,
  };
}

export async function listOrders(status?: string) {
  const orders = await db.order.findMany({
    where: status && status !== "all" ? { status: status as never } : undefined,
    include: {
      customer: true,
      driver: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return orders.map(serializeOrder);
}

export async function getOrderById(idOrOrderNumber: string) {
  const order = await db.order.findFirst({
    where: {
      OR: [{ id: idOrOrderNumber }, { orderNumber: idOrOrderNumber }],
    },
    include: {
      customer: true,
      driver: true,
      statusLogs: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!order) {
    return null;
  }

  return {
    ...serializeOrder(order as OrderWithRelations),
    statusLogs: order.statusLogs.map((log) => ({
      id: log.id,
      status: log.status,
      note: log.note,
      changedBy: log.changedBy,
      createdAt: log.createdAt.toISOString(),
    })),
  };
}

export async function createBooking(input: unknown) {
  const parsed = bookingSchema.parse(input);
  const validation = validateRampurhatServiceArea({
    pickupLocality: parsed.pickupLocality,
    dropLocality: parsed.dropLocality,
  });

  if (!validation.valid) {
    throw new Error(validation.message);
  }

  const fareRule = await db.fareRule.findUnique({
    where: { serviceType: parsed.serviceType },
  });

  if (!fareRule) {
    throw new Error("Fare settings not configured for the selected service.");
  }

  const fare = estimateFareFromRule(fareRule, {
    serviceType: parsed.serviceType,
    pickupLocality: parsed.pickupLocality,
    dropLocality: parsed.dropLocality,
    priority: parsed.priority,
  });

  const customer = await db.customer.upsert({
    where: { phone: parsed.phone },
    update: { name: parsed.customerName },
    create: {
      name: parsed.customerName,
      phone: parsed.phone,
    },
  });

  const order = await db.order.create({
    data: {
      orderNumber: createOrderNumber(),
      customerId: customer.id,
      serviceType: parsed.serviceType,
      pickupLocality: validation.pickupLocality ?? parsed.pickupLocality,
      pickupAddress: parsed.pickupAddress,
      dropLocality: validation.dropLocality ?? parsed.dropLocality,
      dropAddress: parsed.dropAddress,
      pickupLat: null,
      pickupLng: null,
      dropLat: null,
      dropLng: null,
      goodsDetails: parsed.goodsDetails,
      specialNote: parsed.specialNote,
      estimatedFare: fare.fare,
      priority: parsed.priority,
      scheduledAt: parsed.bookingTime === "schedule" && parsed.scheduledAt ? new Date(parsed.scheduledAt) : null,
      statusLogs: {
        create: {
          status: "pending",
          note: "Booking created by customer",
          changedBy: parsed.phone,
        },
      },
    },
    include: {
      customer: true,
      driver: true,
    },
  });

  return serializeOrder(order as OrderWithRelations);
}

export async function assignDriver(orderId: string, driverId: string, changedBy: string) {
  const driver = await db.driver.findUnique({ where: { id: driverId } });

  if (!driver) {
    throw new Error("Driver not found.");
  }

  const order = await db.order.update({
    where: { id: orderId },
    data: {
      driverId,
      status: "assigned",
      statusLogs: {
        create: {
          status: "assigned",
          changedBy,
          note: `Assigned to ${driver.name}`,
        },
      },
    },
    include: {
      customer: true,
      driver: true,
    },
  });

  return serializeOrder(order as OrderWithRelations);
}

export async function updateOrderStatus(
  orderId: string,
  input: {
    status: "pending" | "assigned" | "accepted" | "arriving" | "in_progress" | "completed" | "cancelled";
    note?: string;
    finalFare?: number;
    paymentMode?: "cash" | "upi";
    paymentStatus?: "pending" | "paid" | "failed";
  },
  changedBy: string,
) {
  const order = await db.order.update({
    where: { id: orderId },
    data: {
      status: input.status,
      finalFare: input.finalFare,
      paymentMode: input.paymentMode,
      paymentStatus: input.paymentStatus,
      statusLogs: {
        create: {
          status: input.status,
          changedBy,
          note: input.note,
        },
      },
    },
    include: {
      customer: true,
      driver: true,
    },
  });

  return serializeOrder(order as OrderWithRelations);
}

export async function listDrivers(): Promise<DriverSummary[]> {
  const drivers = await db.driver.findMany({
    include: {
      _count: {
        select: {
          orders: {
            where: {
              status: {
                in: ["assigned", "accepted", "arriving", "in_progress"],
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return drivers.map((driver) => ({
    id: driver.id,
    name: driver.name,
    phone: driver.phone,
    vehicleNumber: driver.vehicleNumber,
    isOnline: driver.isOnline,
    isVerified: driver.isVerified,
    assignedJobs: driver._count.orders,
  }));
}

export async function saveDriver(input: unknown) {
  const parsed = driverSchema.parse(input);

  if (parsed.id) {
    return db.driver.update({
      where: { id: parsed.id },
      data: {
        name: parsed.name,
        phone: parsed.phone,
        vehicleNumber: parsed.vehicleNumber,
        isOnline: parsed.isOnline,
        isVerified: parsed.isVerified,
      },
    });
  }

  const passwordHash = await bcrypt.hash(parsed.password ?? "Driver@123", 10);

  return db.driver.create({
    data: {
      name: parsed.name,
      phone: parsed.phone,
      vehicleNumber: parsed.vehicleNumber,
      passwordHash,
      isOnline: parsed.isOnline,
      isVerified: parsed.isVerified,
    },
  });
}

export async function updateDriverAvailability(driverId: string, isOnline: boolean) {
  return db.driver.update({
    where: { id: driverId },
    data: { isOnline },
  });
}

export async function listFareRules() {
  return db.fareRule.findMany({
    orderBy: {
      serviceType: "asc",
    },
  });
}

export async function updateFareRule(
  fareRuleId: string,
  input: {
    baseFare: number;
    shortDistanceFare: number;
    mediumDistanceFare: number;
    longDistanceFare: number;
    priorityCharge: number;
    waitingCharge: number;
    isActive: boolean;
  },
) {
  return db.fareRule.update({
    where: { id: fareRuleId },
    data: input,
  });
}

export async function getServiceAreas() {
  return db.serviceArea.findMany({
    where: { cityName: "Rampurhat" },
    orderBy: { areaName: "asc" },
  });
}

export async function getAnalytics() {
  const [ordersByStatus, ordersByService, revenue] = await Promise.all([
    db.order.groupBy({ by: ["status"], _count: true }),
    db.order.groupBy({ by: ["serviceType"], _count: true }),
    db.order.aggregate({
      where: { status: "completed" },
      _sum: { finalFare: true },
    }),
  ]);

  return {
    ordersByStatus,
    ordersByService,
    revenue: decimalToNumber(revenue._sum.finalFare) ?? 0,
  };
}

export async function getDriverDashboard(driverId: string) {
  const driver = await db.driver.findUnique({
    where: { id: driverId },
    include: {
      orders: {
        include: {
          customer: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!driver) {
    throw new Error("Driver not found.");
  }

  const activeJobs = driver.orders.filter((order) => ["assigned", "accepted", "arriving", "in_progress"].includes(order.status));
  const completedJobs = driver.orders.filter((order) => order.status === "completed");

  return {
    profile: {
      id: driver.id,
      name: driver.name,
      phone: driver.phone,
      vehicleNumber: driver.vehicleNumber,
      isOnline: driver.isOnline,
      isVerified: driver.isVerified,
    },
    activeJobs: activeJobs.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customer.name,
      phone: order.customer.phone,
      serviceType: order.serviceType,
      pickupLabel: `${order.pickupLocality}, ${order.pickupAddress}`,
      dropLabel: `${order.dropLocality}, ${order.dropAddress}`,
      status: order.status,
      estimatedFare: decimalToNumber(order.estimatedFare) ?? 0,
      finalFare: decimalToNumber(order.finalFare),
      createdAt: order.createdAt.toISOString(),
    })),
    earnings: {
      completedJobs: completedJobs.length,
      total: completedJobs.reduce((sum, order) => sum + (decimalToNumber(order.finalFare) ?? decimalToNumber(order.estimatedFare) ?? 0), 0),
    },
  };
}