import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { connectMongoDB } from "@/lib/mongodb";
import { SessionModel } from "@/models/Session";

export default async function DashboardPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/");
  }

  await connectMongoDB();

  const sessions = await SessionModel.find({ userId: session.userId }).sort({
    createdAt: -1,
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-12">
      <div className="flex items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-pink-600">
            Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-bold text-zinc-950">
            Your osu! sessions
          </h1>
        </div>
        <form action="/api/auth/logout" method="post">
          <button className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100">
            Log out
          </button>
        </form>
      </div>

      <section className="grid gap-8 py-10 lg:grid-cols-[320px_1fr]">
        <form
          action="/api/sessions/import-recent"
          className="h-fit rounded-md border border-zinc-200 p-5"
          method="post"
        >
          <h2 className="text-lg font-semibold text-zinc-950">
            Import recent plays
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-700">
            Uses your current 24-hour session, or creates one if needed.
          </p>
          <button className="mt-5 w-full rounded-md bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-pink-700">
            Import now
          </button>
        </form>

        <div>
          <h2 className="text-lg font-semibold text-zinc-950">
            Recent sessions
          </h2>
          {sessions.length > 0 ? (
            <div className="mt-4 divide-y divide-zinc-200 rounded-md border border-zinc-200">
              {sessions.map((osuSession) => (
                <Link
                  className="block px-4 py-4 hover:bg-zinc-50"
                  href={`/sessions/${osuSession._id.toString()}`}
                  key={osuSession._id.toString()}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-zinc-950">
                        {osuSession.name}
                      </h3>
                      <p className="mt-1 text-sm text-zinc-600">
                        Created {osuSession.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-pink-700">
                      Open
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-md border border-dashed border-zinc-300 p-6">
              <p className="text-sm leading-6 text-zinc-700">
                No sessions yet. Import recent plays to start tracking.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
