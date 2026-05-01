import Link from "next/link";
import { Types } from "mongoose";
import { notFound, redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { connectMongoDB } from "@/lib/mongodb";
import {
  formatDuration,
  formatRankLabel,
  formatTotalWithSession,
  getSessionStats,
} from "@/lib/sessionStats";
import { PlayModel } from "@/models/Play";
import { SessionModel } from "@/models/Session";

type SessionPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function SessionPage({ params }: SessionPageProps) {
  const authSession = await getCurrentSession();

  if (!authSession) {
    redirect("/");
  }

  const { id } = await params;

  if (!Types.ObjectId.isValid(id)) {
    notFound();
  }

  await connectMongoDB();

  const session = await SessionModel.findOne({
    _id: id,
    userId: authSession.userId,
  });

  if (!session) {
    notFound();
  }

  const playCount = await PlayModel.countDocuments({
    sessionId: id,
    userId: authSession.userId,
  });
  const plays = await PlayModel.find({
    sessionId: id,
    userId: authSession.userId,
  })
    .sort({ playedAt: -1 })
    .lean();
  const stats = getSessionStats(plays);
  const sessionSsCount = stats.rankCounts.XH + stats.rankCounts.X;
  const sessionSCount = stats.rankCounts.SH + stats.rankCounts.S;
  const profileSsCount =
    (session.profileGradeCounts?.ssh ?? 0) +
    (session.profileGradeCounts?.ss ?? 0);
  const profileSCount =
    (session.profileGradeCounts?.sh ?? 0) +
    (session.profileGradeCounts?.s ?? 0);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-12">
      <Link className="text-sm font-medium text-pink-700" href="/dashboard">
        Back to dashboard
      </Link>

      <header className="mt-8 border-b border-zinc-200 pb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-pink-600">
          Session
        </p>
        <h1 className="mt-2 text-3xl font-bold text-zinc-950">
          {session.name}
        </h1>
        <p className="mt-3 text-sm text-zinc-600">
          {playCount} imported plays
        </p>
        {session.lastImportAt ? (
          <div className="mt-4 grid gap-3 text-sm text-zinc-700 sm:grid-cols-3">
            <Stat
              label="Last import"
              value={session.lastImportAt.toLocaleString()}
            />
            <Stat
              label="Returned"
              value={String(session.lastImportScoreCount ?? 0)}
            />
            <Stat
              label="Failed"
              value={String(session.lastImportFailedScoreCount ?? 0)}
            />
          </div>
        ) : null}
      </header>

      <section className="grid gap-3 border-b border-zinc-200 py-8 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryStat
          label="Play count"
          value={formatTotalWithSession(session.profilePlayCount, stats.playCount)}
        />
        <SummaryStat
          label="Passed / failed"
          value={`${stats.passedCount} / ${stats.failedCount}`}
        />
        <SummaryStat
          label="Average accuracy"
          value={
            stats.averageAccuracy === null
              ? "-"
              : `${(stats.averageAccuracy * 100).toFixed(2)}%`
          }
        />
        <SummaryStat
          label="Total score"
          value={stats.scoreTotal.toLocaleString()}
        />
        <SummaryStat
          label="PP"
          value={formatTotalWithSession(
            session.profilePp,
            stats.ppTotal,
            (value) => value.toFixed(2),
          )}
        />
        <SummaryStat
          label="Session span"
          value={formatDuration(stats.sessionSpanSeconds)}
        />
        <SummaryStat
          label="Play time"
          value={formatTotalWithSession(
            session.profilePlayTime,
            stats.beatmapLengthSeconds,
            formatDuration,
          )}
        />
        <SummaryStat
          label="SS / S / A"
          value={`${Math.max(0, profileSsCount - sessionSsCount)} + ${sessionSsCount} / ${Math.max(0, profileSCount - sessionSCount)} + ${sessionSCount} / ${Math.max(
            0,
            (session.profileGradeCounts?.a ?? 0) - stats.rankCounts.A,
          )} + ${stats.rankCounts.A}`}
        />
      </section>

      <section className="border-b border-zinc-200 py-8">
        <h2 className="text-lg font-semibold text-zinc-950">Ranks</h2>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
          {Object.entries(stats.rankCounts).map(([rank, count]) => (
            <SummaryStat
              key={rank}
              label={formatRankLabel(rank)}
              value={String(count)}
            />
          ))}
        </div>
      </section>

      <section className="py-10">
        <h2 className="text-lg font-semibold text-zinc-950">Plays</h2>
        {plays.length > 0 ? (
          <div className="mt-4 divide-y divide-zinc-200 rounded-md border border-zinc-200">
            {plays.map((play) => (
              <div className="px-4 py-4" key={play._id.toString()}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-zinc-950">
                        {play.osuScoreUrl ? (
                          <a
                            className="hover:text-pink-700"
                            href={play.osuScoreUrl}
                            rel="noreferrer"
                            target="_blank"
                          >
                            {play.artist ? `${play.artist} - ` : ""}
                            {play.title}
                          </a>
                        ) : (
                          <>
                            {play.artist ? `${play.artist} - ` : ""}
                            {play.title}
                          </>
                        )}
                      </h3>
                      {play.rank === "F" || play.passed === false ? (
                        <span className="rounded-sm bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                          Failed
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-zinc-600">
                      {play.difficulty ?? "Unknown difficulty"}
                      {play.mods.length > 0 ? ` +${play.mods.join("")}` : ""}
                    </p>
                    {play.playedAt ? (
                      <p className="mt-1 text-xs text-zinc-500">
                        Played {play.playedAt.toLocaleString()}
                      </p>
                    ) : null}
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-left sm:text-right">
                    <Stat
                      label="Rank"
                      value={play.rank ? formatRankLabel(play.rank) : "-"}
                    />
                    <Stat
                      label="Acc"
                      value={
                        typeof play.accuracy === "number"
                          ? `${(play.accuracy * 100).toFixed(2)}%`
                          : "-"
                      }
                    />
                    <Stat
                      label="Score"
                      value={
                        typeof play.score === "number"
                          ? play.score.toLocaleString()
                          : "-"
                      }
                    />
                    <Stat
                      label="PP"
                      value={
                        typeof play.pp === "number" ? play.pp.toFixed(2) : "-"
                      }
                    />
                  </div>
                  <div className="sm:text-right">
                    {play.osuScoreUrl ? (
                      <a
                        className="inline-flex rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
                        href={play.osuScoreUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        View score
                      </a>
                    ) : (
                      <span className="inline-flex rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-400">
                        No score page
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-md border border-dashed border-zinc-300 p-6">
            <p className="text-sm leading-6 text-zinc-700">
              No plays have been imported into this session yet.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-200 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold text-zinc-950">{value}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-zinc-950">{value}</p>
    </div>
  );
}
