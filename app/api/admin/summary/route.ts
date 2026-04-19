import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { getDashboardSummary } from "@/services/order-service";

export async function GET() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await getDashboardSummary();
    return NextResponse.json({ data: summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch summary";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
