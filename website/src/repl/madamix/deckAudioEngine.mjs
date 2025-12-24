import { initAudioOnFirstClick, webaudioRepl } from '@strudel/webaudio';
import { transpiler } from '@strudel/transpiler';
import { prebake } from '../prebake.mjs';
import { loadModules } from '../util.mjs';
import { buildDeckCode } from './madamixEngine.mjs';

const isBrowser = typeof window !== 'undefined';

let audioReady;
let modulesLoading;
let prebaked;

if (isBrowser) {
  audioReady = initAudioOnFirstClick();
  modulesLoading = loadModules();
  prebaked = prebake();
}

export function createDeckAudioEngine() {
  if (!isBrowser) return null;
  const deckA = webaudioRepl({
    transpiler,
    beforeEval: () => audioReady,
    beforeStart: () => audioReady,
  });
  const deckB = webaudioRepl({
    transpiler,
    beforeEval: () => audioReady,
    beforeStart: () => audioReady,
  });
  let playing = false;
  const ready = Promise.all([modulesLoading, prebaked]);

  const setBpm = (bpm) => {
    if (!Number.isFinite(bpm)) return;
    const cps = bpm / 240;
    deckA.setCps(cps);
    deckB.setCps(cps);
  };

  const evaluate = async (codeA, codeB) => {
    await ready;
    const deckACode = buildDeckCode(codeA, 'A');
    const deckBCode = buildDeckCode(codeB, 'B');
    if (deckACode) {
      await deckA.evaluate(deckACode, true);
    } else {
      deckA.stop();
    }
    if (deckBCode) {
      await deckB.evaluate(deckBCode, true);
    } else {
      deckB.stop();
    }
    playing = Boolean(deckACode || deckBCode);
  };

  const stop = () => {
    deckA.stop();
    deckB.stop();
    playing = false;
  };

  const isPlaying = () => playing;

  return {
    evaluate,
    stop,
    setBpm,
    isPlaying,
  };
}
