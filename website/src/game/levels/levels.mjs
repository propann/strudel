const defaultScoring = {
  windowsMs: { perfect: 80, good: 160, miss: 220 },
  points: { perfect: 100, good: 60, miss: 0 },
  minAccuracy: 0.8,
  minCombo: 1,
};

const levelData = [
  {
    id: '1',
    title: 'Percu simple',
    theme: 'shylt-percu',
    bpm: 100,
    tokens: [
      { beat: 0, sound: 'bd' },
      { beat: 1, sound: 'sn' },
      { beat: 2, sound: 'bd' },
      { beat: 3, sound: 'sn' },
    ],
    baseCode: '$: s("hh*4").gain(0.25)',
    playerTargetCode: '$: s("bd sn bd sn")',
    targetCode: 's("bd sn bd sn")',
    sections: [
      { id: 'intro', label: 'Intro perc', fragment: 'bd' },
      { id: 'snare', label: 'Kick/Snare', fragment: 'sn' },
      { id: 'kick2', label: 'Kick retour', fragment: 'bd' },
      { id: 'snare2', label: 'Snare retour', fragment: 'sn' },
    ],
    lore: {
      tokens: {
        bd: 'Kick (grosse caisse) : la pulsation.',
        sn: 'Snare (caisse claire) : l accent.',
      },
      finalComment: 'Tu viens de creer un beat kick + snare bien cale.',
    },
    scoring: defaultScoring,
    completion: { minAccuracy: 0.8, minCombo: 1 },
  },
  {
    id: '2',
    title: 'Percu + hi-hat',
    theme: 'hats',
    bpm: 110,
    tokens: [
      { beat: 0, sound: 'bd' },
      { beat: 1, sound: 'hh' },
      { beat: 2, sound: 'sn' },
      { beat: 3, sound: 'hh' },
    ],
    baseCode: '$: s("hh*8").gain(0.2)',
    playerTargetCode: '$: s("bd hh sn hh")',
    targetCode: 's("bd hh sn hh")',
    sections: [
      { id: 'kick', label: 'Kick', fragment: 'bd' },
      { id: 'hat', label: 'Hi-hat', fragment: 'hh' },
      { id: 'snare', label: 'Snare', fragment: 'sn' },
      { id: 'hat2', label: 'Hi-hat', fragment: 'hh' },
    ],
    lore: {
      tokens: {
        hh: 'Hi-hat : texture et mouvement.',
      },
      finalComment: 'Tu ajoutes un hi-hat pour donner du mouvement.',
    },
    scoring: { ...defaultScoring, minAccuracy: 0.8 },
    completion: { minAccuracy: 0.8, minCombo: 2 },
  },
  {
    id: '3',
    title: 'Bass simple',
    theme: 'bass',
    bpm: 100,
    tokens: [
      { beat: 0, sound: 'bass' },
      { beat: 2, sound: 'bass' },
    ],
    baseCode: '$: s("bd*2").gain(0.2)',
    playerTargetCode: '$: s("bass bass")',
    targetCode: 's("bass bass")',
    sections: [
      { id: 'bass-1', label: 'Bass', fragment: 'bass' },
      { id: 'bass-2', label: 'Bass', fragment: 'bass' },
    ],
    lore: {
      tokens: {
        bass: 'Basse : fondation harmonique.',
      },
      finalComment: 'Tu poses une base de basse simple et efficace.',
    },
    scoring: { ...defaultScoring, minAccuracy: 0.75 },
    completion: { minAccuracy: 0.75, minCombo: 1 },
  },
  {
    id: '4',
    title: 'Structure',
    theme: 'structure',
    bpm: 95,
    tokens: [
      { beat: 0, sound: 'bd' },
      { beat: 1, sound: 'sn' },
      { beat: 2, sound: 'bd' },
      { beat: 3, sound: 'sn' },
      { beat: 4, sound: 'hh' },
      { beat: 5, sound: 'hh' },
      { beat: 6, sound: 'hh' },
      { beat: 7, sound: 'hh' },
    ],
    baseCode: '$: s("hh*8").gain(0.18)',
    playerTargetCode: '$: s("bd sn bd sn hh hh hh hh")',
    targetCode: 's("bd sn bd sn hh hh hh hh")',
    sections: [
      { id: 'kick', label: 'Kick', fragment: 'bd' },
      { id: 'snare', label: 'Snare', fragment: 'sn' },
      { id: 'kick2', label: 'Kick', fragment: 'bd' },
      { id: 'snare2', label: 'Snare', fragment: 'sn' },
      { id: 'hat', label: 'Hi-hat', fragment: 'hh' },
      { id: 'hat2', label: 'Hi-hat', fragment: 'hh' },
      { id: 'hat3', label: 'Hi-hat', fragment: 'hh' },
      { id: 'hat4', label: 'Hi-hat', fragment: 'hh' },
    ],
    lore: {
      finalComment: 'Tu viens de construire une structure repetitive solide.',
    },
    scoring: { ...defaultScoring, minAccuracy: 0.85 },
    completion: { minAccuracy: 0.85, minCombo: 2 },
  },
  {
    id: '5',
    title: 'Parametres',
    theme: 'controls',
    bpm: 90,
    tokens: [
      { beat: 0, sound: 'bd' },
      { beat: 1, sound: 'sn' },
    ],
    baseCode: '$: s("bd*2").gain(0.2)',
    playerTargetCode: '$: s("bd sn").gain(0.8)',
    targetCode: 's("bd sn").gain(0.8)',
    playerFx: '.gain(0.8)',
    sections: [
      { id: 'kick', label: 'Kick', fragment: 'bd' },
      { id: 'snare', label: 'Snare', fragment: 'sn' },
    ],
    lore: {
      finalComment: 'Tu controles le volume pour sculpter ton son.',
    },
    scoring: { ...defaultScoring, minAccuracy: 0.75 },
    completion: { minAccuracy: 0.75, minCombo: 1 },
  },
];

export function listLevels() {
  return levelData;
}

export function getLevel(levelId) {
  return levelData.find((level) => level.id === String(levelId));
}

export function getNextLevel(currentId) {
  const index = levelData.findIndex((level) => level.id === String(currentId));
  if (index === -1) return levelData[0];
  return levelData[Math.min(levelData.length - 1, index + 1)];
}
