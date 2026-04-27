import { cookies } from "next/headers";
import {
  getSessionCookieName,
  type SessionPayload,
  verifySessionToken,
} from "@/lib/session";

export async function getCurrentSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}
