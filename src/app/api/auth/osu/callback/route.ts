import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import { exchangeOsuCode, fetchOsuMe } from "@/lib/osuApi";
import {
  createSessionToken,
  getOAuthStateCookieName,
  getSessionCookieName,
  oauthStateCookieOptions,
  sessionCookieOptions,
} from "@/lib/session";
import { UserModel } from "@/models/User";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? requestUrl.origin;
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const storedState = request.cookies.get(getOAuthStateCookieName())?.value;

  if (!code || !state || !storedState || state !== storedState) {
    return redirectWithError(appUrl, "invalid_oauth_state");
  }

  try {
    const token = await exchangeOsuCode(code);
    const osuUser = await fetchOsuMe(token.access_token);

    await connectMongoDB();

    const user = await UserModel.findOneAndUpdate(
      { osuUserId: String(osuUser.id) },
      {
        $set: {
          osuUserId: String(osuUser.id),
          username: osuUser.username,
          avatarUrl: osuUser.avatar_url,
          accessToken: token.access_token,
          refreshToken: token.refresh_token,
          tokenExpiresAt: new Date(Date.now() + token.expires_in * 1000),
        },
      },
      {
        new: true,
        setDefaultsOnInsert: true,
        upsert: true,
      },
    );

    const response = NextResponse.redirect(new URL("/dashboard", appUrl));
    const sessionToken = createSessionToken({
      userId: user._id.toString(),
      osuUserId: user.osuUserId,
    });

    response.cookies.set(
      getSessionCookieName(),
      sessionToken,
      sessionCookieOptions,
    );
    response.cookies.set(getOAuthStateCookieName(), "", {
      ...oauthStateCookieOptions,
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("osu! OAuth callback failed", error);

    return redirectWithError(appUrl, "oauth_callback_failed");
  }
}

function redirectWithError(appUrl: string, error: string) {
  const redirectUrl = new URL("/", appUrl);
  redirectUrl.searchParams.set("error", error);

  return NextResponse.redirect(redirectUrl);
}
