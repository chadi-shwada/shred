/**
 * Sous-titres WebVTT des vidéos du site. Les textes vivent dans
 * src/data/videos.ts (source unique) : la transcription affichée sous chaque
 * vidéo et les fichiers public/videos/*.vtt en sont tirés, et videos.test.ts
 * vérifie que les fichiers restent alignés.
 */

export interface Cue {
  /** Début et fin, en secondes. */
  start: number;
  end: number;
  /** Étape du parcours affichée en tête de la ligne (démo), facultative. */
  step?: string;
  text: string;
}

function timestamp(seconds: number): string {
  const ms = Math.round(seconds * 1000);
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor(ms / 60_000) % 60;
  const s = Math.floor(ms / 1000) % 60;
  return `${[h, m, s].map((n) => String(n).padStart(2, '0')).join(':')}.${String(ms % 1000).padStart(3, '0')}`;
}

export function cueText(cue: Cue): string {
  return cue.step ? `${cue.step}. ${cue.text}` : cue.text;
}

export function toVtt(cues: readonly Cue[]): string {
  const blocks = cues.map((cue, i) => `${i + 1}\n${timestamp(cue.start)} --> ${timestamp(cue.end)}\n${cueText(cue)}\n`);
  return `WEBVTT\n\n${blocks.join('\n')}`;
}
