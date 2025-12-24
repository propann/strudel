import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_WINDOWS = {
  perfectMs: 80,
  goodMs: 160,
  missMs: 220,
};

export function useGameEngine(level, { onHit, onMiss, onComplete } = {}) {
  const [status, setStatus] = useState('idle');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [lastHit, setLastHit] = useState(null);
  const [tokenStates, setTokenStates] = useState([]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startTimeRef = useRef(0);
  const rafRef = useRef(0);

  const beatMs = useMemo(() => {
    const bpm = level?.bpm || 120;
    return (60_000 / bpm);
  }, [level?.bpm]);

  useEffect(() => {
    if (!level) return;
    const tokens = (level.tokens || []).map((token, index) => ({
      id: `${level.id}-${index}`,
      beat: token.beat,
      sound: token.sound,
      timeMs: token.beat * beatMs,
      status: 'pending',
    }));
    setTokenStates(tokens);
    setStatus('idle');
    setScore(0);
    setCombo(0);
    setLastHit(null);
  }, [level, beatMs]);

  const updateLoop = useCallback(() => {
    const now = performance.now();
    const elapsed = now - startTimeRef.current;
    setElapsedMs(elapsed);
    setTokenStates((prev) =>
      prev.map((token) => {
        if (token.status !== 'pending') return token;
        const delta = elapsed - token.timeMs;
        if (delta > DEFAULT_WINDOWS.missMs) {
          onMiss?.(token);
          setLastHit({ result: 'miss', sound: token.sound });
          setCombo(0);
          return { ...token, status: 'miss' };
        }
        return token;
      }),
    );
    rafRef.current = requestAnimationFrame(updateLoop);
  }, [onMiss]);

  useEffect(() => {
    if (status !== 'playing') return;
    rafRef.current = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [status, updateLoop]);

  useEffect(() => {
    if (status !== 'playing') return;
    const allResolved = tokenStates.every((token) => token.status !== 'pending');
    if (!allResolved) return;
    const hasMiss = tokenStates.some((token) => token.status === 'miss');
    const nextStatus = hasMiss ? 'fail' : 'success';
    setStatus(nextStatus);
    if (!hasMiss) {
      onComplete?.();
    }
  }, [status, tokenStates, onComplete]);

  const start = useCallback(() => {
    if (!level) return;
    startTimeRef.current = performance.now();
    setStatus('playing');
    setLastHit(null);
    setScore(0);
    setCombo(0);
    setElapsedMs(0);
    setTokenStates((prev) => prev.map((token) => ({ ...token, status: 'pending' })));
  }, [level]);

  const stop = useCallback(() => {
    setStatus('idle');
    cancelAnimationFrame(rafRef.current);
  }, []);

  const handleHit = useCallback(() => {
    if (status !== 'playing') return;
    const now = performance.now();
    const elapsed = now - startTimeRef.current;
    let hitToken = null;
    let hitWindow = null;

    setTokenStates((prev) => {
      const next = prev.map((token) => {
        if (token.status !== 'pending' || hitToken) return token;
        const delta = Math.abs(elapsed - token.timeMs);
        if (delta <= DEFAULT_WINDOWS.perfectMs) {
          hitToken = token;
          hitWindow = 'perfect';
          return { ...token, status: 'perfect' };
        }
        if (delta <= DEFAULT_WINDOWS.goodMs) {
          hitToken = token;
          hitWindow = 'good';
          return { ...token, status: 'good' };
        }
        return token;
      });
      return next;
    });

    if (hitToken && hitWindow) {
      const deltaScore = hitWindow === 'perfect' ? 100 : 60;
      setScore((prev) => prev + deltaScore);
      setCombo((prev) => prev + 1);
      setLastHit({ result: hitWindow, sound: hitToken.sound });
      onHit?.(hitToken, hitWindow);
    } else {
      setCombo(0);
      setLastHit({ result: 'miss' });
    }
  }, [onHit, status]);

  return {
    status,
    score,
    combo,
    lastHit,
    tokenStates,
    beatMs,
    elapsedMs,
    start,
    stop,
    handleHit,
  };
}
