export type OsuTokenResponse = {
  token_type: "Bearer";
  expires_in: number;
  access_token: string;
  refresh_token: string;
};

export type OsuUserResponse = {
  id: number;
  username: string;
  avatar_url?: string;
};

export type OsuRecentScore = {
  id: number;
  accuracy: number;
  score: number;
  rank: string;
  mods: Array<string | { acronym?: string }>;
  created_at: string;
  beatmap?: {
    id: number;
    version: string;
  };
  beatmapset?: {
    artist: string;
    title: string;
  };
};
