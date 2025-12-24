export default function Crossfader({ value, onChange }) {
  return (
    <div className="madamix-section">
      <div className="madamix-label">Crossfader</div>
      <div className="flex items-center gap-3">
        <span className="madamix-mini">A</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="madamix-slider"
          aria-label="Crossfader"
        />
        <span className="madamix-mini">B</span>
      </div>
    </div>
  );
}
