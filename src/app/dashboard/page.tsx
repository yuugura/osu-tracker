import { redirect } from "next/navigation";
import { AutoImportRecentPlays } from "@/components/AutoImportRecentPlays";
import {
  DashboardSessionSearch,
  type DashboardSearchSession,
} from "@/components/DashboardSessionSearch";
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
        <form action="/api/auth/logout" method="post">
          <button className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100">
            Log out
          </button>
        </form>
      </div>

      <SessionStatsChart data={chartData} />

      <section className="grid gap-8 py-10 lg:grid-cols-[320px_1fr]">
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
