import { initAudioOnFirstClick, webaudioRepl } from '@strudel/webaudio';
import { transpiler } from '@strudel/transpiler';
import { prebake } from '../prebake.mjs';
import { loadModules } from '../util.mjs';

const isBrowser = typeof window !== 'undefined';

let audioReady;
let modulesLoading;
let prebaked;

if (isBrowser) {
  audioReady = initAudioOnFirstClick();
  modulesLoading = loadModules();
  prebaked = prebake();
}

export function createDeckRunner() {
  if (!isBrowser) return null;
  const repl = webaudioRepl({
    transpiler,
    beforeEval: () => audioReady,
    beforeStart: () => audioReady,
  });
  const ready = Promise.all([modulesLoading, prebaked]);
  let playing = false;

  const setPlaying = (next) => {
    playing = Boolean(next);
  };

  return {
    repl,
    ready,
    isPlaying: () => playing,
    setPlaying,
  };
}
