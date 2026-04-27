import type {
  OsuRecentScore,
  OsuTokenResponse,
  OsuUserResponse,
} from "@/types/osu";

const OSU_BASE_URL = "https://osu.ppy.sh/api/v2";
const OSU_TOKEN_URL = "https://osu.ppy.sh/oauth/token";

export async function exchangeOsuCode(code: string) {
  const clientId = process.env.OSU_CLIENT_ID;
  const clientSecret = process.env.OSU_CLIENT_SECRET;
  const redirectUri = process.env.OSU_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("osu! OAuth environment variables are not set");
  }

  const response = await fetch(OSU_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: Number(clientId),
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to exchange osu! authorization code");
  }

  return (await response.json()) as OsuTokenResponse;
}

export async function fetchOsuMe(accessToken: string) {
  return fetchOsuApi<OsuUserResponse>("/me", accessToken);
}

export async function fetchRecentOsuScores(accessToken: string, limit = 50) {
  return fetchOsuApi<OsuRecentScore[]>(
    `/me/scores/recent?limit=${limit}`,
    accessToken,
  );
}

async function fetchOsuApi<T>(path: string, accessToken: string) {
  const response = await fetch(`${OSU_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`osu! API request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}
