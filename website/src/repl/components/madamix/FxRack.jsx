const FX_LIST = [
  { key: 'echo', label: 'Echo' },
  { key: 'filter', label: 'Filter' },
  { key: 'disto', label: 'Disto' },
  { key: 'reverb', label: 'Reverb' },
];

export default function FxRack({ deck, fxState, onPress, onRelease, onToggleMode, onAmountChange, compact = false }) {
  return (
    <div className={`madamix-section madamix-fx-rack ${compact ? 'madamix-fx-rack-compact' : ''}`}>
      {!compact && <div className="madamix-label">FX Deck {deck}</div>}
      <div className={`madamix-fx-grid ${compact ? 'madamix-fx-grid-compact' : ''}`}>
        {FX_LIST.map((fx) => {
          const state = fxState?.[fx.key] ?? {};
          const latched = Boolean(state.latched) || state.mode === 'toggle';
          const isActive = Boolean(state.active) || latched;
          return (
            <div key={fx.key} className="madamix-fx">
              <button
                type="button"
                className={[
                  'madamix-fx-button',
                  isActive ? 'madamix-fx-active' : 'madamix-fx-idle',
                ].join(' ')}
                onPointerDown={() => onPress(deck, fx.key)}
                onPointerUp={() => onRelease(deck, fx.key)}
                onPointerLeave={() => onRelease(deck, fx.key)}
                onDoubleClick={() => onToggleMode(deck, fx.key)}
                aria-pressed={isActive}
              >
                <span>{fx.label}</span>
                <span className={`madamix-mini ${latched ? 'madamix-latch' : ''}`}>{latched ? 'LOCK' : 'HOLD'}</span>
              </button>
              <div className="madamix-fx-controls">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={state.amount ?? 0.5}
                  onChange={(event) => onAmountChange(deck, fx.key, Number(event.target.value))}
                  className="madamix-slider madamix-slider-vertical madamix-slider-mini"
                  aria-label={`${fx.label} amount`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
