import { Types } from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { connectMongoDB } from "@/lib/mongodb";
import { PlayModel } from "@/models/Play";
import { SessionModel } from "@/models/Session";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/sessions/[id]">,
) {
  const authSession = await getCurrentSession();

  if (!authSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  await connectMongoDB();

  const session = await SessionModel.findOne({
    _id: id,
    userId: authSession.userId,
  }).lean();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const playCount = await PlayModel.countDocuments({
    sessionId: id,
    userId: authSession.userId,
  });

  return NextResponse.json({ session, playCount });
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext<"/api/sessions/[id]">,
) {
  const authSession = await getCurrentSession();

  if (!authSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  await connectMongoDB();

  const deletedSession = await SessionModel.findOneAndDelete({
    _id: id,
    userId: authSession.userId,
  });

  if (!deletedSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  await PlayModel.deleteMany({
    sessionId: id,
    userId: authSession.userId,
  });

  return NextResponse.json({ ok: true });
}
