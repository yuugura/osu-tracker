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
  statistics?: {
    grade_counts?: {
      a?: number;
      s?: number;
      sh?: number;
      ss?: number;
      ssh?: number;
    };
    play_count?: number;
    play_time?: number | null;
    pp?: number | null;
  };
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
  pp?: number | null;
  rank: string;
  mods: Array<string | { acronym?: string }>;
  passed?: boolean;
  created_at?: string;
  ended_at?: string;
  beatmap_id?: number;
  beatmap?: {
    id: number;
    version: string;
    total_length?: number;
    hit_length?: number;
  };
  beatmapset?: {
    artist: string;
    title: string;
  };
};
