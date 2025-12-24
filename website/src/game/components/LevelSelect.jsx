export default function LevelSelect({ levels, progressMap, selectedId, onSelect, onPlay, onProfile }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-foreground/60">Select Level</div>
          <h2 className="text-2xl font-semibold">Choose your groove</h2>
        </div>
        <button
          type="button"
          onClick={onProfile}
          className="rounded-full border border-foreground/20 px-3 py-1 text-xs uppercase tracking-wide hover:opacity-80"
        >
          Profile
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {levels.map((level) => {
          const progress = progressMap?.[level.id];
          const isActive = level.id === selectedId;
          return (
            <button
              key={level.id}
              type="button"
              onClick={() => onSelect(level.id)}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                isActive
                  ? 'border-cyan-300/60 bg-foreground/10'
                  : 'border-foreground/10 bg-black/20 hover:border-foreground/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-foreground/60">{level.theme}</div>
                  <div className="text-lg font-semibold">{level.title}</div>
                </div>
                <div className="text-right text-xs uppercase tracking-[0.2em] text-foreground/60">
                  {level.bpm} BPM
                  {progress?.stars > 0 && <div>{'★'.repeat(progress.stars)}</div>}
                </div>
              </div>
              <div className="mt-2 text-xs text-foreground/70">{level.targetCode}</div>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={onPlay}
          className="rounded-full border border-foreground/20 bg-foreground/10 px-4 py-2 text-xs uppercase tracking-[0.2em] hover:opacity-80"
        >
          Play
        </button>
      </div>
    </div>
  );
}
