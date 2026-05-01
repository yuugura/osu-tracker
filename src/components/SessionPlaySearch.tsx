"use client";

import { useMemo, useState } from "react";
import { formatRankLabel } from "@/lib/sessionStats";

export type SearchablePlay = {
  accuracy: number | null;
  artist: string | null;
  beatmapId: string | null;
  difficulty: string | null;
  id: string;
  mapper: string | null;
  mods: string[];
  osuScoreUrl: string | null;
  passed: boolean | null;
  playedAtLabel: string | null;
  pp: number | null;
  rank: string | null;
  score: number | null;
  tags?: string[] | null;
  title: string;
};

export function SessionPlaySearch({ plays }: { plays: SearchablePlay[] }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredPlays = useMemo(() => {
    if (!normalizedQuery) {
      return plays;
    }

    return plays.filter((play) => getSearchText(play).includes(normalizedQuery));
  }, [normalizedQuery, plays]);

  return (
    <section className="py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950">Plays</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Showing {filteredPlays.length} of {plays.length}
          </p>
        </div>
        <label className="text-sm font-medium text-zinc-800">
          Search
          <input
            className="mt-2 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 sm:w-80"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Song, mapper, tag, mod, rank..."
            type="search"
            value={query}
          />
        </label>
      </div>

      {filteredPlays.length > 0 ? (
        <div className="mt-4 divide-y divide-zinc-200 rounded-md border border-zinc-200">
          {filteredPlays.map((play) => (
            <div className="px-4 py-4" key={play.id}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-zinc-950">
                      {play.osuScoreUrl ? (
                        <a
                          className="hover:text-pink-700"
                          href={play.osuScoreUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {play.artist ? `${play.artist} - ` : ""}
                          {play.title}
                        </a>
                      ) : (
                        <>
                          {play.artist ? `${play.artist} - ` : ""}
                          {play.title}
                        </>
                      )}
                    </h3>
                    {play.rank === "F" || play.passed === false ? (
                      <span className="rounded-sm bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                        Failed
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-zinc-600">
                    {play.difficulty ?? "Unknown difficulty"}
                    {(play.mods ?? []).length > 0
                      ? ` +${(play.mods ?? []).join("")}`
                      : ""}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {[
                      play.mapper ? `mapped by ${play.mapper}` : null,
                      play.playedAtLabel ? `played ${play.playedAtLabel}` : null,
                      play.beatmapId ? `beatmap ${play.beatmapId}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {(play.tags ?? []).length > 0 ? (
                    <p className="mt-2 line-clamp-2 text-xs text-zinc-500">
                      {(play.tags ?? []).join(" ")}
                    </p>
                  ) : null}
                </div>

                <div className="grid grid-cols-4 gap-3 text-left lg:text-right">
                  <Stat
                    label="Rank"
                    value={play.rank ? formatRankLabel(play.rank) : "-"}
                  />
                  <Stat
                    label="Acc"
                    value={
                      typeof play.accuracy === "number"
                        ? `${(play.accuracy * 100).toFixed(2)}%`
                        : "-"
                    }
                  />
                  <Stat
                    label="Score"
                    value={
                      typeof play.score === "number"
                        ? play.score.toLocaleString()
                        : "-"
                    }
                  />
                  <Stat
                    label="PP"
                    value={typeof play.pp === "number" ? play.pp.toFixed(2) : "-"}
                  />
                </div>

                <div className="lg:text-right">
                  {play.osuScoreUrl ? (
                    <a
                      className="inline-flex rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
                      href={play.osuScoreUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      View score
                    </a>
                  ) : (
                    <span className="inline-flex rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-400">
                      No score page
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-md border border-dashed border-zinc-300 p-6">
          <p className="text-sm leading-6 text-zinc-700">
            No plays match that search.
          </p>
        </div>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-zinc-950">{value}</p>
    </div>
  );
}

function getSearchText(play: SearchablePlay) {
  return [
    play.accuracy === null ? null : `${(play.accuracy * 100).toFixed(2)}%`,
    play.artist,
    play.beatmapId,
    play.difficulty,
    play.mapper,
    (play.mods ?? []).join(" "),
    play.rank,
    play.rank ? formatRankLabel(play.rank) : null,
    play.score?.toString(),
    (play.tags ?? []).join(" "),
    play.title,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
