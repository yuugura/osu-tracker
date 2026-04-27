import { NextResponse } from "next/server";
import { getSessionCookieName, sessionCookieOptions } from "@/lib/session";

export const runtime = "nodejs";

export async function POST() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const response = NextResponse.redirect(new URL("/", appUrl));

  response.cookies.set(getSessionCookieName(), "", {
    ...sessionCookieOptions,
    maxAge: 0,
  });

  return response;
}
