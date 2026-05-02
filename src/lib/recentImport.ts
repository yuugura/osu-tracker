import { generateAiSessionSummary } from "@/lib/aiSessionSummary";
import { fetchOsuMe, fetchRecentOsuScores, refreshOsuToken } from "@/lib/osuApi";
import {
  getDefaultSessionName,
  getRecentSessionCutoff,
  mapRecentScoreToPlay,
} from "@/lib/playImport";
import { PlayModel } from "@/models/Play";
import { SessionModel } from "@/models/Session";
import { UserModel } from "@/models/User";

const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

type ImportUserInput = {
  osuUserId: string;
  userId: string;
};

type ImportUserResult = Awaited<ReturnType<typeof importRecentPlaysForUser>>;
type ImportAllUsersResult =
  | {
      ok: true;
      result: ImportUserResult;
    }
  | {
      error: string;
      ok: false;
      userId: string;
    };

export async function importRecentPlaysForUser({
  osuUserId,
  userId,
}: ImportUserInput) {
  const { accessToken, aiSummariesEnabled } = await getImportUserSettings(userId);
  const [profile, recentScores] = await Promise.all([
    fetchOsuMe(accessToken),
    fetchRecentOsuScores(accessToken, osuUserId),
  ]);
  const failedScoreCount = recentScores.filter(isFailedScore).length;
  const now = new Date();
  const session = await SessionModel.findOneAndUpdate(
    {
      userId,
      createdAt: { $gte: getRecentSessionCutoff(now) },
    },
    {
      $setOnInsert: {
        userId,
        name: getDefaultSessionName(now),
      },
    },
    {
      returnDocument: "after",
      setDefaultsOnInsert: true,
      sort: { createdAt: -1 },
      upsert: true,
    },
  );

  const mappedPlays = recentScores.map((score) =>
    mapRecentScoreToPlay({
      score,
      sessionId: session._id,
      userId,
    }),
  );

  if (mappedPlays.length > 0) {
    await PlayModel.bulkWrite(
      mappedPlays.map((play) => ({
        updateOne: {
          filter: {
            osuScoreId: play.osuScoreId,
            sessionId: session._id,
            userId,
          },
          update: {
            $setOnInsert: play,
          },
          upsert: true,
        },
      })),
    );
  }

  const importedCount =
    mappedPlays.length === 0
      ? 0
      : await PlayModel.countDocuments({
          osuScoreId: {
            $in: mappedPlays.map((play) => play.osuScoreId),
          },
          sessionId: session._id,
          userId,
        });
  const sessionUpdate: Record<string, unknown> = {
    lastImportAt: now,
    lastImportFailedScoreCount: failedScoreCount,
    lastImportScoreCount: recentScores.length,
    profileGradeCounts: profile.statistics?.grade_counts,
    profilePlayCount: profile.statistics?.play_count,
    profilePlayTime: profile.statistics?.play_time,
    profilePp: profile.statistics?.pp,
  };
  const sessionPlays = await PlayModel.find({
    sessionId: session._id,
    userId,
  })
    .sort({ playedAt: -1 })
    .lean();

  if (aiSummariesEnabled && sessionPlays.length > 0) {
    try {
      const summary = await generateAiSessionSummary(sessionPlays);

      sessionUpdate.aiSummary = {
        generatedAt: new Date(),
        model: summary.model,
        text: summary.text,
      };
    } catch (error) {
      console.error("Could not generate AI session summary after import", error);
    }
  }

  await SessionModel.updateOne({ _id: session._id }, { $set: sessionUpdate });

  return {
    importedCount,
    recentScoreCount: recentScores.length,
    sessionId: session._id.toString(),
    userId,
  };
}

export async function importRecentPlaysForAllUsers() {
  const users = await UserModel.find({
    accessToken: { $exists: true, $ne: null },
    osuUserId: { $exists: true },
  })
    .select("_id osuUserId")
    .lean();
  const results: ImportAllUsersResult[] = [];

  for (const user of users) {
    try {
      results.push({
        ok: true,
        result: await importRecentPlaysForUser({
          osuUserId: user.osuUserId,
          userId: user._id.toString(),
        }),
      });
    } catch (error) {
      console.error(`Automatic import failed for user ${user._id.toString()}`, error);
      results.push({
        error: error instanceof Error ? error.message : "Unknown import error",
        ok: false,
        userId: user._id.toString(),
      });
    }
  }

  return {
    results,
    userCount: users.length,
  };
}

export function summarizeImportResults(
  results: ImportAllUsersResult[],
) {
  const successes = results.filter((result) => result.ok);
  const failures = results.filter((result) => !result.ok);

  return {
    failureCount: failures.length,
    failures: failures.map((failure) => ({
      error: "error" in failure ? failure.error : "Unknown import error",
      userId: "userId" in failure ? failure.userId : undefined,
    })),
    importedPlayCount: successes.reduce(
      (total, result) => total + result.result.importedCount,
      0,
    ),
    recentScoreCount: successes.reduce(
      (total, result) => total + result.result.recentScoreCount,
      0,
    ),
    successCount: successes.length,
  };
}

async function getImportUserSettings(userId: string) {
  const user = await UserModel.findById(userId).select(
    "accessToken refreshToken tokenExpiresAt aiSummariesEnabled",
  );

  if (!user?.accessToken) {
    throw new Error("osu! account needs to be connected again");
  }

  const tokenExpiresAt = user.tokenExpiresAt?.getTime() ?? 0;

  if (tokenExpiresAt > Date.now() + TOKEN_REFRESH_BUFFER_MS) {
    return {
      accessToken: user.accessToken,
      aiSummariesEnabled: user.aiSummariesEnabled !== false,
    };
  }

  if (!user.refreshToken) {
    throw new Error("osu! refresh token is missing");
  }

  const token = await refreshOsuToken(user.refreshToken);

  user.accessToken = token.access_token;
  user.refreshToken = token.refresh_token;
  user.tokenExpiresAt = new Date(Date.now() + token.expires_in * 1000);
  await user.save();

  return {
    accessToken: user.accessToken,
    aiSummariesEnabled: user.aiSummariesEnabled !== false,
  };
}

function isFailedScore(score: { rank: string; passed?: boolean }) {
  return score.rank === "F" || score.passed === false;
}
