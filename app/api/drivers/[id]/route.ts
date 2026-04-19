import { NextRequest, NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { saveDriver } from "@/services/order-service";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const driver = await saveDriver({ ...body, id });
    return NextResponse.json({ data: driver });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update driver";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
