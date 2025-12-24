import { buildDeckCode } from './madamixEngine.mjs';
import { createDeckRunner } from './deckRunner.mjs';

const runners = {
  A: null,
  B: null,
};

function normalizeDeck(deck) {
  return deck === 'B' ? 'B' : 'A';
}

export function ensureDeck(deck) {
  const deckId = normalizeDeck(deck);
  if (!runners[deckId]) {
    runners[deckId] = createDeckRunner();
  }
  return runners[deckId];
}

export async function playDeck(deck, code, bpm) {
  const deckId = normalizeDeck(deck);
  const runner = ensureDeck(deckId);
  if (!runner) return;
  await runner.ready;
  if (Number.isFinite(bpm)) {
    runner.repl.setCps(bpm / 240);
  }
  const deckCode = buildDeckCode(code, deckId);
  runner.repl.stop();
  if (!deckCode) {
    runner.setPlaying(false);
    return;
  }
  await runner.repl.evaluate(deckCode, true);
  runner.setPlaying(true);
}

export function stopDeck(deck) {
  const deckId = normalizeDeck(deck);
  const runner = runners[deckId];
  if (!runner) return;
  runner.repl.stop();
  runner.setPlaying(false);
}

export function stopAll() {
  stopDeck('A');
  stopDeck('B');
}

export function setGlobalBpm(bpm) {
  if (!Number.isFinite(bpm)) return;
  Object.values(runners).forEach((runner) => {
    if (!runner) return;
    runner.repl.setCps(bpm / 240);
  });
}

export function getDeckStatus() {
  return {
    A: Boolean(runners.A?.isPlaying?.()),
    B: Boolean(runners.B?.isPlaying?.()),
  };
}
