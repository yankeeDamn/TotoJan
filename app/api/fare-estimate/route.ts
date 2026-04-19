import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { estimateFareFromRule } from "@/lib/fare";
import { validateRampurhatServiceArea } from "@/lib/service-area";
import { fareEstimateSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = fareEstimateSchema.parse(body);

    const serviceValid = validateRampurhatServiceArea({
      pickupLocality: parsed.pickupLocality,
      dropLocality: parsed.dropLocality,
    });

    if (!serviceValid.valid) {
      return NextResponse.json({ error: serviceValid.message }, { status: 422 });
    }

    const rule = await db.fareRule.findUnique({
      where: { serviceType: parsed.serviceType },
    });

    if (!rule) {
      return NextResponse.json({ error: "Fare not configured for this service type" }, { status: 404 });
    }

    const result = estimateFareFromRule(rule, {
      serviceType: parsed.serviceType,
      pickupLocality: parsed.pickupLocality,
      dropLocality: parsed.dropLocality,
      priority: parsed.priority,
    });

    return NextResponse.json({
      data: {
        fare: result.fare,
        band: result.band,
        distanceKm: result.distanceKm,
        serviceType: result.serviceType,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fare estimation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
