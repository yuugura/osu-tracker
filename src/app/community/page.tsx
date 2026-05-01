import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { connectMongoDB } from "@/lib/mongodb";
import { PlayModel } from "@/models/Play";

type VolumeLeader = {
  failedCount: number;
  osuUserId: string;
  passedCount: number;
  playCount: number;
  userId: string;
  username: string;
};

type PpLeader = {
  accuracy: number | null;
  artist: string | null;
  difficulty: string | null;
  mods: string[];
  osuScoreUrl: string | null;
  osuUserId: string;
  playedAtLabel: string | null;
  pp: number;
  rank: string | null;
  title: string;
  userId: string;
  username: string;
};

type TrendingMap = {
  artist: string | null;
  averageAccuracy: number | null;
  beatmapId: string | null;
  difficulty: string | null;
  failedCount: number;
  playCount: number;
  playerCount: number;
  title: string;
  topPp: number | null;
};

export default async function CommunityPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/");
  }

  await connectMongoDB();

  const [
    volume24h,
    volume7d,
    pp24h,
    pp7d,
    ppAll,
    trendingMaps24h,
    trendingMaps7d,
  ] = await Promise.all([
    getVolumeLeaders(1),
    getVolumeLeaders(7),
    getPpLeaders(1),
    getPpLeaders(7),
    getPpLeaders(null),
    getTrendingMaps(1),
    getTrendingMaps(7),
  ]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-12">
      <div className="flex items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-pink-600">
            Community
          </p>
          <h1 className="mt-2 text-3xl font-bold text-zinc-950">
            App user leaderboards
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
            Rankings are based on plays imported by users of this app.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            className="text-sm font-medium text-pink-700"
            href="/dashboard"
          >
            Dashboard
          </Link>
          <form action="/api/auth/logout" method="post">
            <button className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100">
              Log out
            </button>
          </form>
        </div>
      </div>

      <section className="border-b border-zinc-200 py-10">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950">
            Trending maps
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Beatmaps showing up most often in imported app-user plays.
          </p>
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <TrendingMaps title="Trending maps - last 24h" maps={trendingMaps24h} />
          <TrendingMaps title="Trending maps - last 7d" maps={trendingMaps7d} />
        </div>
      </section>

      <section className="grid gap-5 py-10 lg:grid-cols-2">
        <VolumeLeaderboard title="Most plays - last 24h" users={volume24h} />
        <VolumeLeaderboard title="Most plays - last 7d" users={volume7d} />
        <PpLeaderboard title="Highest PP plays - last 24h" plays={pp24h} />
        <PpLeaderboard title="Highest PP plays - last 7d" plays={pp7d} />
        <div className="lg:col-span-2">
          <PpLeaderboard title="Highest PP plays - all imported" plays={ppAll} />
        </div>
      </section>
    </main>
  );
}

