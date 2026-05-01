import { Types } from "mongoose";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import {
  SessionPlaySearch,
  type SearchablePlay,
} from "@/components/SessionPlaySearch";
import { SessionAiSummary } from "@/components/SessionAiSummary";
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
  const searchablePlays: SearchablePlay[] = plays.map((play) => ({
    accuracy: play.accuracy ?? null,
    artist: play.artist ?? null,
    beatmapId: play.beatmapId ?? null,
    difficulty: play.difficulty ?? null,
    id: play._id.toString(),
    mapper: play.mapper ?? null,
    mods: play.mods ?? [],
    osuScoreUrl: play.osuScoreUrl ?? null,
    passed: play.passed ?? null,
    playedAtLabel: play.playedAt ? play.playedAt.toLocaleString() : null,
    pp: play.pp ?? null,
    rank: play.rank ?? null,
    score: play.score ?? null,
    tags: play.tags ?? [],
    title: play.title,
  }));
  const sessionSsCount = stats.rankCounts.XH + stats.rankCounts.X;
  const sessionSCount = stats.rankCounts.SH + stats.rankCounts.S;
  const profileSsCount =
    (session.profileGradeCounts?.ssh ?? 0) +
    (session.profileGradeCounts?.ss ?? 0);
  const profileSCount =
    (session.profileGradeCounts?.sh ?? 0) +
    (session.profileGradeCounts?.s ?? 0);

  return (
    <AppShell
      activeSection="session"
      backHref="/dashboard"
      backLabel="Back to dashboard"
      description={`${playCount} imported plays`}
      eyebrow="Session"
      headerMeta={
        session.lastImportAt ? (
          <div className="mt-4 grid gap-3 text-sm text-zinc-300 sm:grid-cols-3">
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
        ) : null
      }
      title={session.name}
    >
      <section className="grid gap-3 border-b border-zinc-800 py-8 sm:grid-cols-2 lg:grid-cols-4">
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

      <SessionAiSummary
        initialSummary={{
          generatedAt: session.aiSummary?.generatedAt
            ? session.aiSummary.generatedAt.toISOString()
            : null,
          model: session.aiSummary?.model ?? null,
          text: session.aiSummary?.text ?? null,
        }}
        playCount={playCount}
      />

      <section className="border-b border-zinc-800 py-8">
        <h2 className="text-lg font-semibold text-zinc-50">Ranks</h2>
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

      {plays.length > 0 ? (
        <SessionPlaySearch plays={searchablePlays} />
      ) : (
        <section className="py-10">
          <h2 className="text-lg font-semibold text-zinc-50">Plays</h2>
          <div className="mt-4 rounded-md border border-dashed border-zinc-700 p-6">
            <p className="text-sm leading-6 text-zinc-400">
              No plays have been imported into this session yet.
            </p>
          </div>
        </section>
      )}
    </AppShell>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold text-zinc-50">{value}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-zinc-50">{value}</p>
    </div>
  );
}
