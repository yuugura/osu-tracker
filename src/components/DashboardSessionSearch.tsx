"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatRankLabel } from "@/lib/sessionStats";

export type DashboardSearchPlay = {
  artist: string | null;
  beatmapId: string | null;
  difficulty: string | null;
  mapper: string | null;
  mods: string[];
  rank: string | null;
  tags: string[];
  title: string;
};

export type DashboardSearchSession = {
  createdAtLabel: string;
  id: string;
  name: string;
  playCount: number;
  plays: DashboardSearchPlay[];
};

export function DashboardSessionSearch({
  sessions,
}: {
  sessions: DashboardSearchSession[];
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredSessions = useMemo(() => {
    if (!normalizedQuery) {
      return sessions;
    }

    return sessions.filter((session) =>
      getSessionSearchText(session).includes(normalizedQuery),
    );
  }, [normalizedQuery, sessions]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950">
            Recent sessions
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Showing {filteredSessions.length} of {sessions.length}
          </p>
        </div>
        <label className="text-sm font-medium text-zinc-800">
          Search sessions
          <input
            className="mt-2 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 sm:w-80"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Song, mapper, tag, mod, rank..."
            type="search"
            value={query}
          />
        </label>
      </div>

      {filteredSessions.length > 0 ? (
        <div className="mt-4 divide-y divide-zinc-200 rounded-md border border-zinc-200">
          {filteredSessions.map((session) => {
            const matches = getMatchingPlays(session, normalizedQuery);

            return (
              <div className="px-4 py-4" key={session.id}>
                <div className="flex items-center justify-between gap-4">
                  <Link
                    className="min-w-0 flex-1 hover:text-pink-700"
                    href={`/sessions/${session.id}`}
                  >
                    <h3 className="font-medium text-zinc-950">{session.name}</h3>
                    <p className="mt-1 text-sm text-zinc-600">
                      Created {session.createdAtLabel} · {session.playCount} plays
                    </p>
                    {normalizedQuery && matches.length > 0 ? (
                      <p className="mt-2 text-xs text-zinc-500">
                        Matches:{" "}
                        {matches
                          .slice(0, 3)
                          .map((play) => formatPlayName(play))
                          .join("; ")}
                      </p>
                    ) : null}
                  </Link>
                  <div className="flex items-center gap-3">
                    <Link
                      className="text-sm font-medium text-pink-700"
                      href={`/sessions/${session.id}`}
                    >
                      Open
                    </Link>
                    <form action={`/api/sessions/${session.id}`} method="post">
                      <button className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50">
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-md border border-dashed border-zinc-300 p-6">
          <p className="text-sm leading-6 text-zinc-700">
            No sessions match that search.
          </p>
        </div>
      )}
    </div>
  );
}

function getMatchingPlays(
  session: DashboardSearchSession,
  normalizedQuery: string,
) {
  if (!normalizedQuery) {
    return [];
  }

  return session.plays.filter((play) =>
    getPlaySearchText(play).includes(normalizedQuery),
  );
}

function getSessionSearchText(session: DashboardSearchSession) {
  return [
    session.name,
    session.createdAtLabel,
    ...session.plays.map(getPlaySearchText),
  ]
    .join(" ")
    .toLowerCase();
}

function getPlaySearchText(play: DashboardSearchPlay) {
  return [
    play.artist,
    play.beatmapId,
    play.difficulty,
    play.mapper,
    play.mods.join(" "),
    play.rank,
    play.rank ? formatRankLabel(play.rank) : null,
    play.tags.join(" "),
    play.title,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function formatPlayName(play: DashboardSearchPlay) {
  return `${play.artist ? `${play.artist} - ` : ""}${play.title}`;
}