function TrendingMaps({
  maps,
  title,
}: {
  maps: TrendingMap[];
  title: string;
}) {
  return (
    <div className="rounded-md border border-zinc-200">
      <div className="border-b border-zinc-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-zinc-950">{title}</h3>
      </div>
      {maps.length > 0 ? (
        <div className="divide-y divide-zinc-200">
          {maps.map((map, index) => (
            <div className="px-4 py-3" key={`${map.beatmapId}-${index}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-950">
                    {index + 1}.{" "}
                    {map.beatmapId ? (
                      <a
                        className="hover:text-pink-700"
                        href={`https://osu.ppy.sh/beatmaps/${map.beatmapId}`}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {formatMapName(map)}
                      </a>
                    ) : (
                      formatMapName(map)
                    )}
                  </p>
                  <p className="mt-1 text-xs text-zinc-600">
                    {[
                      `${map.playerCount} players`,
                      `${map.failedCount} failed`,
                      map.averageAccuracy === null
                        ? null
                        : `${(map.averageAccuracy * 100).toFixed(2)}% avg acc`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-lg font-semibold text-zinc-950">
                    {map.playCount}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {map.topPp === null ? "-" : `${map.topPp.toFixed(2)}pp top`}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyLeaderboard />
      )}
    </div>
  );
}

function VolumeLeaderboard({
  title,
  users,
}: {
  title: string;
  users: VolumeLeader[];
}) {
  return (
    <div className="rounded-md border border-zinc-200">
      <div className="border-b border-zinc-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-950">{title}</h2>
      </div>
      {users.length > 0 ? (
        <div className="divide-y divide-zinc-200">
          {users.map((user, index) => (
            <div
              className="flex items-center justify-between gap-4 px-4 py-3"
              key={user.userId}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-950">
                  {index + 1}.{" "}
                  <a
                    className="hover:text-pink-700"
                    href={`https://osu.ppy.sh/users/${user.osuUserId}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {user.username}
                  </a>
                </p>
                <p className="mt-1 text-xs text-zinc-600">
                  {user.passedCount} passed / {user.failedCount} failed
                </p>
              </div>
              <p className="shrink-0 text-lg font-semibold text-zinc-950">
                {user.playCount}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyLeaderboard />
      )}
    </div>
  );
}

function PpLeaderboard({
  plays,
  title,
}: {
  plays: PpLeader[];
  title: string;
}) {
  return (
    <div className="rounded-md border border-zinc-200">
      <div className="border-b border-zinc-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-950">{title}</h2>
      </div>
      {plays.length > 0 ? (
        <div className="divide-y divide-zinc-200">
          {plays.map((play, index) => (
            <div className="px-4 py-3" key={`${play.userId}-${index}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-950">
                    {index + 1}.{" "}
                    <a
                      className="hover:text-pink-700"
                      href={`https://osu.ppy.sh/users/${play.osuUserId}`}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {play.username}
                    </a>
                  </p>
                  <p className="mt-1 truncate text-sm font-medium text-zinc-800">
                    {play.osuScoreUrl ? (
                      <a
                        className="hover:text-pink-700"
                        href={play.osuScoreUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {formatPlayName(play)}
                      </a>
                    ) : (
                      formatPlayName(play)
                    )}
                  </p>
                  <p className="mt-1 text-xs text-zinc-600">
                    {[
                      play.difficulty,
                      play.mods.length > 0 ? `+${play.mods.join("")}` : null,
                      play.rank,
                      typeof play.accuracy === "number"
                        ? `${(play.accuracy * 100).toFixed(2)}%`
                        : null,
                      play.playedAtLabel,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <p className="shrink-0 text-lg font-semibold text-zinc-950">
                  {play.pp.toFixed(2)}pp
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyLeaderboard />
      )}
    </div>
  );
}

function EmptyLeaderboard() {
  return (
    <div className="px-4 py-5">
      <p className="text-sm leading-6 text-zinc-700">
        No imported plays for this leaderboard yet.
      </p>
    </div>
  );
}

async function getVolumeLeaders(days: number) {
  const cutoff = getRecentCutoffDate(days);
  const rows = await PlayModel.aggregate<VolumeLeader>([
    {
      $match: {
        playedAt: { $gte: cutoff },
      },
    },
    {
      $group: {
        _id: "$userId",
        failedCount: {
          $sum: {
            $cond: [{ $or: [{ $eq: ["$passed", false] }, { $eq: ["$rank", "F"] }] }, 1, 0],
          },
        },
        passedCount: {
          $sum: {
            $cond: [{ $and: [{ $ne: ["$passed", false] }, { $ne: ["$rank", "F"] }] }, 1, 0],
          },
        },
        playCount: { $sum: 1 },
      },
    },
    { $sort: { playCount: -1, passedCount: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        as: "user",
        foreignField: "_id",
        from: "users",
        localField: "_id",
      },
    },
    { $unwind: "$user" },
    {
      $project: {
        _id: 0,
        failedCount: 1,
        osuUserId: "$user.osuUserId",
        passedCount: 1,
        playCount: 1,
        userId: { $toString: "$_id" },
        username: "$user.username",
      },
    },
  ]);

  return rows;
}

async function getPpLeaders(days: number | null) {
  const match: Record<string, unknown> = {
    pp: { $type: "number" },
  };

  if (days !== null) {
    match.playedAt = { $gte: getRecentCutoffDate(days) };
  }

  const rows = await PlayModel.aggregate<
    Omit<PpLeader, "playedAtLabel"> & { playedAt: Date | null }
  >([
    { $match: match },
    { $sort: { pp: -1, accuracy: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        as: "user",
        foreignField: "_id",
        from: "users",
        localField: "userId",
      },
    },
    { $unwind: "$user" },
    {
      $project: {
        _id: 0,
        accuracy: { $ifNull: ["$accuracy", null] },
        artist: { $ifNull: ["$artist", null] },
        difficulty: { $ifNull: ["$difficulty", null] },
        mods: { $ifNull: ["$mods", []] },
        osuScoreUrl: { $ifNull: ["$osuScoreUrl", null] },
        osuUserId: "$user.osuUserId",
        playedAt: { $ifNull: ["$playedAt", null] },
        pp: "$pp",
        rank: { $ifNull: ["$rank", null] },
        title: "$title",
        userId: { $toString: "$userId" },
        username: "$user.username",
      },
    },
  ]);

  return rows.map((row) => ({
    ...row,
    playedAtLabel: row.playedAt ? row.playedAt.toLocaleString() : null,
  }));
}

async function getTrendingMaps(days: number) {
  const rows = await PlayModel.aggregate<
    Omit<TrendingMap, "playerCount"> & { userIds: unknown[] }
  >([
    {
      $match: {
        playedAt: { $gte: getRecentCutoffDate(days) },
      },
    },
    {
      $group: {
        _id: {
          beatmapId: { $ifNull: ["$beatmapId", null] },
          difficulty: { $ifNull: ["$difficulty", null] },
          title: "$title",
        },
        accuracyCount: {
          $sum: {
            $cond: [{ $eq: [{ $type: "$accuracy" }, "double"] }, 1, 0],
          },
        },
        accuracyTotal: {
          $sum: {
            $cond: [{ $eq: [{ $type: "$accuracy" }, "double"] }, "$accuracy", 0],
          },
        },
        artist: { $first: { $ifNull: ["$artist", null] } },
        failedCount: {
          $sum: {
            $cond: [
              { $or: [{ $eq: ["$passed", false] }, { $eq: ["$rank", "F"] }] },
              1,
              0,
            ],
          },
        },
        playCount: { $sum: 1 },
        topPp: { $max: "$pp" },
        userIds: { $addToSet: "$userId" },
      },
    },
    { $sort: { playCount: -1, topPp: -1 } },
    { $limit: 10 },
    {
      $project: {
        _id: 0,
        artist: 1,
        averageAccuracy: {
          $cond: [
            { $gt: ["$accuracyCount", 0] },
            { $divide: ["$accuracyTotal", "$accuracyCount"] },
            null,
          ],
        },
        beatmapId: "$_id.beatmapId",
        difficulty: "$_id.difficulty",
        failedCount: 1,
        playCount: 1,
        title: "$_id.title",
        topPp: { $ifNull: ["$topPp", null] },
        userIds: 1,
      },
    },
  ]);

  return rows.map((row) => ({
    ...row,
    playerCount: row.userIds.length,
  }));
}

function getRecentCutoffDate(days: number) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return cutoff;
}

function formatPlayName(play: PpLeader) {
  return `${play.artist ? `${play.artist} - ` : ""}${play.title}`;
}

function formatMapName(map: TrendingMap) {
  return `${map.artist ? `${map.artist} - ` : ""}${map.title}${
    map.difficulty ? ` [${map.difficulty}]` : ""
  }`;
}
