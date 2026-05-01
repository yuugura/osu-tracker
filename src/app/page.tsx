export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center bg-zinc-950 px-6 py-16 text-zinc-50">
      <div className="max-w-2xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-pink-300">
          osu! Session Tracker
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl">
          Track your plays as focused session logs.
        </h1>
        <p className="mt-5 text-lg leading-8 text-zinc-300">
          Log in with osu!, import recent plays, and build a personal history of
          sessions, scores, accuracy, ranks, and map choices over time.
        </p>
        <div className="mt-8">
          <a
            className="inline-flex rounded-md bg-pink-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-pink-400"
            href="/api/auth/osu/login"
          >
            Log in with osu!
          </a>
        </div>
      </div>
    </main>
  );
}
