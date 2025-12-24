/*
Repl.jsx - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://codeberg.org/uzu/strudel/src/branch/main/repl/src/App.js>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { code2hash, getPerformanceTimeSeconds, logger, silence } from '@strudel/core';
import { getDrawContext } from '@strudel/draw';
import { evaluate, transpiler } from '@strudel/transpiler';
import {
  getAudioContextCurrentTime,
  renderPatternAudio,
  webaudioOutput,
  resetGlobalEffects,
  resetLoadedSounds,
  initAudioOnFirstClick,
  resetDefaults,
  initAudio,
} from '@strudel/webaudio';
import { setVersionDefaultsFrom } from './util.mjs';
import { StrudelMirror, defaultSettings } from '@strudel/codemirror';
import { clearHydra } from '@strudel/hydra';
import { useCallback, useEffect, useRef, useState } from 'react';
import { parseBoolean, settingsMap, useSettings } from '../settings.mjs';
import {
  setActivePattern,
  setLatestCode,
  createPatternID,
  userPattern,
  getViewingPatternData,
  setViewingPatternData,
} from '../user_pattern_utils.mjs';
import { superdirtOutput } from '@strudel/osc/superdirtoutput';
import { audioEngineTargets } from '../settings.mjs';
import { useStore } from '@nanostores/react';
import { prebake } from './prebake.mjs';
import { getRandomTune, initCode, loadModules, shareCode } from './util.mjs';
import './Repl.css';
import { setInterval, clearInterval } from 'worker-timers';
import { getMetadata } from '../metadata_parser';
import { debugAudiograph } from './audiograph';
import { $project, init as initProjectStore, setBpm, setDeckCode } from '../game/projectStore.mjs';
import { updateMadaMixRuntime } from './madamix/madamixEngine.mjs';
import {
  getDeckStatus,
  playDeck,
  setGlobalBpm,
  stopAll,
} from './madamix/deckInstances.mjs';

const { latestCode, maxPolyphony, audioDeviceName, multiChannelOrbits } = settingsMap.get();
let modulesLoading, presets, drawContext, clearCanvas, audioReady;

if (typeof window !== 'undefined') {
  audioReady = initAudioOnFirstClick({
    maxPolyphony,
    audioDeviceName,
    multiChannelOrbits: parseBoolean(multiChannelOrbits),
  });
  modulesLoading = loadModules();
  presets = prebake();
  drawContext = getDrawContext();
  clearCanvas = () => drawContext.clearRect(0, 0, drawContext.canvas.height, drawContext.canvas.width);
}

async function getModule(name) {
  if (!modulesLoading) {
    return;
  }
  const modules = await modulesLoading;
  return modules.find((m) => m.packageName === name);
}

const initialCode = `// LOADING`;

export function useReplContext() {
  const { isSyncEnabled, audioEngineTarget, prebakeScript, includePrebakeScriptInShare } = useSettings();
  const shouldUseWebaudio = audioEngineTarget !== audioEngineTargets.osc;
  const defaultOutput = shouldUseWebaudio ? webaudioOutput : superdirtOutput;
  const getTime = shouldUseWebaudio ? getAudioContextCurrentTime : getPerformanceTimeSeconds;
  const init = useCallback(() => {
    const drawTime = [-2, 2];
    const drawContext = getDrawContext();
    const editor = new StrudelMirror({
      sync: isSyncEnabled,
      defaultOutput,
      getTime,
      setInterval,
      clearInterval,
      transpiler,
      autodraw: false,
      root: containerRef.current,
      initialCode,
      pattern: silence,
      drawTime,
      drawContext,
      prebake: async () =>
        Promise.all([modulesLoading, presets]).then(() => {
          if (prebakeScript?.length) {
            return evaluate(prebakeScript ?? '');
          }
        }),
      onUpdateState: (state) => {
        setReplState({ ...state });
      },
      onChange: (code) => {
        const deck = projectRef.current?.activeDeck === 'B' ? 'B' : 'A';
        setDeckCode(deck, code, 'edit');
      },
      onToggle: (playing) => {
        if (!playing) {
          clearHydra();
        }
      },
      beforeEval: () => audioReady,
      afterEval: (all) => {
        const { code } = all;
        const shareCode = projectRef.current?.code ?? code;
        //post to iframe parent (like Udels) if it exists...
        window.parent?.postMessage(shareCode);

        setLatestCode(shareCode);
        window.location.hash = '#' + code2hash(shareCode);
        setDocumentTitle(shareCode);
        const viewingPatternData = getViewingPatternData();
        setVersionDefaultsFrom(shareCode);
        const data = { ...viewingPatternData, code: shareCode };
        let id = data.id;
        const isExamplePattern = viewingPatternData.collection !== userPattern.collection;

        if (isExamplePattern) {
          const codeHasChanged = code !== viewingPatternData.code;
          if (codeHasChanged) {
            // fork example
            const newPattern = userPattern.duplicate(data);
            id = newPattern.id;
            setViewingPatternData(newPattern.data);
          }
        } else {
          id = userPattern.isValidID(id) ? id : createPatternID();
          setViewingPatternData(userPattern.update(id, data).data);
        }
        setActivePattern(id);
      },
      bgFill: false,
    });
    window.strudelMirror = editor;
    window.debugAudiograph = debugAudiograph;

    // init settings
    initCode().then(async (decoded) => {
      let code, msg;
      if (decoded) {
        code = decoded;
        msg = `I have loaded the code from the URL.`;
      } else if (latestCode) {
        code = latestCode;
        msg = `Your last session has been loaded!`;
      } else {
        /* const { code: randomTune, name } = await getRandomTune();
        code = randomTune; */
        code = '$: s("[bd <hh oh>]*2").bank("tr909").dec(.4)';
        msg = `Default code has been loaded`;
      }
      editor.setCode(code);
      setDocumentTitle(code);
      logger(`Welcome to Strudel! ${msg} Press play or hit ctrl+enter to run it!`, 'highlight');
    });

    editorRef.current = editor;
  }, []);

  const [replState, setReplState] = useState({});
  const { started: replStarted, isDirty, error, activeCode, pending } = replState;
  const project = useStore($project);
  const projectRef = useRef(null);
  const editorRef = useRef();
  const containerRef = useRef();
  const [deckStatus, setDeckStatus] = useState({ A: false, B: false });

  const refreshDeckStatus = useCallback(() => {
    setDeckStatus(getDeckStatus());
  }, []);

  // this can be simplified once SettingsTab has been refactored to change codemirrorSettings directly!
  // this will be the case when the main repl is being replaced
  const _settings = useStore(settingsMap, { keys: Object.keys(defaultSettings) });
  useEffect(() => {
    let editorSettings = {};
    Object.keys(defaultSettings).forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(_settings, key)) {
        editorSettings[key] = _settings[key];
      }
    });
    editorRef.current?.updateSettings(editorSettings);
  }, [_settings]);

  useEffect(() => {
    initProjectStore();
  }, []);

  useEffect(() => {
    projectRef.current = project;
    updateMadaMixRuntime(project);
  }, [project]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      refreshDeckStatus();
    }, 500);
    return () => window.clearInterval(timer);
  }, [refreshDeckStatus]);

  useEffect(() => {
    if (!project || !editorRef.current) return;
    const editorCode = editorRef.current.code ?? '';
    const activeDeck = project.activeDeck === 'B' ? 'B' : 'A';
    const projectCode = activeDeck === 'B' ? project.codeB ?? '' : project.codeA ?? '';
    if (!projectCode && editorCode && editorCode !== initialCode) {
      setDeckCode(activeDeck, editorCode, 'init-sync');
    } else if (editorCode !== projectCode) {
      editorRef.current.setCode(projectCode);
    }
    if (Number.isFinite(project.bpm)) {
      editorRef.current.repl.setCps(project.bpm / 240);
    }
  }, [project]);

  //
  // UI Actions
  //

  const setDocumentTitle = (code) => {
    const meta = getMetadata(code);
    document.title = (meta.title ? `${meta.title} - ` : '') + 'Strudel REPL';
  };

  const handleTogglePlay = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor) return;
    const status = getDeckStatus();
    const anyPlaying = status.A || status.B;
    if (anyPlaying) {
      stopAll();
      refreshDeckStatus();
      return;
    }
    const activeDeck = projectRef.current?.activeDeck === 'B' ? 'B' : 'A';
    const deckA = projectRef.current?.codeA ?? project?.codeA ?? '';
    const deckB = projectRef.current?.codeB ?? project?.codeB ?? '';
    const code = activeDeck === 'B' ? deckB : deckA;
    const bpm = projectRef.current?.bpm ?? project?.bpm;
    editor.repl.stop();
    await playDeck(activeDeck, code, bpm);
    refreshDeckStatus();
  }, [project, refreshDeckStatus]);

  const resetEditor = async () => {
    (await getModule('@strudel/tonal'))?.resetVoicings();
    resetDefaults();
    resetGlobalEffects();
    clearCanvas();
    clearHydra();
    resetLoadedSounds();
    if (project?.bpm) {
      editorRef.current.repl.setCps(project.bpm / 240);
    } else {
      editorRef.current.repl.setCps(0.5);
    }
    await prebake(); // declare default samples
  };

  const handleUpdate = async (patternData, reset = false) => {
    setViewingPatternData(patternData);
    editorRef.current.setCode(patternData.code);
    if (reset) {
      await resetEditor();
      handleEvaluate();
    }
  };

  const handleEvaluate = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor) return;
    const activeDeck = projectRef.current?.activeDeck === 'B' ? 'B' : 'A';
    const deckA = projectRef.current?.codeA ?? project?.codeA ?? '';
    const deckB = projectRef.current?.codeB ?? project?.codeB ?? '';
    const code = activeDeck === 'B' ? deckB : deckA;
    const bpm = projectRef.current?.bpm ?? project?.bpm;
    editor.repl.stop();
    await playDeck(activeDeck, code, bpm);
    refreshDeckStatus();
  }, [project, refreshDeckStatus]);

  const handleSetBpm = useCallback(
    (nextBpm, reason = 'edit') => {
      const bpm = Number(nextBpm);
      if (!Number.isFinite(bpm)) return;
      const clamped = Math.min(300, Math.max(20, Math.round(bpm)));
      setBpm(clamped, reason);
      editorRef.current?.repl.setCps(clamped / 240);
      setGlobalBpm(clamped);
    },
    [editorRef],
  );

  useEffect(() => {
    const handleKeydown = (event) => {
      const target = event.target;
      const isEditable =
        target?.isContentEditable ||
        target?.closest?.('.cm-editor') ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName);
      if (isEditable) return;
      if (!event.repeat && event.code === 'Space' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        handleTogglePlay();
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        handleEvaluate();
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [handleEvaluate, handleTogglePlay]);

  const handleExport = async (begin, end, sampleRate, maxPolyphony, multiChannelOrbits, downloadName = undefined) => {
    await editorRef.current.evaluate(false);
    editorRef.current.repl.scheduler.stop();
    await renderPatternAudio(
      editorRef.current.repl.state.pattern,
      editorRef.current.repl.scheduler.cps,
      begin,
      end,
      sampleRate,
      maxPolyphony,
      multiChannelOrbits,
      downloadName,
    ).finally(async () => {
      const { latestCode, maxPolyphony, audioDeviceName, multiChannelOrbits } = settingsMap.get();
      await initAudio({
        latestCode,
        maxPolyphony,
        audioDeviceName,
        multiChannelOrbits,
      });
      editorRef.current.repl.scheduler.stop();
    });
  };
  const handleShuffle = async () => {
    const patternData = await getRandomTune();
    const code = patternData.code;
    logger(`[repl] ✨ loading random tune "${patternData.id}"`);
    setActivePattern(patternData.id);
    setViewingPatternData(patternData);
    await resetEditor();
    stopAll();
    refreshDeckStatus();
    editorRef.current.setCode(code);
    editorRef.current.repl.evaluate(code);
  };

  const handleShare = async () => {
    let code = projectRef.current?.code ?? replState.code;
    if (includePrebakeScriptInShare) {
      code = prebakeScript + '\n' + code;
    }
    shareCode(code);
  };
  const context = {
    started: deckStatus.A || deckStatus.B || replStarted,
    pending,
    isDirty,
    activeCode,
    handleTogglePlay,
    handleUpdate,
    handleShuffle,
    handleShare,
    handleEvaluate,
    handleSetBpm,
    handleExport,
    init,
    error,
    editorRef,
    containerRef,
  };
  return context;
}
