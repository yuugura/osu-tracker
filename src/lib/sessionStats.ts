type SessionStatsPlay = {
  accuracy?: number | null;
  beatmapLength?: number | null;
  passed?: boolean | null;
  playedAt?: Date | null;
  pp?: number | null;
  rank?: string | null;
  score?: number | null;
};

const RANKS = ["XH", "X", "SH", "S", "A", "B", "C", "D", "F"] as const;
const RANK_LABELS: Record<(typeof RANKS)[number], string> = {
  A: "A",
  B: "B",
  C: "C",
  D: "D",
  F: "F",
  S: "S",
  SH: "S+",
  X: "SS",
  XH: "SS+",
};

export function getSessionStats(plays: SessionStatsPlay[]) {
  const rankCounts = Object.fromEntries(RANKS.map((rank) => [rank, 0])) as Record<
    (typeof RANKS)[number],
    number
  >;

  let accuracyTotal = 0;
  let accuracyCount = 0;
  let beatmapLengthSeconds = 0;
  let failedCount = 0;
  let passedCount = 0;
  let ppTotal = 0;
  let ppCount = 0;
  let scoreTotal = 0;
  let firstPlayAt: Date | null = null;
  let lastPlayAt: Date | null = null;

  for (const play of plays) {
    const rank = normalizeRank(play.rank, play.passed);

    rankCounts[rank] += 1;

    if (rank === "F" || play.passed === false) {
      failedCount += 1;
    } else {
      passedCount += 1;
    }

    if (typeof play.accuracy === "number") {
      accuracyTotal += play.accuracy;
      accuracyCount += 1;
    }

    if (typeof play.beatmapLength === "number") {
      beatmapLengthSeconds += play.beatmapLength;
    }

    if (typeof play.pp === "number") {
      ppTotal += play.pp;
      ppCount += 1;
    }

    if (typeof play.score === "number") {
      scoreTotal += play.score;
    }

    if (play.playedAt) {
      if (!firstPlayAt || play.playedAt < firstPlayAt) {
        firstPlayAt = play.playedAt;
      }

      if (!lastPlayAt || play.playedAt > lastPlayAt) {
        lastPlayAt = play.playedAt;
      }
    }
  }

  return {
    averageAccuracy: accuracyCount > 0 ? accuracyTotal / accuracyCount : null,
    beatmapLengthSeconds,
    failedCount,
    firstPlayAt,
    lastPlayAt,
    passedCount,
    playCount: plays.length,
    ppCount,
    ppTotal,
    rankCounts,
    scoreTotal,
    sessionSpanSeconds:
      firstPlayAt && lastPlayAt
        ? Math.max(0, Math.round((lastPlayAt.getTime() - firstPlayAt.getTime()) / 1000))
        : 0,
  };
}

export function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

export function formatRankLabel(rank: string) {
  return RANK_LABELS[rank as (typeof RANKS)[number]] ?? rank;
}

export function formatTotalWithSession(
  total: number | null | undefined,
  sessionValue: number,
  formatValue: (value: number) => string = String,
) {
  if (typeof total !== "number") {
    return `- + ${formatValue(sessionValue)}`;
  }

  return `${formatValue(Math.max(0, total - sessionValue))} + ${formatValue(
    sessionValue,
  )}`;
}

function normalizeRank(rank?: string | null, passed?: boolean | null) {
  if (passed === false) {
    return "F";
  }

  if (rank && RANKS.includes(rank as (typeof RANKS)[number])) {
    return rank as (typeof RANKS)[number];
  }

  return "D";
}
