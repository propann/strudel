export default function DeckVolume({ deck, value, onChange, compact = false }) {
  return (
    <div className={`madamix-section madamix-volume ${compact ? 'madamix-volume-compact' : ''}`}>
      {!compact && <div className="madamix-label">Volume {deck}</div>}
      <label className={`madamix-control madamix-control-vertical ${compact ? 'madamix-control-compact' : ''}`}>
        <span className="madamix-mini">{deck}</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="madamix-slider madamix-slider-vertical"
          aria-label={`Deck ${deck} volume`}
        />
      </label>
    </div>
  );
}
