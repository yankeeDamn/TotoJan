import { NextRequest, NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { listOrders } from "@/services/order-service";

export async function GET(request: NextRequest) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status") ?? undefined;

  try {
    const orders = await listOrders(status);
    return NextResponse.json({ data: orders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch orders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
