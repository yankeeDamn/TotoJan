import { NextRequest, NextResponse } from "next/server";

import { getAdminSession, getDriverSession } from "@/lib/auth";
import { availabilitySchema } from "@/lib/validations";
import { updateDriverAvailability } from "@/services/order-service";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminSession = await getAdminSession();
  const driverSession = await getDriverSession();

  if (!adminSession && !driverSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Driver may only update their own availability
  if (driverSession && !adminSession) {
    const { id } = await params;
    if (driverSession.sub !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = availabilitySchema.parse(body);
    const driver = await updateDriverAvailability(id, parsed.isOnline);
    return NextResponse.json({ data: { id: driver.id, isOnline: driver.isOnline } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update availability";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
