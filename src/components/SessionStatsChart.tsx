"use client";

import { useMemo, useState } from "react";
import { formatDuration } from "@/lib/sessionStats";

export type SessionChartPoint = {
  averageAccuracy: number | null;
  date: string;
  failedCount: number;
  id: string;
  name: string;
  passedCount: number;
  playCount: number;
  playtimeSeconds: number;
  ppTotal: number;
  scoreTotal: number;
};

type Metric = {
  key: keyof Pick<
    SessionChartPoint,
    | "averageAccuracy"
    | "failedCount"
    | "passedCount"
    | "playCount"
    | "playtimeSeconds"
    | "ppTotal"
    | "scoreTotal"
  >;
  label: string;
  format: (value: number) => string;
};

const METRICS: Metric[] = [
  {
    key: "playCount",
    label: "Play count",
    format: (value) => String(Math.round(value)),
  },
  {
    key: "playtimeSeconds",
    label: "Playtime",
    format: formatDuration,
  },
  {
    key: "scoreTotal",
    label: "Score",
    format: (value) => Math.round(value).toLocaleString(),
  },
  {
    key: "ppTotal",
    label: "PP",
    format: (value) => value.toFixed(2),
  },
  {
    key: "averageAccuracy",
    label: "Accuracy",
    format: (value) => `${(value * 100).toFixed(2)}%`,
  },
  {
    key: "passedCount",
    label: "Passed",
    format: (value) => String(Math.round(value)),
  },
  {
    key: "failedCount",
    label: "Failed",
    format: (value) => String(Math.round(value)),
  },
];

const CHART_WIDTH = 720;
const CHART_HEIGHT = 260;
const PADDING = {
  bottom: 42,
  left: 56,
  right: 20,
  top: 22,
};

export function SessionStatsChart({ data }: { data: SessionChartPoint[] }) {
  const [metricKey, setMetricKey] = useState<Metric["key"]>("playCount");
  const metric = METRICS.find((item) => item.key === metricKey) ?? METRICS[0];
  const chart = useMemo(() => buildChart(data, metric), [data, metric]);

  return (
    <section className="border-b border-zinc-200 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950">Trends</h2>
          <p className="mt-1 text-sm text-zinc-600">
            {data.length} sessions tracked
          </p>
        </div>
        <label className="text-sm font-medium text-zinc-800">
          Stat
          <select
            className="mt-2 block rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
            onChange={(event) => setMetricKey(event.target.value as Metric["key"])}
            value={metricKey}
          >
            {METRICS.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {data.length > 0 ? (
        <div className="mt-5 overflow-x-auto rounded-md border border-zinc-200 p-4">
          <svg
            aria-label={`${metric.label} by session`}
            className="min-w-[640px]"
            role="img"
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          >
            <line
              stroke="#d4d4d8"
              x1={PADDING.left}
              x2={PADDING.left}
              y1={PADDING.top}
              y2={CHART_HEIGHT - PADDING.bottom}
            />
            <line
              stroke="#d4d4d8"
              x1={PADDING.left}
              x2={CHART_WIDTH - PADDING.right}
              y1={CHART_HEIGHT - PADDING.bottom}
              y2={CHART_HEIGHT - PADDING.bottom}
            />
            <text fill="#71717a" fontSize="12" x="0" y={PADDING.top + 4}>
              {metric.format(chart.max)}
            </text>
            <text
              fill="#71717a"
              fontSize="12"
              x="0"
              y={CHART_HEIGHT - PADDING.bottom + 4}
            >
              {metric.format(chart.min)}
            </text>
            {chart.path ? (
              <polyline
                fill="none"
                points={chart.path}
                stroke="#db2777"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
              />
            ) : null}
            {chart.points.map((point) => (
              <g key={point.id}>
                <circle cx={point.x} cy={point.y} fill="#db2777" r="4" />
                <title>
                  {point.name}: {metric.format(point.value)}
                </title>
              </g>
            ))}
            {chart.points.map((point, index) => {
              if (index !== 0 && index !== chart.points.length - 1) {
                return null;
              }

              return (
                <text
                  fill="#71717a"
                  fontSize="12"
                  key={`${point.id}-label`}
                  textAnchor={index === 0 ? "start" : "end"}
                  x={point.x}
                  y={CHART_HEIGHT - 12}
                >
                  {point.date}
                </text>
              );
            })}
          </svg>
        </div>
      ) : (
        <div className="mt-5 rounded-md border border-dashed border-zinc-300 p-6">
          <p className="text-sm text-zinc-700">
            Import recent plays to start building session trends.
          </p>
        </div>
      )}
    </section>
  );
}

function buildChart(data: SessionChartPoint[], metric: Metric) {
  const values = data.map((point) => Number(point[metric.key] ?? 0));
  const minValue = Math.min(...values, 0);
  const maxValue = Math.max(...values, 0);
  const range = maxValue - minValue || 1;
  const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const xStep = data.length > 1 ? innerWidth / (data.length - 1) : 0;

  const points = data.map((point, index) => {
    const value = Number(point[metric.key] ?? 0);
    const x =
      data.length > 1
        ? PADDING.left + xStep * index
        : PADDING.left + innerWidth / 2;
    const y =
      CHART_HEIGHT -
      PADDING.bottom -
      ((value - minValue) / range) * innerHeight;

    return {
      date: point.date,
      id: point.id,
      name: point.name,
      value,
      x,
      y,
    };
  });

  return {
    max: maxValue,
    min: minValue,
    path: points.length > 1 ? points.map((point) => `${point.x},${point.y}`).join(" ") : "",
    points,
  };
}
