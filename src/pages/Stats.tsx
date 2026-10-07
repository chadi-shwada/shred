import source from 'virtual:breach-stats';
import { useEffect, useId, useState, type ChangeEvent } from 'react';
import { ExternalLink } from '../components/ExternalLink';
import { Icon } from '../components/Icon';
import { Notice } from '../components/Notice';
import { PageHead } from '../components/PageHead';
import { dataClassLabel, formatCount, HIBP_LICENSE_URL, HIBP_URL, RISKY_DATA_CLASSES } from '../lib/breaches';
import {
  computeStats,
  dataClassOptions,
  filterBreaches,
  formatBigCount,
  formatDelay,
  formatShare,
  yearSpan,
  type DataTypeStat,
  type StatBreach,
  type StatsFilter,
} from '../lib/breachStats';
import { formatMonthFr } from '../lib/breachPages';
import { formatLongFr } from '../lib/dates';
import { href } from '../router';

const ALL = source.breaches;
const YEARS = yearSpan(ALL);
const TYPES = dataClassOptions(ALL);

/* ---------- Filtres dans le fragment de l'adresse (#annee=2024&donnee=Passwords) ---------- */

function readFilter(hash: string): StatsFilter {
  const q = new URLSearchParams(hash.replace(/^#/, ''));
  const year = Number(q.get('annee'));
  const dataClass = q.get('donnee') ?? '';
  return {
    ...(YEARS.includes(year) && { year }),
    ...(TYPES.some((t) => t.key === dataClass) && { dataClass }),
  };
}

function writeFilter(filter: StatsFilter): void {
  const q = new URLSearchParams();
  if (filter.year !== undefined) q.set('annee', String(filter.year));
  if (filter.dataClass) q.set('donnee', filter.dataClass);
  const hash = q.toString();
  // Un fragment qui n'est pas un filtre (lien d'évitement #contenu) reste tel quel.
  if (!hash && !window.location.hash.includes('=')) return;
  // replaceState : pas d'entrée d'historique par clic ; le fragment n'est jamais envoyé au serveur.
  const url = window.location.pathname + (hash ? `#${hash}` : '');
  if (url !== window.location.pathname + window.location.hash)
    window.history.replaceState(window.history.state, '', url);
}

/* ---------- Marques ---------- */

/** Pourcentage arrondi pour les attributs SVG (la CSP interdit les styles en ligne). */
const pct = (value: number, max: number) => `${max > 0 ? Math.round((value / max) * 1000) / 10 : 0}%`;

/** Barre horizontale décorative : bout arrondi côté valeur, carré contre l'axe. */
function HBar({ value, max }: { value: number; max: number }) {
  return (
    <svg className="barlist__bar" aria-hidden="true" focusable="false">
      <rect width={pct(value, max)} height="100%" rx="4" />
      <rect width={pct(value, 2 * max)} height="100%" />
    </svg>
  );
}

const plural = (n: number, word: string) => `${formatCount(n)} ${word}${n > 1 ? 's' : ''}`;

type SortKey = 'date' | 'pwnCount' | 'title';

const SORTERS: Record<SortKey, (a: StatBreach, b: StatBreach) => number> = {
  date: (a, b) => a.date.localeCompare(b.date),
  pwnCount: (a, b) => a.pwnCount - b.pwnCount,
  title: (a, b) => a.title.localeCompare(b.title, 'fr'),
};

export function Stats() {
  const uid = useId();
  const [filter, setFilter] = useState<StatsFilter>(() =>
    typeof window === 'undefined' ? {} : readFilter(window.location.hash),
  );
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: 'date', desc: true });

  useEffect(() => writeFilter(filter), [filter]);
  // Adresse filtrée ouverte alors que la page l'est déjà (lien collé, retour arrière).
  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash;
      if (!hash || hash.includes('=')) setFilter(readFilter(hash));
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const empty = ALL.length === 0;
  const scoped = filterBreaches(ALL, filter);
  const stats = computeStats(scoped);
  // Chaque graphique sert aussi de filtre : il tient compte de l'autre filtre, pas du sien.
  const yearChart = computeStats(filterBreaches(ALL, { dataClass: filter.dataClass }), { years: YEARS }).byYear;
  const typeBase = filterBreaches(ALL, { year: filter.year });
  const typeStats = computeStats(typeBase);
  let typeChart: DataTypeStat[] = typeStats.dataTypes;
  if (filter.dataClass && !typeChart.some((d) => d.key === filter.dataClass)) {
    // Le type choisi reste visible même s'il n'est pas dans les dix premiers.
    const selected = computeStats(typeBase, { dataTypes: Number.POSITIVE_INFINITY }).dataTypes.find(
      (d) => d.key === filter.dataClass,
    );
    typeChart = [
      ...typeChart,
      selected ?? {
        key: filter.dataClass,
        label: dataClassLabel(filter.dataClass),
        count: 0,
        share: 0,
        risky: RISKY_DATA_CLASSES.has(filter.dataClass),
      },
    ];
  }
  const maxYear = Math.max(1, ...yearChart.map((y) => y.count));
  const maxShare = typeChart[0]?.share ?? 0;
  const maxAccounts = stats.biggest[0]?.pwnCount ?? 0;
  const rows = [...scoped].sort((a, b) => (sort.desc ? -1 : 1) * SORTERS[sort.key](a, b));

  const active = filter.year !== undefined || filter.dataClass !== undefined;
  const scopeText = [
    plural(stats.count, 'fuite'),
    filter.year !== undefined && `en ${filter.year}`,
    filter.dataClass && `avec ${dataClassLabel(filter.dataClass)}`,
  ]
    .filter(Boolean)
    .join(' ');

  const toggleYear = (year: number) => setFilter((f) => ({ ...f, year: f.year === year ? undefined : year }));
  const toggleType = (key: string) => setFilter((f) => ({ ...f, dataClass: f.dataClass === key ? undefined : key }));
  const onYear = (e: ChangeEvent<HTMLSelectElement>) =>
    setFilter((f) => ({ ...f, year: e.target.value ? Number(e.target.value) : undefined }));
  const onType = (e: ChangeEvent<HTMLSelectElement>) =>
    setFilter((f) => ({ ...f, dataClass: e.target.value || undefined }));
  const sortBy = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, desc: !s.desc } : { key, desc: key !== 'title' }));
  const ariaSort = (key: SortKey) => (sort.key === key ? (sort.desc ? 'descending' : 'ascending') : undefined);

  return (
    <>
      <PageHead
        eyebrow="Chiffres"
        command={{ input: 'shredrgpd chiffres --france', output: `${ALL.length} fuites analysées` }}
        title="Les fuites de données en France, en chiffres"
      >
        Ce que dit le catalogue public Have I Been Pwned des fuites qui ont touché des entreprises françaises. Filtre
        par année ou par type de données : tous les chiffres suivent. Mis à jour chaque jour.
      </PageHead>

      <div className="container page-body stats-page">
        {empty ? (
          <Notice tone="warn">
            <p>
              Chiffres indisponibles : le catalogue des fuites n'a pas pu être téléchargé lors de la dernière mise à
              jour du site. Reviens un peu plus tard.
            </p>
          </Notice>
        ) : (
          <>
            <div className="stats-filters" role="group" aria-label="Filtres">
              <div className="field">
                <label htmlFor={`${uid}-annee`}>Année</label>
                <select id={`${uid}-annee`} className="select" value={filter.year ?? ''} onChange={onYear}>
                  <option value="">Toutes</option>
                  {[...YEARS].reverse().map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor={`${uid}-donnee`}>Donnée exposée</label>
                <select id={`${uid}-donnee`} className="select" value={filter.dataClass ?? ''} onChange={onType}>
                  <option value="">Toutes</option>
                  {TYPES.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label} ({t.count})
                    </option>
                  ))}
                </select>
              </div>
              <p className="stats-filters__scope" aria-live="polite">
                {scopeText}
              </p>
              {active && (
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setFilter({})}>
                  <Icon name="close" size={16} />
                  Tout afficher
                </button>
              )}
            </div>

            {stats.count === 0 ? (
              <div className="stats-empty">
                <Notice>
                  <p>Aucune fuite ne correspond à ces filtres. Change d'année ou de type de données.</p>
                </Notice>
              </div>
            ) : (
              <dl className="figures">
                <div>
                  <dt>
                    {stats.count > 1 ? "fuites d'entreprises françaises" : "fuite d'entreprise française"}
                    {filter.year === undefined && YEARS.length > 0 ? ` depuis ${YEARS[0]}` : ''}
                  </dt>
                  <dd>{formatCount(stats.count)}</dd>
                </div>
                <div>
                  <dt>de plus d'un million de comptes</dt>
                  <dd>{formatCount(stats.overMillion)}</dd>
                </div>
                <div>
                  <dt>contiennent des données bancaires</dt>
                  <dd>{formatShare(stats.bank.share)}</dd>
                </div>
                {stats.medianDelayDays !== null && (
                  <div>
                    <dt>entre une fuite et son arrivée dans le catalogue (médiane)</dt>
                    <dd>{formatDelay(stats.medianDelayDays)}</dd>
                  </div>
                )}
              </dl>
            )}

            <section className="stats-block" aria-labelledby="par-annee">
              <h2 id="par-annee">Fuites par année</h2>
              <p className="stats-block__lead">
                Selon l'année où la fuite a eu lieu, pas celle de sa découverte : les dernières années sont incomplètes.
                Clique sur une année pour filtrer la page ; au survol, la liste de ses fuites.
              </p>
              <ol className="colchart" data-filtered={filter.year !== undefined || undefined}>
                {yearChart.map((y) => {
                  const tip = `${uid}-tip-${y.year}`;
                  const shown = y.titles.slice(0, 6);
                  return (
                    <li key={y.year} className={y.year % 2 ? 'colchart__odd' : undefined}>
                      <button
                        type="button"
                        className="colchart__hit"
                        aria-pressed={filter.year === y.year}
                        aria-describedby={y.count ? tip : undefined}
                        disabled={y.count === 0}
                        onClick={() => toggleYear(y.year)}
                      >
                        <span className="colchart__value">
                          {y.count}
                          <span className="visually-hidden"> fuite{y.count > 1 ? 's' : ''} en</span>
                        </span>
                        <svg className="colchart__bar" aria-hidden="true" focusable="false">
                          {y.count > 0 && (
                            <>
                              <rect
                                y={pct(maxYear - y.count, maxYear)}
                                width="100%"
                                height={pct(y.count, maxYear)}
                                rx="4"
                              />
                              <rect
                                y={pct(2 * maxYear - y.count, 2 * maxYear)}
                                width="100%"
                                height={pct(y.count, 2 * maxYear)}
                              />
                            </>
                          )}
                        </svg>
                        <span className="colchart__year">{y.year}</span>
                      </button>
                      {y.count > 0 && (
                        <span role="tooltip" id={tip} className="colchart__tip">
                          <strong>{plural(y.count, 'fuite')}</strong> en {y.year}
                          <span className="colchart__tip-list">
                            {shown.join(', ')}
                            {y.titles.length > shown.length && ` et ${y.titles.length - shown.length} autres`}
                          </span>
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>

            <section className="stats-block" aria-labelledby="donnees">
              <h2 id="donnees">Les données les plus exposées</h2>
              <p className="stats-block__lead">
                Part des fuites{filter.year !== undefined ? ` de ${filter.year}` : ''} qui contiennent chaque type de
                données. Clique sur un type pour filtrer la page.
              </p>
              <ul className="barlist barlist--select" data-filtered={filter.dataClass !== undefined || undefined}>
                {typeChart.map((d) => (
                  <li key={d.key}>
                    <button type="button" aria-pressed={filter.dataClass === d.key} onClick={() => toggleType(d.key)}>
                      <span className="barlist__label">
                        {d.label}
                        {d.risky && <span className="barlist__tag">sensible</span>}
                      </span>
                      <HBar value={d.share} max={maxShare} />
                      <span className="barlist__value">
                        {formatShare(d.share)}
                        <span className="visually-hidden">
                          {' '}
                          des fuites ({d.count} sur {typeStats.count})
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="small">
                {formatShare(typeStats.passwords.share)} de ces fuites contiennent des mots de passe. Tu en as réutilisé
                un ? <a href={href('/verifier') + '#parcours=mot-de-passe'}>Teste-le sans le confier à personne</a>.
              </p>
            </section>

            {stats.biggest.length > 0 && (
              <section className="stats-block" aria-labelledby="plus-grosses">
                <h2 id="plus-grosses">Les plus grosses fuites</h2>
                <p className="stats-block__lead">
                  Nombre de comptes exposés{active ? `, pour ${scopeText}` : ''}. Chaque fuite a sa page : ce qui a
                  fuité et quoi faire.
                </p>
                <ol className="barlist">
                  {stats.biggest.map((b) => (
                    <li key={b.path}>
                      <span className="barlist__label">
                        <a href={b.path}>{b.title}</a>
                        <span className="barlist__meta">{formatMonthFr(b.date)}</span>
                      </span>
                      <HBar value={b.pwnCount} max={maxAccounts} />
                      <span className="barlist__value">
                        {formatBigCount(b.pwnCount)}
                        <span className="visually-hidden"> comptes</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {rows.length > 0 && (
              <section className="stats-block" aria-labelledby="toutes">
                <h2 id="toutes">Toutes les fuites</h2>
                <p className="stats-block__lead">Clique sur un titre de colonne pour trier.</p>
                <div className="table-scroll" role="region" aria-label="Tableau des fuites, défilable" tabIndex={0}>
                  <table className="stats-table">
                    <caption className="visually-hidden">{scopeText}</caption>
                    <thead>
                      <tr>
                        <th scope="col" aria-sort={ariaSort('title')}>
                          <button type="button" onClick={() => sortBy('title')}>
                            Fuite
                          </button>
                        </th>
                        <th scope="col" aria-sort={ariaSort('date')}>
                          <button type="button" onClick={() => sortBy('date')}>
                            Date
                          </button>
                        </th>
                        <th scope="col" className="num" aria-sort={ariaSort('pwnCount')}>
                          <button type="button" onClick={() => sortBy('pwnCount')}>
                            Comptes
                          </button>
                        </th>
                        <th scope="col">Données exposées</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((b) => (
                        <tr key={b.path}>
                          <th scope="row">
                            <a href={b.path}>{b.title}</a>
                          </th>
                          <td>{formatMonthFr(b.date)}</td>
                          <td className="num">{b.pwnCount > 0 ? formatCount(b.pwnCount) : '—'}</td>
                          <td className="stats-table__types">{b.dataClasses.map(dataClassLabel).join(', ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}

        <section className="stats-block prose" aria-labelledby="lire">
          <h2 id="lire">Comment lire ces chiffres</h2>
          <ul>
            <li>
              <strong>« Française » est une estimation.</strong> Le catalogue n'indique pas de pays. ShredRGPD retient
              une fuite si le domaine de l'entreprise est en .fr, si l'entreprise est connue comme française ou si la
              description cite la France. Certaines fuites manquent sûrement, d'autres sont peut-être en trop.
            </li>
            <li>
              <strong>Seules les fuites connues de Have I Been Pwned.</strong> Le catalogue ne recense que les fuites
              dont les données ont circulé et y ont été chargées. Ce n'est pas le total des fuites qui ont touché la
              France.
            </li>
            <li>
              <strong>Des comptes, pas des personnes.</strong> Une même personne peut figurer dans plusieurs fuites, et
              un compte n'est pas toujours une personne. Additionner les comptes ne donne pas le nombre de Français
              touchés.
            </li>
            <li>
              Périmètre : les fuites qui ont une entreprise identifiée, hors listes de spam, logiciels malveillants et
              fuites signalées comme fabriquées.
            </li>
          </ul>
          <p className="small">
            Source : <ExternalLink href={HIBP_URL}>Have I Been Pwned</ExternalLink>, sous licence{' '}
            <ExternalLink href={HIBP_LICENSE_URL}>CC BY 4.0</ExternalLink>
            {source.fetchedOn && <>, catalogue du {formatLongFr(source.fetchedOn)}</>}. Ce sont des informations
            publiques sur les fuites, jamais les données fuitées. Les filtres restent dans ton navigateur.
          </p>
          <p>
            <a className="btn btn--primary" href={href('/verifier')}>
              <Icon name="search" size={18} />
              Vérifier mes fuites
            </a>
          </p>
        </section>
      </div>
    </>
  );
}
