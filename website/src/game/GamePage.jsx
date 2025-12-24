import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  $project,
  $saveStatus,
  init,
  setActiveDeck,
  setBpm,
  setCode,
  setDeckCode,
  setFxState,
  setLevel,
  setMixer,
} from './projectStore.mjs';
import StatusBar from '../repl/components/StatusBar';
import { getLevel, getNextLevel, listLevels } from './levels/levels.mjs';
import { useGameEngine } from './useGameEngine.mjs';
import { getLoreLine } from './lore.mjs';
import LorePanel from './components/LorePanel.jsx';
import CodeBuilder from './components/CodeBuilder.jsx';
import CountdownOverlay from './components/CountdownOverlay.jsx';
import GlobalCodePanel from './components/GlobalCodePanel.jsx';
import LevelSelect from './components/LevelSelect.jsx';
import ResultsScreen from './components/ResultsScreen.jsx';
import ProfileScreen from './components/ProfileScreen.jsx';
import {
  $playerProfile,
  addCreation,
  exportProfile,
  importProfile,
  init as initPlayer,
  recordRun,
  setDisplayName,
} from './playerStore.mjs';
import { useGameAudio } from './useGameAudio.mjs';

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
const EMPTY_PLAYER_CODE = 's(\"\")';

export default function GamePage() {
  const project = useStore($project);
  const saveStatus = useStore($saveStatus);
  const profile = useStore($playerProfile);
  const [notice, setNotice] = useState('');
  const [playerSections, setPlayerSections] = useState([]);
  const [loreLines, setLoreLines] = useState([]);
  const [finalComment, setFinalComment] = useState('');
  const [view, setView] = useState('select');
  const [selectedLevelId, setSelectedLevelId] = useState('1');
  const [runResult, setRunResult] = useState(null);
  const [countdownLabel, setCountdownLabel] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const countdownTimerRef = useRef(0);
  const startTimerRef = useRef(0);
  const lastEvaluatedRef = useRef('');
  const playerCodeRef = useRef('');
  const levels = useMemo(() => listLevels(), []);
  const currentLevel = useMemo(() => getLevel(selectedLevelId) ?? levels[0], [levels, selectedLevelId]);
  const gameAudio = useGameAudio();

  useEffect(() => {
    init();
    initPlayer();
  }, []);

  useEffect(() => {
    return () => {
      window.clearTimeout(countdownTimerRef.current);
      window.clearTimeout(startTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!currentLevel) return;
    setBpm(currentLevel.bpm, 'game');
  }, [currentLevel]);

  const buildPlayerCode = useCallback((sections, level) => {
    const fragments = (sections || [])
      .map((section) => section?.fragment)
      .filter(Boolean);
    if (!fragments.length) return '';
    const fx = level?.playerFx ?? '';
    return `$: s("${fragments.join(' ')}")${fx}`;
  }, []);

  const buildCombinedCode = useCallback((baseCode, playerCode) => {
    const base = baseCode?.trim() ?? '';
    const player = playerCode?.trim() ?? '';
    if (!base) return player;
    if (!player) return base;
    if (player.startsWith(base)) return player;
    return `${base}\n${player}`;
  }, []);

  const playerCode = project?.code ?? '';
  useEffect(() => {
    playerCodeRef.current = playerCode;
  }, [playerCode]);
  const combinedCode = useMemo(
    () => buildCombinedCode(currentLevel?.baseCode, playerCode),
    [buildCombinedCode, currentLevel?.baseCode, playerCode],
  );

  const handleTokenHit = (token, result) => {
    if (!token) return;
    setPlayerSections((prev) => {
      const nextSection = currentLevel?.sections?.[prev.length];
      if (!nextSection) {
        return prev;
      }
      const next = [...prev, nextSection];
      const nextCode = buildPlayerCode(next, currentLevel);
      setCode(nextCode || EMPTY_PLAYER_CODE, 'game-hit');
      return next;
    });
    setNotice(`${result} · ${token.sound}`);
    setLoreLines((prev) => {
      const next = [getLoreLine(token.sound, currentLevel?.lore?.tokens), ...prev];
      return next.slice(0, 6);
    });
  };

  const handleLevelComplete = async (result) => {
    if (result?.success) {
      setLevel(currentLevel.id, 'level-completed');
      setFinalComment(currentLevel?.lore?.finalComment || 'Bien joue, tu as termine la sequence.');
    } else {
      setFinalComment('Tu y es presque, essaie encore.');
    }
    setNotice(result?.success ? 'Level complete!' : 'Run failed.');
    const entry = await recordRun(result);
    setRunResult({ ...result, ...entry });
    setView('results');
    stopPlayback();
  };

  const handleSaveCreation = async () => {
    if (!project) return;
    await addCreation({
      title: `${currentLevel?.title || 'Level'} run`,
      type: 'gameRun',
      code: project.code,
      bpm: project.bpm,
      source: 'game',
      meta: {
        levelId: currentLevel?.id,
        score: runResult?.score,
        accuracy: runResult?.accuracy,
      },
    });
    setNotice('Creation saved.');
  };

  const handleLoadCreation = (creation) => {
    if (!creation) return;
    if (creation.codeA || creation.codeB) {
      setDeckCode('A', creation.codeA ?? '');
      setDeckCode('B', creation.codeB ?? '');
      setMixer(creation.mixer ?? {});
      setFxState(creation.fx ?? {});
      setBpm(creation.bpm ?? project?.bpm ?? 120, 'edit');
      setActiveDeck(creation.activeDeck ?? 'A');
      setNotice('Creation loaded.');
      return;
    }
    if (creation.code) {
      setCode(creation.code, 'game-creation');
      setBpm(creation.bpm ?? project?.bpm ?? 120, 'edit');
      setNotice('Creation loaded.');
    }
  };

  const handleExportProfile = () => {
    const json = exportProfile();
    if (!json) return;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'strudel-profile.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportProfile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      await importProfile(text);
      setNotice('Profile imported.');
    } catch (err) {
      setNotice('Import failed.');
    } finally {
      event.target.value = '';
    }
  };

  const engine = useGameEngine(currentLevel, {
    onHit: handleTokenHit,
    onComplete: handleLevelComplete,
  });

  useEffect(() => {
    if (view !== 'play') return;
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
  }, [engine, view]);

  const handleAddToken = () => {
    if (!project) return;
    engine.handleHit();
  };

  const statusClass = statusStyles[saveStatus.status] ?? 'text-gray-400';
  const statusLabel = statusLabels[saveStatus.status] ?? 'Status';

  const stopPlayback = useCallback(() => {
    window.clearTimeout(countdownTimerRef.current);
    window.clearTimeout(startTimerRef.current);
    setCountdownLabel('');
    setIsPlaying(false);
    gameAudio.stop();
    engine.stop();
  }, [engine, gameAudio]);

  useEffect(() => {
    if (view === 'play') return;
    stopPlayback();
  }, [stopPlayback, view]);

  useEffect(() => {
    if (!isPlaying) return;
    if (!combinedCode) return;
    if (combinedCode === lastEvaluatedRef.current) return;
    lastEvaluatedRef.current = combinedCode;
    gameAudio.evaluate(combinedCode);
  }, [combinedCode, gameAudio, isPlaying]);

  const schedulePlaybackStart = useCallback(() => {
    if (!currentLevel) return;
    const bpm = currentLevel.bpm || 120;
    gameAudio.setBpm(bpm);
    const beatSec = 60 / bpm;
    const now = gameAudio.getNow();
    const nextBeat = Math.ceil(now / beatSec) * beatSec;
    const delayMs = Math.max(0, (nextBeat - now) * 1000);
    window.clearTimeout(startTimerRef.current);
    startTimerRef.current = window.setTimeout(() => {
      lastEvaluatedRef.current = '';
      engine.start();
      setIsPlaying(true);
      const nextCombined = buildCombinedCode(currentLevel?.baseCode, playerCodeRef.current);
      lastEvaluatedRef.current = nextCombined;
      gameAudio.evaluate(nextCombined);
    }, delayMs);
  }, [buildCombinedCode, currentLevel, engine, gameAudio]);

  const runCountdown = useCallback(() => {
    if (!currentLevel) return;
    window.clearTimeout(countdownTimerRef.current);
    const bpm = currentLevel.bpm || 120;
    const beatsPerCount = bpm < 80 ? 2 : 1;
    const stepMs = (60_000 / bpm) * beatsPerCount;
    const labels = ['3', '2', '1', 'GO'];
    let index = 0;
    const tick = () => {
      const label = labels[index];
      setCountdownLabel(label);
      if (label === 'GO') {
        schedulePlaybackStart();
      }
      index += 1;
      if (index < labels.length) {
        countdownTimerRef.current = window.setTimeout(tick, stepMs);
      } else {
        countdownTimerRef.current = window.setTimeout(() => setCountdownLabel(''), stepMs);
      }
    };
    tick();
  }, [currentLevel, schedulePlaybackStart]);

  const startLevel = () => {
    stopPlayback();
    setPlayerSections([]);
    setLoreLines([]);
    setFinalComment('');
    setRunResult(null);
    setCode(EMPTY_PLAYER_CODE, 'game-start');
    lastEvaluatedRef.current = '';
    setNotice('Level started.');
    setView('play');
    runCountdown();
  };

  const handleNextLevel = () => {
    const nextLevel = getNextLevel(currentLevel?.id);
    setSelectedLevelId(nextLevel.id);
    setRunResult(null);
    setView('select');
  };

  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-8">
      <CountdownOverlay label={countdownLabel} />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-foreground/60">Game Mode</div>
            <h1 className="text-2xl font-semibold">{currentLevel?.title || 'Levels'}</h1>
          </div>
          <a
            href={`${baseNoTrailing}/`}
            className="rounded-full border border-foreground/20 px-3 py-1 text-xs uppercase tracking-wide hover:opacity-80"
          >
            Retour REPL
          </a>
        </div>

        {view === 'select' && (
          <LevelSelect
            levels={levels}
            progressMap={profile?.levels}
            selectedId={selectedLevelId}
            onSelect={setSelectedLevelId}
            onPlay={startLevel}
            onProfile={() => setView('profile')}
          />
        )}

        {view === 'profile' && (
          <ProfileScreen
            profile={profile}
            onRename={setDisplayName}
            onBack={() => setView('select')}
            onExportProfile={handleExportProfile}
            onImportProfile={handleImportProfile}
            onLoadCreation={handleLoadCreation}
          />
        )}

        {view === 'results' && (
          <ResultsScreen
            level={currentLevel}
            result={runResult}
            onRetry={startLevel}
            onNext={handleNextLevel}
            onBack={() => setView('select')}
            onSaveCreation={handleSaveCreation}
          />
        )}

        {view === 'play' && (
          <>
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
            </section>

            <section className="grid gap-4 md:grid-cols-[1.2fr,1fr]">
              <div className="space-y-3 rounded-2xl border border-foreground/15 bg-black/20 p-4">
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
              <div className="space-y-4">
                <CodeBuilder code={playerCode} finalComment={finalComment} />
                <LorePanel lines={loreLines} />
                <GlobalCodePanel
                  baseCode={currentLevel?.baseCode}
                  playerCode={playerCode}
                  combinedCode={combinedCode}
                  onApply={() => {
                    setCode(combinedCode, 'game-apply');
                    setNotice('Applied to REPL.');
                  }}
                />
              </div>
            </section>
          </>
        )}
      </div>
      <StatusBar saveStatusOverride={saveStatus} />
    </main>
  );
}
