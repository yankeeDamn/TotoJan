import { NextResponse } from "next/server";

import { getDriverSession } from "@/lib/auth";
import { getDriverDashboard } from "@/services/order-service";

export async function GET() {
  const session = await getDriverSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const dashboard = await getDriverDashboard(session.sub);
    return NextResponse.json({ data: dashboard });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch driver data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
