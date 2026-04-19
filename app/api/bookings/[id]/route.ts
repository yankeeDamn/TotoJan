import { NextRequest, NextResponse } from "next/server";

import { getOrderById } from "@/services/order-service";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const order = await getOrderById(id);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ data: order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch booking";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
