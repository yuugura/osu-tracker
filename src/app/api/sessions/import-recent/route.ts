import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { connectMongoDB } from "@/lib/mongodb";
import { importRecentPlaysForUser } from "@/lib/recentImport";
import { ImportRunModel } from "@/models/ImportRun";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const authSession = await getCurrentSession();

  if (!authSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectMongoDB();
  const startedAt = new Date();
  const trigger = isFormRequest(request) ? "manual" : "dashboard-auto";
  const importRun = await ImportRunModel.create({
    startedAt,
    status: "running",
    trigger,
    userCount: 1,
  });
  let result: Awaited<ReturnType<typeof importRecentPlaysForUser>>;

  try {
    result = await importRecentPlaysForUser({
      osuUserId: authSession.osuUserId,
      userId: authSession.userId,
    });

    await ImportRunModel.updateOne(
      { _id: importRun._id },
      {
        $set: {
          failureCount: 0,
          finishedAt: new Date(),
          importedPlayCount: result.importedCount,
          recentScoreCount: result.recentScoreCount,
          status: "success",
          successCount: 1,
        },
      },
    );
  } catch (error) {
    await ImportRunModel.updateOne(
      { _id: importRun._id },
      {
        $set: {
          failureCount: 1,
          failures: [
            {
              error: error instanceof Error ? error.message : "Unknown import error",
              userId: authSession.userId,
            },
          ],
          finishedAt: new Date(),
          status: "failed",
          successCount: 0,
        },
      },
    );

    throw error;
  }

  if (isFormRequest(request)) {
    return NextResponse.redirect(
      new URL(`/sessions/${result.sessionId}`, request.url),
      { status: 303 },
    );
  }

  return NextResponse.json(
    {
      importedCount: result.importedCount,
      importRunId: importRun._id.toString(),
      sessionId: result.sessionId,
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
