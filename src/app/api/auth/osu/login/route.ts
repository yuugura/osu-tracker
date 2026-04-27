import { NextResponse } from "next/server";
import { getOsuAuthorizeUrl } from "@/lib/osuAuth";
import {
  createOAuthState,
  getOAuthStateCookieName,
  oauthStateCookieOptions,
} from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  try {
    const state = createOAuthState();
    const response = NextResponse.redirect(getOsuAuthorizeUrl(state));

    response.cookies.set(
      getOAuthStateCookieName(),
      state,
      oauthStateCookieOptions,
    );

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to start osu! login";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
