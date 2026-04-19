import { NextRequest, NextResponse } from "next/server";

import { getAdminSession, getDriverSession } from "@/lib/auth";
import { orderStatusSchema } from "@/lib/validations";
import { updateOrderStatus } from "@/services/order-service";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminSession = await getAdminSession();
  const driverSession = await getDriverSession();
  const session = adminSession ?? driverSession;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = orderStatusSchema.parse(body);
    const changedBy = session.name;
    const order = await updateOrderStatus(id, parsed, changedBy);
    return NextResponse.json({ data: order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update order status";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
