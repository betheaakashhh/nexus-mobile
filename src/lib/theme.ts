// src/lib/theme.ts
// Color tokens ported 1:1 from the web app's globals.css (:root dark theme).
// app.json sets userInterfaceStyle: "dark", so this is the only palette for now.
// When we wire up settings sync in Phase 4, accentColor becomes dynamic.

export const colors = {
  bg:      '#1c1b19',
  bg2:     '#24231f',
  bg3:     '#262624',
  bg4:     '#2e2d2b',
  bg5:     '#30302e',
  bg6:     '#383632',

  border:  '#3a3832',
  border2: '#4a4844',

  text:    '#e8e4dc',
  text2:   '#a09890',
  text3:   '#5e5a54',

  accent:  '#c9a96e',
  accent2: '#d4b97e',
  accent3: '#3a3020',

  green:   '#4db88a',
  red:     '#e05c6a',
  amber:   '#e89a45',
  blue:    '#6aa3d8',
  pink:    '#c97eaa',

  white:   '#ffffff',
} as const;

export const radius = {
  r:  12,
  r2: 8,
  r3: 4,
} as const;

// Tag colors — mirrors TAG_COLORS in web contacts page
export const tagColors: Record<string, { bg: string; text: string; border: string }> = {
  emergency: { bg: 'rgba(224,92,106,0.12)', text: '#e05c6a', border: 'rgba(224,92,106,0.3)' },
  family:    { bg: 'rgba(77,184,138,0.12)', text: '#4db88a', border: 'rgba(77,184,138,0.3)' },
  work:      { bg: 'rgba(106,163,216,0.12)', text: '#6aa3d8', border: 'rgba(106,163,216,0.3)' },
  personal:  { bg: 'rgba(201,169,110,0.12)', text: '#c9a96e', border: 'rgba(201,169,110,0.3)' },
};

// Priority colors — mirrors PRIORITY_COLOR in web tasks page
export const priorityColors: Record<string, string> = {
  high: '#e05c6a',
  med:  '#e89a45',
  low:  '#4db88a',
};

// Avatar palette — mirrors AVATAR_PALETTE in web contacts page
export const avatarPalette: Array<[string, string]> = [
  ['#c9a96e', '#3a3020'],
  ['#4db88a', '#1a2e22'],
  ['#e05c6a', '#2e1418'],
  ['#6aa3d8', '#1a2430'],
  ['#c97eaa', '#2e1a28'],
  ['#e89a45', '#2e2010'],
  ['#5dcaa5', '#1a2a26'],
  ['#a78bfa', '#1e1830'],
];

export function avatarColor(name: string): [string, string] {
  const i = (name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % avatarPalette.length;
  return avatarPalette[i];
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}