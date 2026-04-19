import { NextRequest, NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { listDrivers, saveDriver } from "@/services/order-service";

export async function GET() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const drivers = await listDrivers();
    return NextResponse.json({ data: drivers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch drivers";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const driver = await saveDriver(body);
    return NextResponse.json({ data: driver }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create driver";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
