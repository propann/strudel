export const loreDictionary = {
  sound: 'Joue un motif sonore (pattern).',
  bd: 'Kick (grosse caisse) : la pulsation.',
  sn: 'Snare (caisse claire) : l accent.',
  hh: 'Hi-hat : texture et mouvement.',
  bass: 'Basse : fondation harmonique.',
};

export function getLoreLine(token) {
  if (!token) return '';
  const key = token.toLowerCase();
  const explanation = loreDictionary[key] || 'Token sonore detecte.';
  return `${token} :: ${explanation}`;
}
