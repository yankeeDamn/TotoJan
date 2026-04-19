import { NextRequest, NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { fareRuleSchema } from "@/lib/validations";
import { updateFareRule } from "@/services/order-service";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = fareRuleSchema.parse(body);
    const rule = await updateFareRule(id, {
      baseFare: parsed.baseFare,
      shortDistanceFare: parsed.shortDistanceFare,
      mediumDistanceFare: parsed.mediumDistanceFare,
      longDistanceFare: parsed.longDistanceFare,
      priorityCharge: parsed.priorityCharge,
      waitingCharge: parsed.waitingCharge,
      isActive: parsed.isActive,
    });
    return NextResponse.json({ data: rule });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update fare rule";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
