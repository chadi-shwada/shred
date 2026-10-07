import stats from 'virtual:breach-stats';
import { ExternalLink } from '../components/ExternalLink';
import { Icon } from '../components/Icon';
import { Notice } from '../components/Notice';
import { PageHead } from '../components/PageHead';
import { formatCount, HIBP_LICENSE_URL, HIBP_URL } from '../lib/breaches';
import { formatBigCount, formatDelay, formatShare } from '../lib/breachStats';
import { formatMonthFr } from '../lib/breachPages';
import { formatLongFr } from '../lib/dates';
import { href } from '../router';

/** Pourcentage arrondi pour les attributs SVG (la CSP interdit les styles en ligne). */
const pct = (value: number, max: number) => `${max > 0 ? Math.round((value / max) * 1000) / 10 : 0}%`;

/**
 * Barre horizontale décorative : bout arrondi côté valeur, carré contre l'axe.
 * Le texte (libellé, valeur) est à côté, en HTML.
 */
function HBar({ value, max }: { value: number; max: number }) {
  const w = pct(value, max);
  return (
    <svg className="barlist__bar" aria-hidden="true" focusable="false">
      <rect width={w} height="100%" rx="4" />
      <rect width={pct(value, 2 * max)} height="100%" />
    </svg>
  );
}

function YearChart() {
  const max = Math.max(...stats.byYear.map((y) => y.count));
  return (
    <ol className="colchart">
      {stats.byYear.map((y) => {
        const h = pct(y.count, max);
        const half = pct(y.count, 2 * max);
        return (
          <li key={y.year} className={y.year % 2 ? 'colchart__odd' : undefined}>
            <span className="colchart__value">
              {y.count}
              <span className="visually-hidden"> fuite{y.count > 1 ? 's' : ''} en</span>
            </span>
            <svg className="colchart__bar" aria-hidden="true" focusable="false">
              {y.count > 0 && (
                <>
                  <rect x="0" y={`${100 - parseFloat(h)}%`} width="100%" height={h} rx="4" />
                  <rect x="0" y={`${100 - parseFloat(half)}%`} width="100%" height={half} />
                </>
              )}
            </svg>
            <span className="colchart__year">{y.year}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function Stats() {
  const empty = stats.count === 0;
  const firstYear = stats.byYear[0]?.year;
  const maxShare = stats.dataTypes[0]?.share ?? 0;
  const maxAccounts = stats.biggest[0]?.pwnCount ?? 0;

  return (
    <>
      <PageHead
        eyebrow="Chiffres"
        command={{ input: 'shredrgpd chiffres --france', output: `${stats.count} fuites analysées` }}
        title="Les fuites de données en France, en chiffres"
      >
        Ce que dit le catalogue public Have I Been Pwned des fuites qui ont touché des entreprises françaises. Les
        chiffres se mettent à jour chaque jour.
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
            <dl className="figures">
              <div>
                <dt>fuites d'entreprises françaises{firstYear ? ` depuis ${firstYear}` : ''}</dt>
                <dd>{formatCount(stats.count)}</dd>
              </div>
              <div>
                <dt>fuites de plus d'un million de comptes</dt>
                <dd>{formatCount(stats.overMillion)}</dd>
              </div>
              <div>
                <dt>des fuites contiennent des données bancaires</dt>
                <dd>{formatShare(stats.bank.share)}</dd>
              </div>
              {stats.medianDelayDays !== null && (
                <div>
                  <dt>entre une fuite et son arrivée dans le catalogue (médiane)</dt>
                  <dd>{formatDelay(stats.medianDelayDays)}</dd>
                </div>
              )}
            </dl>

            <section className="stats-block" aria-labelledby="par-annee">
              <h2 id="par-annee">Fuites par année</h2>
              <p className="stats-block__lead">
                Nombre de fuites selon l'année où elles ont eu lieu, pas celle où elles ont été découvertes. Les
                dernières années sont incomplètes : une fuite met souvent des mois à apparaître dans le catalogue.
              </p>
              <YearChart />
            </section>

            <section className="stats-block" aria-labelledby="donnees">
              <h2 id="donnees">Les données les plus exposées</h2>
              <p className="stats-block__lead">
                Part des fuites qui contiennent chaque type de données. Les données les plus sensibles sont signalées.
              </p>
              <ol className="barlist">
                {stats.dataTypes.map((d) => (
                  <li key={d.label}>
                    <span className="barlist__label">
                      {d.label}
                      {d.risky && <span className="barlist__tag">sensible</span>}
                    </span>
                    <HBar value={d.share} max={maxShare} />
                    <span className="barlist__value">
                      {formatShare(d.share)}
                      <span className="visually-hidden">
                        {' '}
                        des fuites ({d.count} sur {stats.count})
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
              <p className="small">
                {formatShare(stats.passwords.share)} des fuites contiennent des mots de passe. Tu en as réutilisé un ?{' '}
                <a href={href('/verifier') + '#parcours=mot-de-passe'}>Teste-le sans le confier à personne</a>.
              </p>
            </section>

            <section className="stats-block" aria-labelledby="plus-grosses">
              <h2 id="plus-grosses">Les plus grosses fuites</h2>
              <p className="stats-block__lead">
                Nombre de comptes exposés. Chaque fuite a sa page : ce qui a fuité et quoi faire.
              </p>
              <ol className="barlist barlist--links">
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
            {stats.fetchedOn && <>, catalogue du {formatLongFr(stats.fetchedOn)}</>}. Ce sont des informations publiques
            sur les fuites, jamais les données fuitées.
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
