import { useId } from 'react';
import type { Video } from '../data/videos';
import type { Cue } from '../lib/vtt';

/** Regroupe les répliques consécutives d'une même étape, pour la transcription. */
function groupByStep(cues: readonly Cue[]): { step?: string; lines: string[] }[] {
  const groups: { step?: string; lines: string[] }[] = [];
  for (const cue of cues) {
    const last = groups.at(-1);
    if (last && cue.step && last.step === cue.step) last.lines.push(cue.text);
    else groups.push({ step: cue.step, lines: [cue.text] });
  }
  return groups;
}

/**
 * Vidéo hébergée sur le site (aucun lecteur tiers). Rien n'est chargé avant
 * la lecture (preload="none"), pas de lecture automatique. Vidéo sans paroles,
 * avec musique et bruitages : sous-titres disponibles dans le lecteur et transcription complète dessous.
 */
export function VideoPlayer({ video }: { video: Video }) {
  const titleId = useId();
  return (
    <figure className="video" aria-labelledby={titleId}>
      <video controls preload="none" playsInline poster={video.poster} aria-labelledby={titleId}>
        <source src={video.src} type="video/mp4" />
        <track kind="captions" src={video.captions} srcLang="fr" label="Français" />
        <a href={video.src}>Télécharger la vidéo</a>
      </video>
      <figcaption>
        <span className="video__title" id={titleId}>
          {video.title}
        </span>
        <span className="video__meta">{video.duration} · musique, sans paroles</span>
        <VideoTranscript video={video} />
      </figcaption>
    </figure>
  );
}

/** Transcription repliable sous une vidéo. */
export function VideoTranscript({ video }: { video: Video }) {
  return (
    <details className="video__transcript">
      <summary>Lire la transcription</summary>
      {groupByStep(video.cues).map((group, i) =>
        group.step ? (
          <div key={i}>
            <h3>{group.step}</h3>
            {group.lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        ) : (
          group.lines.map((line) => <p key={line}>{line}</p>)
        ),
      )}
    </details>
  );
}
