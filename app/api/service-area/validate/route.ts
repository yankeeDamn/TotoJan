import { NextRequest, NextResponse } from "next/server";

import { validateRampurhatServiceArea } from "@/lib/service-area";
import { serviceAreaValidationSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = serviceAreaValidationSchema.parse(body);
    const result = validateRampurhatServiceArea(parsed);
    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Validation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
