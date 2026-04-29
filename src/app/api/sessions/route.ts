import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { connectMongoDB } from "@/lib/mongodb";
import { SessionModel } from "@/models/Session";

export const runtime = "nodejs";

export async function GET() {
  const authSession = await getCurrentSession();

  if (!authSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectMongoDB();

  const sessions = await SessionModel.find({ userId: authSession.userId })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ sessions });
}

export async function POST(request: NextRequest) {
  const authSession = await getCurrentSession();

  if (!authSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const name = await getSessionName(request);

  if (!name) {
    return NextResponse.json(
      { error: "Session name is required" },
      { status: 400 },
    );
  }

  await connectMongoDB();

  const session = await SessionModel.create({
    userId: authSession.userId,
    name,
  });

  if (isFormRequest(request)) {
    return NextResponse.redirect(
      new URL(`/sessions/${session._id.toString()}`, request.url),
      { status: 303 },
    );
  }

  return NextResponse.json({ session }, { status: 201 });
}

async function getSessionName(request: NextRequest) {
  if (isFormRequest(request)) {
    const formData = await request.formData();
    const name = formData.get("name");

    return typeof name === "string" ? name.trim() : "";
  }

  const body = (await request.json().catch(() => null)) as {
    name?: unknown;
  } | null;

  return typeof body?.name === "string" ? body.name.trim() : "";
}

function isFormRequest(request: NextRequest) {
  return (
    request.headers.get("content-type")?.includes("application/x-www-form-urlencoded") ||
    request.headers.get("content-type")?.includes("multipart/form-data")
  );
}
