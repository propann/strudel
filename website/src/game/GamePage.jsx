import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import { $project, $saveStatus, init, setBpm, setCode, setLevel } from './projectStore.mjs';
import StatusBar from '../repl/components/StatusBar';
import { levels } from './levels.mjs';
import { useGameEngine } from './useGameEngine.mjs';

const { BASE_URL } = import.meta.env;
const baseNoTrailing = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;

const statusLabels = {
  saved: 'Saved',
  saving: 'Saving',
  error: 'Save error',
};
const statusStyles = {
  saved: 'text-green-400',
  saving: 'text-yellow-400',
  error: 'text-red-400',
};

export default function GamePage() {
  const project = useStore($project);
  const saveStatus = useStore($saveStatus);
  const [notice, setNotice] = useState('');
  const [sequence, setSequence] = useState([]);
  const currentLevel = useMemo(() => levels[0], []);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (!currentLevel) return;
    setBpm(currentLevel.bpm, 'game');
  }, [currentLevel]);

  const handleTokenHit = (token, result) => {
    if (!token) return;
    setSequence((prev) => {
      const next = [...prev, token.sound];
      const code = `s("${next.join(' ')}")`;
      setCode(code, 'game-hit');
      return next;
    });
    setNotice(`${result} · ${token.sound}`);
  };

  const handleLevelComplete = () => {
    setLevel(currentLevel.id, 'level-completed');
    setNotice('Level complete!');
  };

  const engine = useGameEngine(currentLevel, {
    onHit: handleTokenHit,
    onComplete: handleLevelComplete,
  });

  useEffect(() => {
    const handleKeydown = (event) => {
      const target = event.target;
      const isEditable =
        target?.isContentEditable ||
        target?.closest?.('input,textarea,select') ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName);
      if (isEditable) return;
      if (event.code === 'Space') {
        event.preventDefault();
        engine.handleHit();
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [engine]);

  const handleAddToken = () => {
    if (!project) return;
    engine.handleHit();
  };

  const statusClass = statusStyles[saveStatus.status] ?? 'text-gray-400';
  const statusLabel = statusLabels[saveStatus.status] ?? 'Status';

  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-foreground/60">Game Mode</div>
            <h1 className="text-2xl font-semibold">{currentLevel.name}</h1>
          </div>
          <a
            href={`${baseNoTrailing}/`}
            className="rounded-full border border-foreground/20 px-3 py-1 text-xs uppercase tracking-wide hover:opacity-80"
          >
            Retour REPL
          </a>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className={statusClass}>●</span>
            <span className="text-xs uppercase tracking-[0.2em] text-foreground/70">{statusLabel}</span>
          </div>
          <div className="text-xs uppercase tracking-[0.2em] text-foreground/60">
            Score {engine.score} · Combo {engine.combo}
          </div>
          <div className="text-xs uppercase tracking-[0.2em] text-foreground/60">
            State {engine.status}
          </div>
          {engine.lastHit?.result && (
            <div
              className={`text-xs uppercase tracking-[0.2em] ${
                engine.lastHit.result === 'perfect'
                  ? 'text-green-300'
                  : engine.lastHit.result === 'good'
                    ? 'text-yellow-300'
                    : 'text-red-300'
              }`}
            >
              {engine.lastHit.result}
            </div>
          )}
          {notice && <div className="text-xs text-foreground/70">· {notice}</div>}
        </div>

        <section className="relative h-[360px] rounded-2xl border border-foreground/15 bg-black/30 p-6">
          <div className="absolute left-0 right-0 top-8 mx-auto h-px w-[80%] bg-foreground/15" />
          <div className="absolute bottom-10 left-0 right-0 mx-auto h-[2px] w-[80%] bg-foreground/40" />
          <div className="absolute bottom-4 left-0 right-0 mx-auto w-[80%] text-center text-xs uppercase tracking-[0.2em] text-foreground/60">
            hit line
          </div>

          {engine.tokenStates.map((token) => {
            if (engine.status === 'idle') return null;
            const timeUntilHit = token.timeMs - engine.elapsedMs;
            const fallWindow = 2000;
            if (timeUntilHit > fallWindow) return null;
            const progress = Math.min(1, Math.max(0, 1 - timeUntilHit / fallWindow));
            const top = `${progress * 75}%`;
            const color =
              token.status === 'perfect'
                ? 'bg-green-400'
                : token.status === 'good'
                  ? 'bg-yellow-400'
                  : token.status === 'miss'
                    ? 'bg-red-400'
                  : 'bg-foreground/70';
            return (
              <div
                key={token.id}
                className={`absolute left-1/2 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full text-xs uppercase tracking-wide text-black ${color}`}
                style={{ top }}
              >
                {token.sound}
              </div>
            );
          })}

          <div className="absolute bottom-20 left-0 right-0 flex items-center justify-center">
            <button
              type="button"
              onClick={() => {
                setSequence([]);
                setCode('s(\"\")', 'game-start');
                engine.start();
                setNotice('Level started.');
              }}
              className="rounded-full border border-foreground/20 bg-foreground/10 px-4 py-2 text-xs uppercase tracking-[0.2em] hover:opacity-80"
            >
              Start
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-[2fr,1fr]">
          <div className="space-y-2 rounded-2xl border border-foreground/15 bg-black/20 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-foreground/60">Lane input</div>
            <p className="text-sm text-foreground/80">Press Space to hit tokens.</p>
            <button
              type="button"
              onClick={handleAddToken}
              className="mt-2 rounded bg-blue-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-blue-400"
            >
              Hit
            </button>
          </div>
          <div className="space-y-2 rounded-2xl border border-foreground/15 bg-black/20 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-foreground/60">Code (Strudel)</div>
            <pre className="whitespace-pre-wrap break-words text-xs text-foreground/80">
              {project?.code || 'Hit tokens to build code.'}
            </pre>
          </div>
        </section>
      </div>
      <StatusBar saveStatusOverride={saveStatus} />
    </main>
  );
}
