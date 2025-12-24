import { useState } from 'react';

export default function GlobalCodePanel({ baseCode, playerCode, combinedCode, onApply }) {
  const [showCombined, setShowCombined] = useState(false);

  return (
    <div className="space-y-3 rounded-2xl border border-foreground/15 bg-black/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs uppercase tracking-[0.2em] text-foreground/60">Global code</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCombined((prev) => !prev)}
            className="rounded-full border border-foreground/20 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-foreground/70 hover:text-foreground"
          >
            {showCombined ? 'Show split' : 'Show combined'}
          </button>
          <button
            type="button"
            onClick={onApply}
            className="rounded-full bg-foreground px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-black hover:opacity-90"
          >
            Apply to REPL
          </button>
        </div>
      </div>

      {showCombined ? (
        <div className="rounded-lg border border-foreground/10 bg-black/30 p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-foreground/50">Combined</div>
          <pre className="mt-2 whitespace-pre-wrap text-xs text-foreground/80">{combinedCode || '// empty'}</pre>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-foreground/10 bg-black/30 p-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-foreground/50">Base</div>
            <pre className="mt-2 whitespace-pre-wrap text-xs text-foreground/80">{baseCode || '// none'}</pre>
          </div>
          <div className="rounded-lg border border-foreground/10 bg-black/30 p-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-foreground/50">Player</div>
            <pre className="mt-2 whitespace-pre-wrap text-xs text-foreground/80">{playerCode || '// empty'}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
