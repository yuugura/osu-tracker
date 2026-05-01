import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { connectMongoDB } from "@/lib/mongodb";
import { importRecentPlaysForUser } from "@/lib/recentImport";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const authSession = await getCurrentSession();

  if (!authSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectMongoDB();
  const result = await importRecentPlaysForUser({
    osuUserId: authSession.osuUserId,
    userId: authSession.userId,
  });

  if (isFormRequest(request)) {
    return NextResponse.redirect(
      new URL(`/sessions/${result.sessionId}`, request.url),
      { status: 303 },
    );
  }

  return NextResponse.json(
    {
      importedCount: result.importedCount,
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
