import { NextRequest, NextResponse } from "next/server";

import { getAdminSession, getDriverSession } from "@/lib/auth";
import { getOrderById } from "@/services/order-service";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminSession = await getAdminSession();
  const driverSession = await getDriverSession();

  if (!adminSession && !driverSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const order = await getOrderById(id);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ data: order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
