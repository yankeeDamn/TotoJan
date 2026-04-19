import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { listFareRules } from "@/services/order-service";

export async function GET() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rules = await listFareRules();
    return NextResponse.json({ data: rules });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch fare rules";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
