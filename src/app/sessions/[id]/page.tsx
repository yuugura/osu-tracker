import Link from "next/link";
import { Types } from "mongoose";
import { notFound, redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { connectMongoDB } from "@/lib/mongodb";
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
                        {play.artist ? `${play.artist} - ` : ""}
                        {play.title}
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
                    <Stat label="Rank" value={play.rank ?? "-"} />
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
