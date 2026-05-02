import { NextRequest, NextResponse } from "next/server";
import { getOsuAuthorizeUrl } from "@/lib/osuAuth";
import {
  createOAuthState,
  getOAuthStateCookieName,
  oauthStateCookieOptions,
} from "@/lib/session";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const canonicalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (canonicalAppUrl) {
      const canonicalUrl = new URL(canonicalAppUrl);
      const requestHost = request.headers.get("host");
      const requestProtocol =
        request.headers.get("x-forwarded-proto") ??
        new URL(request.url).protocol.replace(":", "");
      const requestOrigin = requestHost
        ? `${requestProtocol}://${requestHost}`
        : new URL(request.url).origin;

      if (requestOrigin !== canonicalUrl.origin) {
        return NextResponse.redirect(
          new URL("/api/auth/osu/login", canonicalUrl),
        );
      }
    }

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
