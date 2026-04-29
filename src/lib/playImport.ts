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
    osuScoreId: getScoreImportId(score),
    beatmapId: getBeatmapId(score),
    title: score.beatmapset?.title ?? getFallbackTitle(score),
    artist: score.beatmapset?.artist,
    difficulty: score.beatmap?.version,
    score: getScoreValue(score),
    passed: score.passed,
    accuracy: score.accuracy,
    rank: score.passed === false ? "F" : score.rank,
    mods: normalizeMods(score.mods),
    playedAt: getPlayedAt(score),
  };
}

export function getDefaultSessionName(date = new Date()) {
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(date);

  return `Recent plays - ${formattedDate}`;
}

export function getRecentSessionCutoff(date = new Date()) {
  const cutoff = new Date(date);
  cutoff.setHours(cutoff.getHours() - 24);

  return cutoff;
}

function getFallbackTitle(score: OsuRecentScore) {
  const beatmapId = getBeatmapId(score);

  return beatmapId ? `Beatmap ${beatmapId}` : "Unknown beatmap";
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

function getScoreImportId(score: OsuRecentScore) {
  if (score.id) {
    return String(score.id);
  }

  if (score.legacy_score_id) {
    return `legacy:${score.legacy_score_id}`;
  }

  if (score.best_id) {
    return `best:${score.best_id}`;
  }

  return [
    "recent",
    getBeatmapId(score) ?? "unknown-map",
    score.created_at ?? score.ended_at ?? "unknown-time",
    getScoreValue(score) ?? "unknown-score",
    score.rank,
    normalizeMods(score.mods).join(""),
  ].join(":");
}

function getBeatmapId(score: OsuRecentScore) {
  const beatmapId = score.beatmap?.id ?? score.beatmap_id;

  return beatmapId ? String(beatmapId) : undefined;
}

function getPlayedAt(score: OsuRecentScore) {
  const playedAt = score.created_at ?? score.ended_at;

  return playedAt ? new Date(playedAt) : undefined;
}

function getScoreValue(score: OsuRecentScore) {
  return (
    score.score ??
    score.total_score ??
    score.legacy_total_score ??
    score.classic_total_score
  );
}
