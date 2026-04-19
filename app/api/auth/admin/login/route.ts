import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { ADMIN_SESSION_COOKIE, sessionCookieOptions, signSessionToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminLoginSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = adminLoginSchema.parse(body);

    const admin = await db.adminUser.findUnique({ where: { email: parsed.email } });

    if (!admin) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await bcrypt.compare(parsed.password, admin.passwordHash);

    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = await signSessionToken({
      sub: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    });

    const response = NextResponse.json({ data: { name: admin.name, role: admin.role } });
    response.cookies.set(ADMIN_SESSION_COOKIE, token, sessionCookieOptions);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
