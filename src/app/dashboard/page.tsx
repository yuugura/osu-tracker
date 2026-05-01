import Link from "next/link";
import { redirect } from "next/navigation";
import { AutoImportRecentPlays } from "@/components/AutoImportRecentPlays";
import {
  DashboardSessionSearch,
  type DashboardSearchSession,
} from "@/components/DashboardSessionSearch";
import {
  DashboardHighlights,
  type DashboardHighlightPlay,
  type DashboardHighlightTimeframe,
  type DashboardHighlightTimeframeKey,
} from "@/components/DashboardHighlights";
import {
  SessionStatsChart,
  type SessionChartPoint,
} from "@/components/SessionStatsChart";
import { getCurrentSession } from "@/lib/auth";
import { connectMongoDB } from "@/lib/mongodb";
import { getSessionStats } from "@/lib/sessionStats";
import { PlayModel } from "@/models/Play";
import { SessionModel } from "@/models/Session";

export default async function DashboardPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/");
  }

  await connectMongoDB();

  const sessions = await SessionModel.find({ userId: session.userId }).sort({
    createdAt: -1,
  });
  const sessionIds = sessions.map((osuSession) => osuSession._id);
  const plays = await PlayModel.find({
    sessionId: { $in: sessionIds },
    userId: session.userId,
  }).lean();
  const playsBySessionId = new Map<string, typeof plays>();
  const sessionNameById = new Map(
    sessions.map((osuSession) => [osuSession._id.toString(), osuSession.name]),
  );

  for (const play of plays) {
    const sessionId = play.sessionId.toString();
    const sessionPlays = playsBySessionId.get(sessionId) ?? [];

    sessionPlays.push(play);
    playsBySessionId.set(sessionId, sessionPlays);
  }

  const chartData: SessionChartPoint[] = sessions
    .slice()
    .reverse()
    .map((osuSession) => {
      const sessionStats = getSessionStats(
        playsBySessionId.get(osuSession._id.toString()) ?? [],
      );

      return {
        averageAccuracy: sessionStats.averageAccuracy,
        date: osuSession.createdAt.toLocaleDateString(),
        failedCount: sessionStats.failedCount,
        id: osuSession._id.toString(),
        name: osuSession.name,
        passedCount: sessionStats.passedCount,
        playCount: sessionStats.playCount,
        playtimeSeconds: sessionStats.beatmapLengthSeconds,
        ppTotal: sessionStats.ppTotal,
        scoreTotal: sessionStats.scoreTotal,
      };
    });
  const searchableSessions: DashboardSearchSession[] = sessions.map(
    (osuSession) => {
      const sessionPlays = playsBySessionId.get(osuSession._id.toString()) ?? [];

      return {
        createdAtLabel: osuSession.createdAt.toLocaleDateString(),
        id: osuSession._id.toString(),
        name: osuSession.name,
        playCount: sessionPlays.length,
        plays: sessionPlays.map((play) => ({
          artist: play.artist ?? null,
          beatmapId: play.beatmapId ?? null,
          difficulty: play.difficulty ?? null,
          mapper: play.mapper ?? null,
          mods: play.mods ?? [],
          rank: play.rank ?? null,
          tags: play.tags ?? [],
          title: play.title,
        })),
      };
    },
  );
  const playsWithSession = plays.map((play) => {
    const sessionId = play.sessionId.toString();

    return {
      accuracy: play.accuracy ?? null,
      artist: play.artist ?? null,
      beatmapId: play.beatmapId ?? null,
      difficulty: play.difficulty ?? null,
      id: play._id.toString(),
      mods: play.mods ?? [],
      osuScoreUrl: play.osuScoreUrl ?? null,
      passed: play.passed ?? null,
      playedAt: play.playedAt ?? null,
      playedAtLabel: play.playedAt ? play.playedAt.toLocaleString() : null,
      pp: play.pp ?? null,
      rank: play.rank ?? null,
      sessionId,
      sessionName: sessionNameById.get(sessionId) ?? "Session",
      title: play.title,
    };
  });
  const highlights = getDashboardHighlights(playsWithSession);
  const latestImportedSession = sessions.find((osuSession) =>
    Boolean(osuSession.lastImportAt),
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-12">
      <AutoImportRecentPlays />
      <div className="flex items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-pink-600">
            Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-bold text-zinc-950">
            Your osu! sessions
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            className="text-sm font-medium text-pink-700"
            href="/community"
          >
            Community
          </Link>
          <form action="/api/auth/logout" method="post">
            <button className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100">
              Log out
            </button>
          </form>
        </div>
      </div>

      <SessionStatsChart data={chartData} />
      <DashboardHighlights highlights={highlights} />

      <section className="grid gap-8 py-10 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <ImportStatusPanel session={latestImportedSession} />
          <form
            action="/api/sessions/import-recent"
            className="h-fit rounded-md border border-zinc-200 p-5"
            method="post"
          >
            <h2 className="text-lg font-semibold text-zinc-950">
              Import recent plays
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-700">
              Uses your current 24-hour session, or creates one if needed.
            </p>
            <button className="mt-5 w-full rounded-md bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-pink-700">
              Import now
            </button>
          </form>
        </div>

        <div>
          {sessions.length > 0 ? (
            <DashboardSessionSearch sessions={searchableSessions} />
          ) : (
            <div className="mt-4 rounded-md border border-dashed border-zinc-300 p-6">
              <p className="text-sm leading-6 text-zinc-700">
                No sessions yet. Import recent plays to start tracking.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function ImportStatusPanel({
  session,
}: {
  session: ImportStatusSession | null | undefined;
}) {
  return (
    <section className="rounded-md border border-zinc-200 p-5">
      <h2 className="text-lg font-semibold text-zinc-950">Import status</h2>
      {session?.lastImportAt ? (
        <>
          <p className="mt-2 text-sm leading-6 text-zinc-700">
            Last imported {session.lastImportAt.toLocaleString()}.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <SmallStat
              label="Returned"
              value={String(session.lastImportScoreCount ?? 0)}
            />
            <SmallStat
              label="Failed"
              value={String(session.lastImportFailedScoreCount ?? 0)}
            />
          </div>
          <p className="mt-4 text-xs leading-5 text-zinc-500">
            AI summary{" "}
            {session.aiSummary?.generatedAt
              ? `generated ${session.aiSummary.generatedAt.toLocaleString()}`
              : "not generated yet"}
          </p>
        </>
      ) : (
        <p className="mt-2 text-sm leading-6 text-zinc-700">
          No imports have completed yet.
        </p>
      )}
    </section>
  );
}

type ImportStatusSession = {
  aiSummary?: {
    generatedAt?: Date | null;
  } | null;
  lastImportAt?: Date | null;
  lastImportFailedScoreCount?: number | null;
  lastImportScoreCount?: number | null;
};

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-200 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-zinc-950">{value}</p>
    </div>
  );
}

type DashboardPlayWithSession = DashboardHighlightPlay & {
  passed: boolean | null;
  playedAt: Date | null;
};

function getDashboardHighlights(plays: DashboardPlayWithSession[]) {
  return {
    "24h": getHighlightTimeframe(plays, "Last 24h", 1),
    "7d": getHighlightTimeframe(plays, "Last 7d", 7),
    all: getHighlightTimeframe(plays, "All imported", null),
  } satisfies Record<DashboardHighlightTimeframeKey, DashboardHighlightTimeframe>;
}

function getHighlightTimeframe(
  plays: DashboardPlayWithSession[],
  label: string,
  days: number | null,
) {
  const cutoff = days === null ? null : getRecentCutoffTime(days);
  const timeframePlays =
    cutoff === null
      ? plays
      : plays.filter(
          (play) => play.playedAt && play.playedAt.getTime() >= cutoff,
        );
  const failedPlays = timeframePlays.filter(isFailedPlay);

  return {
    bestAccuracy: getBestAccuracyPlays(timeframePlays, 5),
    failedCount: failedPlays.length,
    failedPlays: getRetryMaps(failedPlays, 5),
    label,
    passedCount: timeframePlays.filter((play) => !isFailedPlay(play)).length,
    playCount: timeframePlays.length,
    topPp: getTopPpPlays(timeframePlays, 5),
  };
}

function getTopPpPlays(plays: DashboardPlayWithSession[], limit: number) {
  return plays
    .filter((play) => typeof play.pp === "number")
    .sort((a, b) => (b.pp ?? 0) - (a.pp ?? 0))
    .slice(0, limit)
    .map(toHighlightPlay);
}

function getBestAccuracyPlays(
  plays: DashboardPlayWithSession[],
  limit: number,
) {
  return plays
    .filter((play) => typeof play.accuracy === "number" && !isFailedPlay(play))
    .sort((a, b) => {
      const accuracyDifference = (b.accuracy ?? 0) - (a.accuracy ?? 0);

      if (accuracyDifference !== 0) {
        return accuracyDifference;
      }

      return (b.pp ?? 0) - (a.pp ?? 0);
    })
    .slice(0, limit)
    .map(toHighlightPlay);
}

function getRetryMaps(plays: DashboardPlayWithSession[], limit: number) {
  const retryMapByKey = new Map<string, DashboardPlayWithSession>();

  for (const play of plays) {
    const key = getMapKey(play);
    const existingPlay = retryMapByKey.get(key);

    if (
      !existingPlay ||
      (play.playedAt?.getTime() ?? 0) > (existingPlay.playedAt?.getTime() ?? 0)
    ) {
      retryMapByKey.set(key, play);
    }
  }

  return [...retryMapByKey.values()]
    .sort((a, b) => (b.playedAt?.getTime() ?? 0) - (a.playedAt?.getTime() ?? 0))
    .slice(0, limit)
    .map(toHighlightPlay);
}

function toHighlightPlay(
  play: DashboardPlayWithSession,
): DashboardHighlightPlay {
  return {
    accuracy: play.accuracy,
    artist: play.artist,
    beatmapId: play.beatmapId,
    difficulty: play.difficulty,
    id: play.id,
    mods: play.mods,
    osuScoreUrl: play.osuScoreUrl,
    playedAtLabel: play.playedAtLabel,
    pp: play.pp,
    rank: play.rank,
    sessionId: play.sessionId,
    sessionName: play.sessionName,
    title: play.title,
  };
}

function isFailedPlay(play: DashboardPlayWithSession) {
  return play.passed === false || play.rank === "F";
}

function getMapKey(play: DashboardPlayWithSession) {
  if (play.beatmapId) {
    return `beatmap:${play.beatmapId}`;
  }

  return [
    play.artist ?? "",
    play.title,
    play.difficulty ?? "",
  ]
    .join(":")
    .toLowerCase();
}

function getRecentCutoffTime(days: number) {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}
