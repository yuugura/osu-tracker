import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { connectMongoDB } from "@/lib/mongodb";
import { fetchOsuMe, fetchRecentOsuScores } from "@/lib/osuApi";
import {
  getDefaultSessionName,
  getRecentSessionCutoff,
  mapRecentScoreToPlay,
} from "@/lib/playImport";
import { PlayModel } from "@/models/Play";
import { SessionModel } from "@/models/Session";
import { UserModel } from "@/models/User";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const authSession = await getCurrentSession();

  if (!authSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectMongoDB();

  const user = await UserModel.findById(authSession.userId).select(
    "accessToken",
  );

  if (!user?.accessToken) {
    return NextResponse.json(
      { error: "osu! account needs to be connected again" },
      { status: 401 },
    );
  }

  const [profile, recentScores] = await Promise.all([
    fetchOsuMe(user.accessToken),
    fetchRecentOsuScores(user.accessToken, authSession.osuUserId),
  ]);
  const failedScoreCount = recentScores.filter(isFailedScore).length;
  const now = new Date();
  const session = await SessionModel.findOneAndUpdate(
    {
      userId: authSession.userId,
      createdAt: { $gte: getRecentSessionCutoff(now) },
    },
    {
      $setOnInsert: {
        userId: authSession.userId,
        name: getDefaultSessionName(now),
      },
    },
    {
      new: true,
      setDefaultsOnInsert: true,
      sort: { createdAt: -1 },
      upsert: true,
    },
  );

  if (recentScores.length > 0) {
    const plays = recentScores.map((score) =>
      mapRecentScoreToPlay({
        score,
        sessionId: session._id,
        userId: authSession.userId,
      }),
    );

    await PlayModel.bulkWrite(
      plays.map((play) => ({
        updateOne: {
          filter: {
            userId: authSession.userId,
            sessionId: session._id,
            osuScoreId: play.osuScoreId,
          },
          update: {
            $setOnInsert: play,
          },
          upsert: true,
        },
      })),
    );
  }

  const importedCount = await PlayModel.countDocuments({
    userId: authSession.userId,
    sessionId: session._id,
    osuScoreId: {
      $in: recentScores.map((score) => mapRecentScoreToPlay({
        score,
        sessionId: session._id,
        userId: authSession.userId,
      }).osuScoreId),
    },
  });
  await SessionModel.updateOne(
    { _id: session._id },
    {
      $set: {
        lastImportAt: now,
        lastImportScoreCount: recentScores.length,
        lastImportFailedScoreCount: failedScoreCount,
        profileGradeCounts: profile.statistics?.grade_counts,
        profilePlayCount: profile.statistics?.play_count,
        profilePlayTime: profile.statistics?.play_time,
        profilePp: profile.statistics?.pp,
      },
    },
  );

  if (isFormRequest(request)) {
    return NextResponse.redirect(
      new URL(`/sessions/${session._id.toString()}`, request.url),
      { status: 303 },
    );
  }

  return NextResponse.json(
    {
      session,
      importedCount,
    },
    { status: 201 },
  );
}

function isFailedScore(score: { rank: string; passed?: boolean }) {
  return score.rank === "F" || score.passed === false;
}

function isFormRequest(request: NextRequest) {
  return (
    request.headers
      .get("content-type")
      ?.includes("application/x-www-form-urlencoded") ||
    request.headers.get("content-type")?.includes("multipart/form-data")
  );
}
