import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { ADMIN_SESSION_COOKIE, DRIVER_SESSION_COOKIE } from "@/lib/auth";

export async function POST() {
  const cookieStore = await cookies();
  const response = NextResponse.redirect(new URL("/", process.env.APP_URL ?? "http://localhost:3000"));
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  cookieStore.delete(DRIVER_SESSION_COOKIE);
  response.cookies.delete(ADMIN_SESSION_COOKIE);
  response.cookies.delete(DRIVER_SESSION_COOKIE);
  return response;
}
