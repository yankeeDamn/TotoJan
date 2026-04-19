import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";

export async function GET() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ data: { sub: session.sub, name: session.name, email: session.email, role: session.role } });
}
