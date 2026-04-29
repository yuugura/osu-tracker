import type { Types } from "mongoose";
import type { OsuRecentScore } from "@/types/osu";

type PlayImportInput = {
  score: OsuRecentScore;
  sessionId: Types.ObjectId;
  userId: string;
};

export function mapRecentScoreToPlay({
  score,
  sessionId,
  userId,
}: PlayImportInput) {
  return {
    userId,
    sessionId,
    osuScoreId: String(score.id),
    beatmapId: score.beatmap?.id ? String(score.beatmap.id) : undefined,
    title: score.beatmapset?.title ?? getFallbackTitle(score),
    artist: score.beatmapset?.artist,
    difficulty: score.beatmap?.version,
    score: score.score,
    accuracy: score.accuracy,
    rank: score.rank,
    mods: normalizeMods(score.mods),
    playedAt: score.created_at ? new Date(score.created_at) : undefined,
  };
}

export function getDefaultSessionName(date = new Date()) {
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);

  return `Recent plays - ${formattedDate}`;
}

function getFallbackTitle(score: OsuRecentScore) {
  return score.beatmap?.id ? `Beatmap ${score.beatmap.id}` : "Unknown beatmap";
}

function normalizeMods(mods: OsuRecentScore["mods"]) {
  return mods
    .map((mod) => {
      if (typeof mod === "string") {
        return mod;
      }

      return mod.acronym;
    })
    .filter((mod): mod is string => Boolean(mod));
}
