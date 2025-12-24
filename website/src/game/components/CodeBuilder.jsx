export default function CodeBuilder({ code, finalComment }) {
  return (
    <div className="space-y-2 rounded-2xl border border-foreground/15 bg-black/20 p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-foreground/60">Code Builder</div>
      <pre className="whitespace-pre-wrap break-words font-mono text-xs text-foreground/80">
        {code || 'Hit tokens to build code.'}
      </pre>
      {finalComment && (
        <div className="rounded-lg border border-foreground/15 bg-foreground/5 px-3 py-2 text-xs text-cyan-200">
          {finalComment}
        </div>
      )}
    </div>
  );
}
