"use client";

import Link from "next/link";
import { useState } from "react";
import { formatRankLabel } from "@/lib/sessionStats";

export type DashboardHighlightPlay = {
  accuracy: number | null;
  artist: string | null;
  beatmapId: string | null;
  difficulty: string | null;
  id: string;
  mods: string[];
  osuScoreUrl: string | null;
  playedAtLabel: string | null;
  pp: number | null;
  rank: string | null;
  sessionId: string;
  sessionName: string;
  title: string;
};

export type DashboardHighlightTimeframeKey = "24h" | "7d" | "all";

export type DashboardHighlightTimeframe = {
  bestAccuracy: DashboardHighlightPlay[];
  failedCount: number;
  failedPlays: DashboardHighlightPlay[];
  label: string;
  passedCount: number;
  playCount: number;
  topPp: DashboardHighlightPlay[];
};

const TIMEFRAMES: Array<{
  key: DashboardHighlightTimeframeKey;
  label: string;
}> = [
  { key: "24h", label: "24h" },
  { key: "7d", label: "7d" },
  { key: "all", label: "All" },
];

type DashboardHighlightsProps = {
  highlights: Record<DashboardHighlightTimeframeKey, DashboardHighlightTimeframe>;
};

export function DashboardHighlights({
  highlights,
}: DashboardHighlightsProps) {
  const [timeframeKey, setTimeframeKey] =
    useState<DashboardHighlightTimeframeKey>("24h");
  const activeHighlights = highlights[timeframeKey];

  return (
    <section className="border-b border-zinc-800 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-50">
            Recent highlights
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Personal leaderboards from imported plays.
          </p>
        </div>
        <div className="inline-flex w-fit rounded-md border border-zinc-800 bg-zinc-900 p-1">
          {TIMEFRAMES.map((timeframe) => (
            <button
              className={`rounded px-3 py-1.5 text-sm font-medium ${
                timeframe.key === timeframeKey
                  ? "bg-pink-500 text-white"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50"
              }`}
              key={timeframe.key}
              onClick={() => setTimeframeKey(timeframe.key)}
              type="button"
            >
              {timeframe.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <HighlightStat
          label={`${activeHighlights.label} plays`}
          value={String(activeHighlights.playCount)}
        />
        <HighlightStat label="Passed" value={String(activeHighlights.passedCount)} />
        <HighlightStat label="Failed" value={String(activeHighlights.failedCount)} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <HighlightList
          empty={`No PP plays imported for ${activeHighlights.label.toLowerCase()}.`}
          plays={activeHighlights.topPp}
          title={`Highest PP - ${activeHighlights.label}`}
        />
        <HighlightList
          empty={`No accuracy data imported for ${activeHighlights.label.toLowerCase()}.`}
          plays={activeHighlights.bestAccuracy}
          title={`Best accuracy - ${activeHighlights.label}`}
        />
        <HighlightList
          empty={`No retry maps found for ${activeHighlights.label.toLowerCase()}.`}
          plays={activeHighlights.failedPlays}
          title={`Maps to retry - ${activeHighlights.label}`}
        />
      </div>
    </section>
  );
}

function HighlightStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-zinc-50">{value}</p>
    </div>
  );
}

function HighlightList({
  empty,
  plays,
  title,
}: {
  empty: string;
  plays: DashboardHighlightPlay[];
  title: string;
}) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900">
      <div className="border-b border-zinc-800 px-4 py-3">
        <h3 className="text-sm font-semibold text-zinc-50">{title}</h3>
      </div>

      {plays.length > 0 ? (
        <div className="divide-y divide-zinc-800">
          {plays.map((play, index) => (
            <div className="px-4 py-3" key={`${play.id}-${index}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-50">
                    {play.osuScoreUrl ? (
                      <a
                        className="hover:text-pink-300"
                        href={play.osuScoreUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {formatPlayName(play)}
                      </a>
                    ) : (
                      formatPlayName(play)
                    )}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {[
                      play.difficulty,
                      play.mods.length > 0 ? `+${play.mods.join("")}` : null,
                      play.rank ? formatRankLabel(play.rank) : null,
                      play.playedAtLabel,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <Link
                    className="mt-1 inline-flex text-xs font-medium text-pink-300"
                    href={`/sessions/${play.sessionId}`}
                  >
                    {play.sessionName}
                  </Link>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-zinc-50">
                    {formatPrimaryStat(play)}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {typeof play.accuracy === "number"
                      ? `${(play.accuracy * 100).toFixed(2)}%`
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 py-5">
          <p className="text-sm leading-6 text-zinc-400">{empty}</p>
        </div>
      )}
    </div>
  );
}

function formatPlayName(play: DashboardHighlightPlay) {
  return `${play.artist ? `${play.artist} - ` : ""}${play.title}`;
}

function formatPrimaryStat(play: DashboardHighlightPlay) {
  if (typeof play.pp === "number") {
    return `${play.pp.toFixed(2)}pp`;
  }

  if (typeof play.accuracy === "number") {
    return `${(play.accuracy * 100).toFixed(2)}%`;
  }

  return play.rank ? formatRankLabel(play.rank) : "-";
}
