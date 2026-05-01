type AiSummary = {
  generatedAt: string | null;
  model: string | null;
  text: string | null;
};

type SessionAiSummaryProps = {
  initialSummary: AiSummary;
  playCount: number;
};

export function SessionAiSummary({
  initialSummary,
  playCount,
}: SessionAiSummaryProps) {
  return (
    <section className="border-b border-zinc-200 py-8">
      <div>
        <h2 className="text-lg font-semibold text-zinc-950">
          AI session summary
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          {initialSummary.generatedAt
            ? `Generated after import on ${new Date(
                initialSummary.generatedAt,
              ).toLocaleString()}`
            : "Generated automatically after each successful import."}
        </p>
      </div>

      <div className="mt-4 rounded-md border border-zinc-200 p-5">
        {initialSummary.text ? (
          <div className="whitespace-pre-wrap text-sm leading-6 text-zinc-800">
            {initialSummary.text}
          </div>
        ) : (
          <p className="text-sm leading-6 text-zinc-700">
            {playCount > 0
              ? "No summary is available yet. Import recent plays to generate the latest session summary."
              : "Import plays before generating a session summary."}
          </p>
        )}
      </div>

      {initialSummary.model ? (
        <p className="mt-2 text-xs text-zinc-500">
          Model: {initialSummary.model}
        </p>
      ) : null}
    </section>
  );
}
