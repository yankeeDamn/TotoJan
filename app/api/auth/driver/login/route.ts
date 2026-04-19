import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { DRIVER_SESSION_COOKIE, sessionCookieOptions, signSessionToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { driverLoginSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = driverLoginSchema.parse(body);

    const driver = await db.driver.findUnique({ where: { phone: parsed.phone } });

    if (!driver) {
      return NextResponse.json({ error: "Invalid phone or password" }, { status: 401 });
    }

    const valid = await bcrypt.compare(parsed.password, driver.passwordHash);

    if (!valid) {
      return NextResponse.json({ error: "Invalid phone or password" }, { status: 401 });
    }

    if (!driver.isVerified) {
      return NextResponse.json({ error: "Your account is pending verification. Contact admin." }, { status: 403 });
    }

    const token = await signSessionToken({
      sub: driver.id,
      name: driver.name,
      phone: driver.phone,
      role: "DRIVER",
    });

    const response = NextResponse.json({ data: { name: driver.name, id: driver.id } });
    response.cookies.set(DRIVER_SESSION_COOKIE, token, sessionCookieOptions);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
