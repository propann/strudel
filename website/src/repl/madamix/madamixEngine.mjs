const clamp01 = (value) => Math.min(1, Math.max(0, value ?? 0));

export function computeDeckGains(mixer) {
  const cross = clamp01(mixer?.crossfader ?? 0.5);
  const volA = clamp01(mixer?.volA ?? 1);
  const volB = clamp01(mixer?.volB ?? 1);
  const gainA = Math.cos(cross * (Math.PI / 2)) * volA;
  const gainB = Math.sin(cross * (Math.PI / 2)) * volB;
  return { gainA, gainB };
}

function defaultFxState() {
  return {
    echo: { active: false, mode: 'momentary', amount: 0.6 },
    filter: { active: false, mode: 'momentary', amount: 0.5, kind: 'lpf' },
    disto: { active: false, mode: 'momentary', amount: 0.4 },
    reverb: { active: false, mode: 'momentary', amount: 0.5 },
  };
}

export function getMadaMixRuntime(project) {
  const fxA = { ...defaultFxState(), ...(project?.fx?.A ?? {}) };
  const fxB = { ...defaultFxState(), ...(project?.fx?.B ?? {}) };
  const mixer = project?.mixer ?? {};
  const gains = computeDeckGains(mixer);
  return {
    gainA: gains.gainA,
    gainB: gains.gainB,
    fx: { A: fxA, B: fxB },
  };
}

export function updateMadaMixRuntime(project) {
  if (typeof window === 'undefined') return;
  const runtime = getMadaMixRuntime(project);
  const existing = window.__madamix ?? {};
  window.__madamix = { ...existing, ...runtime };
}

function appendChain(line, chain) {
  const [base, comment] = line.split('//');
  if (!base.trim()) return line;
  const next = `${base.trimEnd()}${chain}`;
  if (comment === undefined) return next;
  return `${next} //${comment}`;
}

function transformDeckCode(code, deckKey) {
  if (!code?.trim()) return '';
  const chain = [
    `.gain(__madamixGain${deckKey})`,
    `.delay(__madamixDelay${deckKey})`,
    `.delaytime(__madamixDelayTime${deckKey})`,
    `.delayfeedback(__madamixDelayFb${deckKey})`,
    `.lpf(__madamixLpf${deckKey})`,
    `.hpf(__madamixHpf${deckKey})`,
    `.distort(__madamixDisto${deckKey})`,
    `.room(__madamixRoom${deckKey})`,
    `.analyze(${deckKey === 'A' ? 1 : 2})`,
  ].join('');

  return code
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed.startsWith('$:')) return line;
      if (trimmed.includes('__madamixGain')) return line;
      return appendChain(line, chain);
    })
    .join('\n');
}

export function buildMadaMixCode(project) {
  const codeA = project?.codeA ?? project?.code ?? '';
  const codeB = project?.codeB ?? '';
  const deckA = transformDeckCode(codeA, 'A');
  const deckB = transformDeckCode(codeB, 'B');

  return [
    'const __madamixRef = typeof ref === "function" ? ref : (accessor) => accessor();',
    'const __madamixGet = () => globalThis.__madamix || { gainA: 1, gainB: 1, fx: { A: {}, B: {} } };',
    'const __madamixGainA = __madamixRef(() => (__madamixGet().gainA ?? 1));',
    'const __madamixGainB = __madamixRef(() => (__madamixGet().gainB ?? 1));',
    'const __madamixDelayA = __madamixRef(() => (__madamixGet().fx?.A?.echo?.active ? (__madamixGet().fx?.A?.echo?.amount ?? 0.4) : 0));',
    'const __madamixDelayB = __madamixRef(() => (__madamixGet().fx?.B?.echo?.active ? (__madamixGet().fx?.B?.echo?.amount ?? 0.4) : 0));',
    'const __madamixDelayTimeA = __madamixRef(() => (__madamixGet().fx?.A?.echo?.active ? 0.25 : 0.25));',
    'const __madamixDelayTimeB = __madamixRef(() => (__madamixGet().fx?.B?.echo?.active ? 0.25 : 0.25));',
    'const __madamixDelayFbA = __madamixRef(() => (__madamixGet().fx?.A?.echo?.active ? 0.45 : 0));',
    'const __madamixDelayFbB = __madamixRef(() => (__madamixGet().fx?.B?.echo?.active ? 0.45 : 0));',
    'const __madamixLpfA = __madamixRef(() => { const fx = __madamixGet().fx?.A?.filter; if (!fx?.active || fx?.kind === "hpf") return 20000; const amt = fx.amount ?? 0.5; return 200 + (1 - amt) * 14000; });',
    'const __madamixLpfB = __madamixRef(() => { const fx = __madamixGet().fx?.B?.filter; if (!fx?.active || fx?.kind === "hpf") return 20000; const amt = fx.amount ?? 0.5; return 200 + (1 - amt) * 14000; });',
    'const __madamixHpfA = __madamixRef(() => { const fx = __madamixGet().fx?.A?.filter; if (!fx?.active || fx?.kind === "lpf") return 0; const amt = fx.amount ?? 0.5; return 40 + amt * 6000; });',
    'const __madamixHpfB = __madamixRef(() => { const fx = __madamixGet().fx?.B?.filter; if (!fx?.active || fx?.kind === "lpf") return 0; const amt = fx.amount ?? 0.5; return 40 + amt * 6000; });',
    'const __madamixDistoA = __madamixRef(() => (__madamixGet().fx?.A?.disto?.active ? (__madamixGet().fx?.A?.disto?.amount ?? 0.4) : 0));',
    'const __madamixDistoB = __madamixRef(() => (__madamixGet().fx?.B?.disto?.active ? (__madamixGet().fx?.B?.disto?.amount ?? 0.4) : 0));',
    'const __madamixRoomA = __madamixRef(() => (__madamixGet().fx?.A?.reverb?.active ? (__madamixGet().fx?.A?.reverb?.amount ?? 0.5) : 0));',
    'const __madamixRoomB = __madamixRef(() => (__madamixGet().fx?.B?.reverb?.active ? (__madamixGet().fx?.B?.reverb?.amount ?? 0.5) : 0));',
    '',
    deckA ? `// Deck A\n${deckA}` : '// Deck A (empty)',
    '',
    deckB ? `// Deck B\n${deckB}` : '// Deck B (empty)',
  ].join('\n');
}
