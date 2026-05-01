import { Types } from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { generateAiSessionSummary } from "@/lib/aiSessionSummary";
import { getCurrentSession } from "@/lib/auth";
import { connectMongoDB } from "@/lib/mongodb";
import { PlayModel } from "@/models/Play";
import { SessionModel } from "@/models/Session";

export const runtime = "nodejs";

export async function POST(
  _request: NextRequest,
  context: RouteContext<"/api/sessions/[id]/ai-summary">,
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
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const plays = await PlayModel.find({
    sessionId: id,
    userId: authSession.userId,
  })
    .sort({ playedAt: -1 })
    .lean();

  if (plays.length === 0) {
    return NextResponse.json(
      { error: "Import plays before generating a summary." },
      { status: 400 },
    );
  }

  try {
    const summary = await generateAiSessionSummary(plays);
    const generatedAt = new Date();

    session.aiSummary = {
      generatedAt,
      model: summary.model,
      text: summary.text,
    };
    await session.save();

    return NextResponse.json({
      summary: {
        generatedAt: generatedAt.toISOString(),
        model: summary.model,
        text: summary.text,
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Could not generate an AI summary right now." },
      { status: 502 },
    );
  }
}
