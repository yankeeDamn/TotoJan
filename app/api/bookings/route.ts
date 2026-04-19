import { NextRequest, NextResponse } from "next/server";

import { createBooking } from "@/services/order-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const order = await createBooking(body);
    return NextResponse.json({ data: order }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create booking";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
