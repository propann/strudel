import { useCallback, useEffect, useRef, useState } from 'react';
import { initAudioOnFirstClick, webaudioRepl } from '@strudel/webaudio';
import { transpiler } from '@strudel/transpiler';
import { prebake } from '../repl/prebake.mjs';
import { loadModules } from '../repl/util.mjs';

const isBrowser = typeof window !== 'undefined';

let audioReady;
let modulesLoading;
let prebaked;

if (isBrowser) {
  audioReady = initAudioOnFirstClick();
  modulesLoading = loadModules();
  prebaked = prebake();
}

export function useGameAudio() {
  const replRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const readyRef = useRef(Promise.resolve());

  useEffect(() => {
    if (!isBrowser) return;
    const repl = webaudioRepl({
      transpiler,
      beforeEval: () => audioReady,
      beforeStart: () => audioReady,
    });
    replRef.current = repl;
    const readyPromise = Promise.all([modulesLoading, prebaked])
      .then(() => {
        setReady(true);
      })
      .catch((err) => setError(err));
    readyRef.current = readyPromise;
  }, []);

  const setBpm = useCallback((bpm) => {
    if (!replRef.current || !Number.isFinite(bpm)) return;
    replRef.current.setCps(bpm / 240);
  }, []);

  const evaluate = useCallback(async (code) => {
    if (!replRef.current || !code) return;
    try {
      await readyRef.current;
      await replRef.current.evaluate(code, true);
    } catch (err) {
      setError(err);
    }
  }, []);

  const stop = useCallback(() => {
    replRef.current?.stop();
  }, []);

  const getNow = useCallback(() => {
    return replRef.current?.scheduler?.now?.() ?? 0;
  }, []);

  return {
    ready,
    error,
    setBpm,
    evaluate,
    stop,
    getNow,
  };
}
