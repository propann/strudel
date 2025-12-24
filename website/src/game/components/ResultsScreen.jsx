export default function ResultsScreen({ level, result, onRetry, onNext, onBack }) {
  if (!result) return null;
  const accuracyPct = Math.round((result.accuracy ?? 0) * 100);
  const grade = result.grade ?? 'C';
  const stars = result.stars ?? 0;
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-foreground/60">Results</div>
        <h2 className="text-2xl font-semibold">{level?.title}</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-foreground/15 bg-black/30 p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-foreground/60">Score</div>
          <div className="text-2xl font-semibold">{result.score}</div>
        </div>
        <div className="rounded-2xl border border-foreground/15 bg-black/30 p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-foreground/60">Accuracy</div>
          <div className="text-2xl font-semibold">{accuracyPct}%</div>
        </div>
        <div className="rounded-2xl border border-foreground/15 bg-black/30 p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-foreground/60">Combo Max</div>
          <div className="text-2xl font-semibold">{result.comboMax}</div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="rounded-2xl border border-foreground/15 bg-black/30 px-4 py-2 text-lg font-semibold">
          Grade {grade}
        </div>
        <div className="text-xl text-yellow-300">{'★'.repeat(stars)}</div>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full border border-foreground/20 bg-foreground/10 px-4 py-2 text-xs uppercase tracking-[0.2em] hover:opacity-80"
        >
          Retry
        </button>
        <button
          type="button"
          onClick={onNext}
          className="rounded-full border border-foreground/20 bg-foreground/10 px-4 py-2 text-xs uppercase tracking-[0.2em] hover:opacity-80"
        >
          Next
        </button>
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-foreground/20 px-4 py-2 text-xs uppercase tracking-[0.2em] hover:opacity-80"
        >
          Back
        </button>
      </div>
    </div>
  );
}
