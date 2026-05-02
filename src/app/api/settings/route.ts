import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { connectMongoDB } from "@/lib/mongodb";
import { UserModel } from "@/models/User";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const aiSummariesEnabled = formData.get("aiSummariesEnabled") === "on";

  await connectMongoDB();
  await UserModel.updateOne(
    { _id: session.userId },
    {
      $set: {
        aiSummariesEnabled,
      },
    },
  );

  return NextResponse.redirect(new URL("/settings?saved=1", request.url), {
    status: 303,
  });
}
