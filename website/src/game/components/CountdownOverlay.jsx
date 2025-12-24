export default function CountdownOverlay({ label }) {
  if (!label) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="text-6xl font-semibold uppercase tracking-[0.4em] text-foreground">{label}</div>
    </div>
  );
}
