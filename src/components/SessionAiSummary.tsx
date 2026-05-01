"use client";

import { useState, useTransition } from "react";

type AiSummary = {
  generatedAt: string | null;
  model: string | null;
  text: string | null;
};

type SessionAiSummaryProps = {
  initialSummary: AiSummary;
  playCount: number;
  sessionId: string;
};

export function SessionAiSummary({
  initialSummary,
  playCount,
  sessionId,
}: SessionAiSummaryProps) {
  const [summary, setSummary] = useState(initialSummary);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const hasSummary = Boolean(summary.text);

  function generateSummary() {
    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/sessions/${sessionId}/ai-summary`, {
        method: "POST",
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
        summary?: AiSummary;
      } | null;

      if (!response.ok || !body?.summary) {
        setError(body?.error ?? "Could not generate an AI summary.");
        return;
      }

      setSummary(body.summary);
    });
  }

  return (
    <section className="border-b border-zinc-200 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950">
            AI session summary
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            {summary.generatedAt
              ? `Generated ${new Date(summary.generatedAt).toLocaleString()}`
              : "Generate a short review from imported plays."}
          </p>
        </div>
        <button
          className="inline-flex rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
          disabled={isPending || playCount === 0}
          onClick={generateSummary}
          type="button"
        >
          {isPending ? "Generating..." : hasSummary ? "Refresh summary" : "Generate summary"}
        </button>
      </div>

      <div className="mt-4 rounded-md border border-zinc-200 p-5">
        {summary.text ? (
          <div className="whitespace-pre-wrap text-sm leading-6 text-zinc-800">
            {summary.text}
          </div>
        ) : (
          <p className="text-sm leading-6 text-zinc-700">
            {playCount > 0
              ? "No summary has been generated for this session yet."
              : "Import plays before generating a session summary."}
          </p>
        )}
      </div>

      {summary.model ? (
        <p className="mt-2 text-xs text-zinc-500">Model: {summary.model}</p>
      ) : null}
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
    </section>
  );
}
