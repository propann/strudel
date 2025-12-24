import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
  $project,
  setActiveDeck,
  setFx,
  setMixer,
} from '../../../game/projectStore.mjs';
import Crossfader from './Crossfader.jsx';
import DeckVolume from './DeckVolume.jsx';
import FxRack from './FxRack.jsx';
import VuMeter from './VuMeter.jsx';

const FX_KEYS = {
  a: { q: 'echo', w: 'filter', e: 'disto', r: 'reverb' },
  b: { u: 'echo', i: 'filter', o: 'disto', p: 'reverb' },
};

const isEditableTarget = (target) => {
  if (!target) return false;
  if (target.isContentEditable) return true;
  return Boolean(target.closest?.('input,textarea,select'));
};

export default function MadaMixBar() {
  const project = useStore($project);
  const activeDeck = project?.activeDeck ?? 'A';
  const mixer = project?.mixer ?? { crossfader: 0.5, volA: 1, volB: 1 };
  const fx = project?.fx ?? { A: {}, B: {} };

  const handleFxPress = (deck, key) => {
    const state = fx?.[deck]?.[key] ?? {};
    if (state.mode === 'toggle') {
      setFx(deck, key, { active: !state.active });
      return;
    }
    setFx(deck, key, { active: true });
  };

  const handleFxRelease = (deck, key) => {
    const state = fx?.[deck]?.[key] ?? {};
    if (state.mode === 'toggle') return;
    setFx(deck, key, { active: false });
  };

  const handleToggleMode = (deck, key) => {
    const state = fx?.[deck]?.[key] ?? {};
    const nextMode = state.mode === 'toggle' ? 'momentary' : 'toggle';
    setFx(deck, key, { mode: nextMode, active: nextMode === 'momentary' ? false : state.active });
  };

  const handleFxAmount = (deck, key, amount) => {
    setFx(deck, key, { amount });
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.repeat) return;
      if (isEditableTarget(event.target)) return;
      const key = event.key.toLowerCase();
      if (event.altKey && key === '1') {
        event.preventDefault();
        setActiveDeck('A');
        return;
      }
      if (event.altKey && key === '2') {
        event.preventDefault();
        setActiveDeck('B');
        return;
      }
      if (key === 'x') {
        event.preventDefault();
        setMixer({ crossfader: 0.5 });
        return;
      }
      if (FX_KEYS.a[key]) {
        event.preventDefault();
        handleFxPress('A', FX_KEYS.a[key]);
        return;
      }
      if (FX_KEYS.b[key]) {
        event.preventDefault();
        handleFxPress('B', FX_KEYS.b[key]);
      }
    };

    const handleKeyUp = (event) => {
      if (isEditableTarget(event.target)) return;
      const key = event.key.toLowerCase();
      if (FX_KEYS.a[key]) {
        event.preventDefault();
        handleFxRelease('A', FX_KEYS.a[key]);
        return;
      }
      if (FX_KEYS.b[key]) {
        event.preventDefault();
        handleFxRelease('B', FX_KEYS.b[key]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [fx]);

  return (
    <div className="madamix-bar">
      <div className={`madamix-deck madamix-deck-a ${activeDeck === 'A' ? 'madamix-deck-active' : ''}`}>
        <div className="madamix-deck-header">
          <button type="button" onClick={() => setActiveDeck('A')} className="madamix-deck-btn">
            Deck A
          </button>
          {activeDeck === 'A' && <span className="madamix-active-badge">Active</span>}
        </div>
        <DeckVolume deck="A" value={mixer.volA ?? 1} onChange={(value) => setMixer({ volA: value })} />
        <FxRack
          deck="A"
          fxState={fx.A}
          onPress={handleFxPress}
          onRelease={handleFxRelease}
          onToggleMode={handleToggleMode}
          onAmountChange={handleFxAmount}
        />
      </div>

      <div className="madamix-mixer">
        <div className="madamix-mixer-core">
          <Crossfader value={mixer.crossfader ?? 0.5} onChange={(value) => setMixer({ crossfader: value })} />
          <div className="madamix-divider" />
          <div className="madamix-meter">
            <VuMeter id={1} label="A" className="madamix-vu-a" />
            <VuMeter id={2} label="B" className="madamix-vu-b" />
          </div>
        </div>
      </div>

      <div className={`madamix-deck madamix-deck-b ${activeDeck === 'B' ? 'madamix-deck-active' : ''}`}>
        <div className="madamix-deck-header">
          <button type="button" onClick={() => setActiveDeck('B')} className="madamix-deck-btn">
            Deck B
          </button>
          {activeDeck === 'B' && <span className="madamix-active-badge">Active</span>}
        </div>
        <FxRack
          deck="B"
          fxState={fx.B}
          onPress={handleFxPress}
          onRelease={handleFxRelease}
          onToggleMode={handleToggleMode}
          onAmountChange={handleFxAmount}
        />
        <DeckVolume deck="B" value={mixer.volB ?? 1} onChange={(value) => setMixer({ volB: value })} />
      </div>
    </div>
  );
}
