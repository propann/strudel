import { useEffect, useRef, useState } from 'react';
import { analysers, getAnalyzerData } from '@strudel/webaudio';
import './VuMeter.css';

const ATTACK_MS = 30;
const RELEASE_MS = 200;

function computeRms(id) {
  const analyser = analysers?.[id];
  if (!analyser) return 0;
  const data = getAnalyzerData('time', id);
  if (!data?.length) return 0;
  let sum = 0;
  for (let i = 0; i < data.length; i += 1) {
    const v = data[i];
    sum += v * v;
  }
  const rms = Math.sqrt(sum / data.length);
  return Math.min(1, rms * 2.2);
}

export default function VuMeter({ id, label, className }) {
  const [level, setLevel] = useState(0);
  const levelRef = useRef(0);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    let raf = 0;
    const tick = (time) => {
      const last = lastTimeRef.current || time;
      const dt = Math.max(0, time - last);
      lastTimeRef.current = time;
      const target = computeRms(id);
      const current = levelRef.current;
      const tau = target > current ? ATTACK_MS : RELEASE_MS;
      const coeff = Math.exp(-dt / tau);
      const next = target + (current - target) * coeff;
      levelRef.current = next;
      setLevel(next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [id]);

  return (
    <div className={`madamix-vu ${className ?? ''}`}>
      <div className="madamix-mini">{label}</div>
      <div className="madamix-vu-track">
        <div className="madamix-vu-fill" style={{ height: `${Math.round(level * 100)}%` }} />
      </div>
    </div>
  );
}
