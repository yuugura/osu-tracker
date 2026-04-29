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
  id?: number | null;
  best_id?: number | null;
  legacy_score_id?: number | null;
  accuracy: number;
  score?: number;
  total_score?: number;
  legacy_total_score?: number;
  classic_total_score?: number;
  rank: string;
  mods: Array<string | { acronym?: string }>;
  passed?: boolean;
  created_at?: string;
  ended_at?: string;
  beatmap_id?: number;
  beatmap?: {
    id: number;
    version: string;
  };
  beatmapset?: {
    artist: string;
    title: string;
  };
};
