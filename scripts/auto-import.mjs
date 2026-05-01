const appUrl = process.env.INTERNAL_APP_URL || "http://app:3000";
const cronSecret = process.env.CRON_SECRET;
const intervalMinutes = Number(process.env.AUTO_IMPORT_INTERVAL_MINUTES || 15);

if (!cronSecret) {
  throw new Error("CRON_SECRET must be set for automatic imports.");
}

async function runImport() {
  const response = await fetch(`${appUrl}/api/admin/import-recent`, {
    headers: {
      Authorization: `Bearer ${cronSecret}`,
    },
    method: "POST",
  });
  const body = await response.text();

  if (!response.ok) {
    throw new Error(`Import failed with ${response.status}: ${body}`);
  }

  console.log(`[auto-import] ${new Date().toISOString()} ${body}`);
}

async function loop() {
  while (true) {
    let failed = false;

    try {
      await runImport();
    } catch (error) {
      failed = true;
      console.error("[auto-import]", error);
    }

    const waitMinutes = failed ? 1 : intervalMinutes;

    await new Promise((resolve) =>
      setTimeout(resolve, waitMinutes * 60 * 1000),
    );
  }
}

void loop();
