import { PrismaClient, ServiceType, VehicleType } from "@prisma/client";
import bcrypt from "bcryptjs";

import { RAMPURHAT_CITY, RAMPURHAT_LOCALITIES } from "@/constants/rampurhat";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("Admin@123", 10);
  const driverPassword = await bcrypt.hash("Driver@123", 10);

  await prisma.adminUser.upsert({
    where: { email: "admin@rampurhattoto.in" },
    update: {},
    create: {
      name: "Rampurhat Admin",
      email: "admin@rampurhattoto.in",
      passwordHash: adminPassword,
      role: "SUPER_ADMIN",
    },
  });

  await Promise.all(
    [
      {
        name: "Bappa Sheikh",
        phone: "+919000011111",
        vehicleNumber: "WB53TOTO101",
        currentLat: 24.1756,
        currentLng: 87.7826,
      },
      {
        name: "Sanjib Das",
        phone: "+919000022222",
        vehicleNumber: "WB53TOTO102",
        currentLat: 24.1698,
        currentLng: 87.7839,
      },
      {
        name: "Raju Mondal",
        phone: "+919000033333",
        vehicleNumber: "WB53TOTO103",
        currentLat: 24.1714,
        currentLng: 87.7795,
      },
    ].map((driver) =>
      prisma.driver.upsert({
        where: { phone: driver.phone },
        update: {},
        create: {
          ...driver,
          passwordHash: driverPassword,
          vehicleType: VehicleType.TOTO,
          isOnline: true,
          isVerified: true,
        },
      }),
    ),
  );

  await Promise.all(
    [
      {
        serviceType: ServiceType.travel,
        baseFare: 30,
        shortDistanceFare: 50,
        mediumDistanceFare: 80,
        longDistanceFare: 120,
        priorityCharge: 20,
        waitingCharge: 10,
      },
      {
        serviceType: ServiceType.transport,
        baseFare: 50,
        shortDistanceFare: 80,
        mediumDistanceFare: 130,
        longDistanceFare: 180,
        priorityCharge: 30,
        waitingCharge: 20,
      },
      {
        serviceType: ServiceType.delivery,
        baseFare: 40,
        shortDistanceFare: 60,
        mediumDistanceFare: 90,
        longDistanceFare: 130,
        priorityCharge: 25,
        waitingCharge: 15,
      },
    ].map((rule) =>
      prisma.fareRule.upsert({
        where: { serviceType: rule.serviceType },
        update: rule,
        create: rule,
      }),
    ),
  );

  await Promise.all(
    RAMPURHAT_LOCALITIES.map((locality) =>
      prisma.serviceArea.upsert({
        where: {
          areaName_cityName: {
            areaName: locality.name,
            cityName: RAMPURHAT_CITY,
          },
        },
        update: {
          latitude: locality.latitude,
          longitude: locality.longitude,
          isActive: true,
        },
        create: {
          areaName: locality.name,
          cityName: RAMPURHAT_CITY,
          latitude: locality.latitude,
          longitude: locality.longitude,
          isActive: true,
        },
      }),
    ),
  );

  const customer = await prisma.customer.upsert({
    where: { phone: "+919812345678" },
    update: { name: "Arpita Roy" },
    create: {
      name: "Arpita Roy",
      phone: "+919812345678",
    },
  });

  const firstDriver = await prisma.driver.findFirst({ where: { isOnline: true }, orderBy: { createdAt: "asc" } });

  if (!firstDriver) {
    return;
  }

  const existingOrder = await prisma.order.findFirst({ where: { orderNumber: "RHT-1001" } });

  if (!existingOrder) {
    await prisma.order.create({
      data: {
        orderNumber: "RHT-1001",
        customerId: customer.id,
        serviceType: ServiceType.travel,
        pickupLocality: "Station Road",
        pickupAddress: "Station Road, near SBI ATM",
        dropLocality: "College More",
        dropAddress: "College More, opposite coaching lane",
        pickupLat: 24.1756,
        pickupLng: 87.7826,
        dropLat: 24.1698,
        dropLng: 87.7839,
        estimatedFare: 50,
        finalFare: 50,
        status: "assigned",
        driverId: firstDriver.id,
        paymentMode: "cash",
        paymentStatus: "pending",
        statusLogs: {
          create: [
            {
              status: "pending",
              changedBy: "system",
              note: "Seed booking created",
            },
            {
              status: "assigned",
              changedBy: "admin@rampurhattoto.in",
              note: "Assigned to available driver",
            },
          ],
        },
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });