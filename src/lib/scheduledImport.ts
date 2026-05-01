import { importRecentPlaysForAllUsers, summarizeImportResults } from "@/lib/recentImport";
import { ImportRunModel } from "@/models/ImportRun";

export async function runScheduledImport() {
  const importRun = await ImportRunModel.create({
    startedAt: new Date(),
    status: "running",
    trigger: "scheduler",
  });

  try {
    const result = await importRecentPlaysForAllUsers();
    const summary = summarizeImportResults(result.results);
    const status =
      summary.failureCount === 0
        ? "success"
        : summary.successCount > 0
          ? "partial"
          : "failed";

    await ImportRunModel.updateOne(
      { _id: importRun._id },
      {
        $set: {
          ...summary,
          finishedAt: new Date(),
          status,
          userCount: result.userCount,
        },
      },
    );

    return {
      ...result,
      importRunId: importRun._id.toString(),
      status,
    };
  } catch (error) {
    await ImportRunModel.updateOne(
      { _id: importRun._id },
      {
        $set: {
          failureCount: 1,
          failures: [
            {
              error: error instanceof Error ? error.message : "Unknown import error",
            },
          ],
          finishedAt: new Date(),
          status: "failed",
        },
      },
    );

    throw error;
  }
}
