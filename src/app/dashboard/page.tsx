import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/");
  }

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

      <section className="py-10">
        <p className="text-zinc-700">
          Session creation and play imports are next. The OAuth callback now
          has a place to land after saving your osu! user record.
        </p>
      </section>
    </main>
  );
}
