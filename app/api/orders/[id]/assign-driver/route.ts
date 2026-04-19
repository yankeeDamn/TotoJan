import { NextRequest, NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { assignDriverSchema } from "@/lib/validations";
import { assignDriver } from "@/services/order-service";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = assignDriverSchema.parse(body);
    const order = await assignDriver(id, parsed.driverId, session.name);
    return NextResponse.json({ data: order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to assign driver";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
