import Link from "next/link";
import type { ReactNode } from "react";

type AppSection = "dashboard" | "community" | "session";

type AppShellProps = {
  activeSection: AppSection;
  backHref?: string;
  backLabel?: string;
  children: ReactNode;
  description?: string;
  eyebrow: string;
  headerMeta?: ReactNode;
  title: string;
};

const navItems: { href: string; label: string; section: AppSection }[] = [
  { href: "/dashboard", label: "Dashboard", section: "dashboard" },
  { href: "/community", label: "Community", section: "community" },
];

export function AppShell({
  activeSection,
  backHref,
  backLabel,
  children,
  description,
  eyebrow,
  headerMeta,
  title,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            className="text-sm font-bold tracking-tight text-zinc-50"
            href="/dashboard"
          >
            osu! Session Tracker
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <nav className="flex rounded-md border border-zinc-800 bg-zinc-900 p-1">
              {navItems.map((item) => (
                <Link
                  className={[
                    "rounded px-3 py-1.5 text-sm font-medium transition",
                    activeSection === item.section
                      ? "bg-zinc-800 text-pink-300 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-50",
                  ].join(" ")}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <form action="/api/auth/logout" method="post">
              <button className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800">
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col px-6 py-10">
        {backHref && backLabel ? (
          <Link
            className="mb-6 w-fit text-sm font-medium text-pink-300 hover:text-pink-200"
            href={backHref}
          >
            {backLabel}
          </Link>
        ) : null}

        <section className="border-b border-zinc-800 pb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-pink-300">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-50">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
              {description}
            </p>
          ) : null}
          {headerMeta ? <div className="mt-4">{headerMeta}</div> : null}
        </section>

        {children}
      </main>
    </div>
  );
}
