export default function DeckVolume({ deck, value, onChange }) {
  return (
    <div className="madamix-section">
      <div className="madamix-label">Volume {deck}</div>
      <label className="madamix-control madamix-control-vertical">
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
