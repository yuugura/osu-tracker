const OSU_AUTHORIZE_URL = "https://osu.ppy.sh/oauth/authorize";

export function getOsuAuthorizeUrl(state: string) {
  const clientId = process.env.OSU_CLIENT_ID;
  const redirectUri = process.env.OSU_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Error("OSU_CLIENT_ID and OSU_REDIRECT_URI must be set");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify public",
    state,
  });

  return `${OSU_AUTHORIZE_URL}?${params.toString()}`;
}
