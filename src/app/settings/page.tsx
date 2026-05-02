import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getCurrentSession } from "@/lib/auth";
import { connectMongoDB } from "@/lib/mongodb";
import { UserModel } from "@/models/User";

type SettingsPageProps = {
  searchParams: Promise<{
    saved?: string;
  }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/");
  }

  await connectMongoDB();

  const [{ saved }, user] = await Promise.all([
    searchParams,
    UserModel.findById(session.userId).select("aiSummariesEnabled").lean(),
  ]);
  const aiSummariesEnabled = user?.aiSummariesEnabled !== false;

  return (
    <AppShell
      activeSection="settings"
      description="Choose how imports should behave for your account."
      eyebrow="Settings"
      title="App settings"
    >
      <section className="py-10">
        {saved ? (
          <div className="mb-4 rounded-md border border-emerald-900/70 bg-emerald-950/40 px-4 py-3">
            <p className="text-sm font-medium text-emerald-200">
              Settings saved.
            </p>
          </div>
        ) : null}

        <form
          action="/api/settings"
          className="max-w-2xl rounded-md border border-zinc-800 bg-zinc-900 p-5"
          method="post"
        >
          <div className="flex items-start gap-3">
            <input
              className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-950 accent-pink-500"
              defaultChecked={aiSummariesEnabled}
              id="aiSummariesEnabled"
              name="aiSummariesEnabled"
              type="checkbox"
            />
            <div>
              <label
                className="text-sm font-semibold text-zinc-50"
                htmlFor="aiSummariesEnabled"
              >
                Generate AI session summaries after imports
              </label>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                When enabled, new manual, dashboard, and scheduled imports will
                try to generate a Gemini summary for the current session. Imports
                still succeed if summary generation is unavailable.
              </p>
            </div>
          </div>

          <button className="mt-5 rounded-md bg-pink-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-pink-400">
            Save settings
          </button>
        </form>
      </section>
    </AppShell>
  );
}
