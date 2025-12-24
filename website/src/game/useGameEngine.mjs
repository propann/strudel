import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_WINDOWS = {
  perfect: 80,
  good: 160,
  miss: 220,
};

const DEFAULT_POINTS = {
  perfect: 100,
  good: 60,
  miss: 0,
};

export function useGameEngine(level, { onHit, onMiss, onComplete } = {}) {
  const [status, setStatus] = useState('idle');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [comboMax, setComboMax] = useState(0);
  const [lastHit, setLastHit] = useState(null);
  const [tokenStates, setTokenStates] = useState([]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [hitStats, setHitStats] = useState({ perfect: 0, good: 0, miss: 0 });
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
    setComboMax(0);
    setLastHit(null);
    setHitStats({ perfect: 0, good: 0, miss: 0 });
  }, [level, beatMs]);

  const updateLoop = useCallback(() => {
    const now = performance.now();
    const elapsed = now - startTimeRef.current;
    setElapsedMs(elapsed);
    setTokenStates((prev) =>
      prev.map((token) => {
        if (token.status !== 'pending') return token;
        const delta = elapsed - token.timeMs;
        if (delta > (level?.scoring?.windowsMs?.miss ?? DEFAULT_WINDOWS.miss)) {
          onMiss?.(token);
          setLastHit({ result: 'miss', sound: token.sound });
          setCombo(0);
          setHitStats((stats) => ({ ...stats, miss: stats.miss + 1 }));
          return { ...token, status: 'miss' };
        }
        return token;
      }),
    );
    rafRef.current = requestAnimationFrame(updateLoop);
  }, [level?.scoring?.windowsMs?.miss, onMiss]);

  useEffect(() => {
    if (status !== 'playing') return;
    rafRef.current = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [status, updateLoop]);

  const start = useCallback(() => {
    if (!level) return;
    startTimeRef.current = performance.now();
    setStatus('playing');
    setLastHit(null);
    setScore(0);
    setCombo(0);
    setComboMax(0);
    setElapsedMs(0);
    setHitStats({ perfect: 0, good: 0, miss: 0 });
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
    const windows = level?.scoring?.windowsMs ?? DEFAULT_WINDOWS;
    const points = level?.scoring?.points ?? DEFAULT_POINTS;

    setTokenStates((prev) => {
      const next = prev.map((token) => {
        if (token.status !== 'pending' || hitToken) return token;
        const delta = Math.abs(elapsed - token.timeMs);
        if (delta <= windows.perfect) {
          hitToken = token;
          hitWindow = 'perfect';
          return { ...token, status: 'perfect' };
        }
        if (delta <= windows.good) {
          hitToken = token;
          hitWindow = 'good';
          return { ...token, status: 'good' };
        }
        return token;
      });
      return next;
    });

    if (hitToken && hitWindow) {
      const deltaScore = points[hitWindow] ?? 0;
      setScore((prev) => prev + deltaScore);
      setCombo((prev) => {
        const nextCombo = prev + 1;
        setComboMax((max) => Math.max(max, nextCombo));
        return nextCombo;
      });
      setHitStats((stats) => ({ ...stats, [hitWindow]: stats[hitWindow] + 1 }));
      setLastHit({ result: hitWindow, sound: hitToken.sound });
      onHit?.(hitToken, hitWindow);
    } else {
      setCombo(0);
      setLastHit({ result: 'miss' });
      setHitStats((stats) => ({ ...stats, miss: stats.miss + 1 }));
    }
  }, [level?.scoring?.points, level?.scoring?.windowsMs, onHit, status]);

  useEffect(() => {
    if (status !== 'playing') return;
    const allResolved = tokenStates.every((token) => token.status !== 'pending');
    if (!allResolved) return;
    const total = tokenStates.length;
    const hits = hitStats.perfect + hitStats.good;
    const accuracy = total ? hits / total : 0;
    const minAccuracy = level?.completion?.minAccuracy ?? level?.scoring?.minAccuracy ?? 0;
    const minCombo = level?.completion?.minCombo ?? level?.scoring?.minCombo ?? 0;
    const success = accuracy >= minAccuracy && comboMax >= minCombo && hitStats.miss === 0;
    const result = {
      levelId: level?.id,
      score,
      accuracy,
      comboMax,
      durationMs: elapsedMs,
      hits: hitStats,
      success,
    };
    setStatus(success ? 'success' : 'fail');
    onComplete?.(result);
  }, [comboMax, elapsedMs, hitStats, level, onComplete, score, status, tokenStates]);

  return {
    status,
    score,
    combo,
    comboMax,
    lastHit,
    tokenStates,
    beatMs,
    elapsedMs,
    start,
    stop,
    handleHit,
    hitStats,
  };
}
