import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";

import { env } from "@/lib/env";

const secret = new TextEncoder().encode(env.authSecret);

export const ADMIN_SESSION_COOKIE = "rampurhat_admin_session";
export const DRIVER_SESSION_COOKIE = "rampurhat_driver_session";

type BaseSession = {
  sub: string;
  name: string;
};

export type AdminSession = BaseSession & {
  email: string;
  role: "SUPER_ADMIN" | "DISPATCHER";
};

export type DriverSession = BaseSession & {
  phone: string;
  role: "DRIVER";
};

export async function signSessionToken(payload: AdminSession | DriverSession) {
  return new SignJWT(payload as unknown as Record<string, string>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

async function verifyToken<T>(token?: string) {
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as T;
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  return verifyToken<AdminSession>(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function getDriverSession() {
  const cookieStore = await cookies();
  return verifyToken<DriverSession>(cookieStore.get(DRIVER_SESSION_COOKIE)?.value);
}

export async function requireAdminSession() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return session;
}

export async function requireDriverSession() {
  const session = await getDriverSession();

  if (!session) {
    redirect("/driver/login");
  }

  return session;
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};