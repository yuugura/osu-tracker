import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { connectMongoDB } from "@/lib/mongodb";
import { fetchRecentOsuScores } from "@/lib/osuApi";
import { getDefaultSessionName, mapRecentScoreToPlay } from "@/lib/playImport";
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

  const recentScores = await fetchRecentOsuScores(user.accessToken);
  const session = await SessionModel.create({
    userId: authSession.userId,
    name: getDefaultSessionName(),
  });

  if (recentScores.length > 0) {
    await PlayModel.insertMany(
      recentScores.map((score) =>
        mapRecentScoreToPlay({
          score,
          sessionId: session._id,
          userId: authSession.userId,
        }),
      ),
    );
  }

  if (isFormRequest(request)) {
    return NextResponse.redirect(
      new URL(`/sessions/${session._id.toString()}`, request.url),
      { status: 303 },
    );
  }

  return NextResponse.json(
    {
      session,
      importedCount: recentScores.length,
    },
    { status: 201 },
  );
}

function isFormRequest(request: NextRequest) {
  return (
    request.headers
      .get("content-type")
      ?.includes("application/x-www-form-urlencoded") ||
    request.headers.get("content-type")?.includes("multipart/form-data")
  );
}
