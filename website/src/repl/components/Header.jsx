import PlayCircleIcon from '@heroicons/react/20/solid/PlayCircleIcon';
import StopCircleIcon from '@heroicons/react/20/solid/StopCircleIcon';
import { useStore } from '@nanostores/react';
import { useEffect, useState } from 'react';
import cx from '@src/cx.mjs';
import { useSettings, setIsZen } from '../../settings.mjs';
import { $project, $saveStatus } from '../../game/projectStore.mjs';
import '../Repl.css';

const { BASE_URL } = import.meta.env;
const baseNoTrailing = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;

export function Header({ context, embedded = false }) {
  const { started, pending, isDirty, activeCode, handleTogglePlay, handleEvaluate, handleSetBpm, handleShuffle, handleShare } =
    context;
  const isEmbedded = typeof window !== 'undefined' && (embedded || window.location !== window.parent.location);
  const { isZen, isButtonRowHidden, isCSSAnimationDisabled, fontFamily } = useSettings();
  const project = useStore($project);
  const saveStatus = useStore($saveStatus);
  const [bpmInput, setBpmInput] = useState(`${project?.bpm ?? 120}`);

  useEffect(() => {
    if (!project?.bpm) return;
    setBpmInput(`${project.bpm}`);
  }, [project?.bpm]);

  const statusStyles = {
    saved: 'text-green-400',
    saving: 'text-yellow-400',
    error: 'text-red-400',
  };
  const statusClass = statusStyles[saveStatus.status] ?? 'text-gray-400';
  const canRun = isDirty && activeCode;

  return (
    <header
      id="header"
      className={cx(
        'flex-none text-black z-[100] text-lg select-none h-20 md:h-14',
        !isZen && !isEmbedded && 'bg-lineHighlight',
        isZen ? 'h-12 w-8 fixed top-0 left-0' : 'sticky top-0 w-full py-1 justify-between items-center',
        isEmbedded ? 'flex' : 'md:flex',
      )}
      style={{ fontFamily }}
    >
      <div className="px-4 flex space-x-2 md:pt-0 select-none">
        <h1
          onClick={() => {
            if (isEmbedded) window.open(window.location.href.replace('embed', ''));
          }}
          className={cx(
            isEmbedded ? 'text-l cursor-pointer' : 'text-xl',
            'text-foreground font-bold flex space-x-2 items-center',
          )}
        >
          <div
            className={cx(
              'mt-[1px]',
              started && !isCSSAnimationDisabled && 'animate-spin',
              'cursor-pointer text-blue-500',
              isZen && 'fixed top-2 right-4',
            )}
            onClick={() => {
              if (!isEmbedded) {
                setIsZen(!isZen);
              }
            }}
          >
            <span className="block text-foreground rotate-90">꩜</span>
          </div>
          {!isZen && (
            <div className="space-x-2">
              <span className="">strudel</span>
              <span className="text-sm font-medium">REPL</span>
              {!isEmbedded && isButtonRowHidden && (
                <a href={`${baseNoTrailing}/learn`} className="text-sm opacity-25 font-medium">
                  DOCS
                </a>
              )}
            </div>
          )}
        </h1>
      </div>
      {!isZen && !isButtonRowHidden && (
        <div className="flex flex-1 items-center justify-center px-2">
          <div
            className={cx(
              'flex items-center gap-3 rounded-full border border-foreground/10 bg-lineBackground px-3 py-1 text-sm',
              isEmbedded && 'px-2',
            )}
          >
            <button
              onClick={handleTogglePlay}
              title={started ? 'stop (space)' : 'play (space)'}
              className={cx(
                'flex items-center gap-2 rounded-full px-2 py-1 hover:opacity-60',
                !started && !isCSSAnimationDisabled && 'animate-pulse',
              )}
            >
              {!pending ? (
                <>
                  {started ? <StopCircleIcon className="w-5 h-5" /> : <PlayCircleIcon className="w-5 h-5" />}
                  {!isEmbedded && <span className="text-xs uppercase tracking-wide">{started ? 'stop' : 'play'}</span>}
                </>
              ) : (
                <span className="text-xs uppercase tracking-wide">loading</span>
              )}
            </button>
            <button
              onClick={handleEvaluate}
              title="run (ctrl+enter)"
              className={cx(
                'rounded-full px-2 py-1 text-xs uppercase tracking-wide',
                canRun ? 'hover:opacity-60' : 'opacity-40',
              )}
              disabled={!canRun}
            >
              run
            </button>
            <div className="flex items-center gap-2 border-l border-foreground/10 pl-3">
              <label className="text-[10px] uppercase tracking-[0.2em] text-foreground/70">BPM</label>
              <input
                type="number"
                min="20"
                max="300"
                value={bpmInput}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setBpmInput(nextValue);
                  if (nextValue.trim() === '') return;
                  handleSetBpm?.(nextValue, 'edit');
                }}
                onBlur={() => {
                  if (bpmInput.trim() === '') {
                    setBpmInput(`${project?.bpm ?? 120}`);
                    return;
                  }
                  handleSetBpm?.(bpmInput, 'edit');
                }}
                title="tempo in BPM"
                className="w-16 rounded-md bg-transparent px-2 py-1 text-xs text-foreground outline-none ring-1 ring-foreground/10 focus:ring-foreground/30"
              />
            </div>
            <div className="flex items-center gap-2 border-l border-foreground/10 pl-3">
              <span className={cx('text-xs', statusClass)}>●</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/70">
                {saveStatus.status}
              </span>
            </div>
          </div>
        </div>
      )}
      {!isZen && !isButtonRowHidden && (
        <div className="flex max-w-full overflow-auto text-foreground px-1 md:px-2">
          {/* !isEmbedded && (
            <button
              title="shuffle"
              className="hover:opacity-50 p-2 flex items-center space-x-1"
              onClick={handleShuffle}
            >
              <span> shuffle</span>
            </button>
          ) */}
          {!isEmbedded && (
            <button
              title="share"
              className={cx(
                'cursor-pointer hover:opacity-50 flex items-center space-x-1',
                !isEmbedded ? 'p-2' : 'px-2',
              )}
              onClick={handleShare}
            >
              <span>share</span>
            </button>
          )}
          {!isEmbedded && (
            <a
              title="learn"
              href={`${baseNoTrailing}/workshop/getting-started/`}
              className={cx('hover:opacity-50 flex items-center space-x-1', !isEmbedded ? 'p-2' : 'px-2')}
            >
              <span>learn</span>
            </a>
          )}
          {!isEmbedded && (
            <a
              title="game"
              href={`${baseNoTrailing}/game`}
              className={cx('hover:opacity-50 flex items-center space-x-1', !isEmbedded ? 'p-2' : 'px-2')}
            >
              <span>game</span>
            </a>
          )}
          {/* {isEmbedded && (
            <button className={cx('hover:opacity-50 px-2')}>
              <a href={window.location.href} target="_blank" rel="noopener noreferrer" title="Open in REPL">
                🚀
              </a>
            </button>
          )}
          {isEmbedded && (
            <button className={cx('hover:opacity-50 px-2')}>
              <a
                onClick={() => {
                  window.location.href = initialUrl;
                  window.location.reload();
                }}
                title="Reset"
              >
                💔
              </a>
            </button>
          )} */}
        </div>
      )}
    </header>
  );
}
