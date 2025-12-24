export default function LorePanel({ lines }) {
  return (
    <div className="space-y-2 rounded-2xl border border-foreground/15 bg-black/30 p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-foreground/60">Lore</div>
      <div className="space-y-1 font-mono text-xs text-green-300">
        {lines.length === 0 && <div className="text-green-500/50">Waiting for tokens...</div>}
        {lines.map((line, index) => (
          <div key={`${line}-${index}`} className="animate-[fadein_0.3s_ease-out]">
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
