import { BinaryField } from '../components/BinaryField';
import { SOURCE_CODE_URL } from '../config';
import { DataStream } from '../components/DataStream';
import { Icon, type IconName } from '../components/Icon';
import { ScrambleText } from '../components/ScrambleText';
import { ShredSheet } from '../components/ShredSheet';
import { formatLongFr, gdprDeadlines } from '../lib/dates';
import { generateLetter } from '../lib/letters';
import { href } from '../router';

const STEPS: { icon: IconName; title: string; text: string }[] = [
  {
    icon: 'search',
    title: 'Vérifie ce qui a fuité',
    text: 'Repère les fuites qui contiennent ton e-mail et teste tes mots de passe, sans les confier à Shred.',
  },
  {
    icon: 'file',
    title: 'Génère ta lettre',
    text: 'Effacement, accès ou relance : la lettre cite les bons articles du RGPD.',
  },
  {
    icon: 'send',
    title: 'Envoie-la toi-même',
    text: 'Copie le texte ou ouvre-le dans ta messagerie. Shred ne contacte personne à ta place.',
  },
  {
    icon: 'bell',
    title: 'Suis le délai',
    text: "Le site a un mois pour répondre. Shred calcule l'échéance et prépare la relance.",
  },
];

/** Exemples fictifs pour l'aperçu de la page Vérifier (aucune vraie fuite). */
const MOCK_BREACHES = [
  {
    title: 'Exemple Réseau',
    domain: 'exemple-reseau.test',
    date: 'nov. 2025',
    classes: ['adresses e-mail', 'mots de passe', 'téléphones'],
    selected: true,
  },
  {
    title: 'Exemple Boutique',
    domain: 'exemple-boutique.test',
    date: 'juin 2024',
    classes: ['adresses e-mail', 'cartes bancaires', 'adresses postales'],
    selected: true,
  },
  {
    title: 'Exemple Forum',
    domain: 'exemple-forum.test',
    date: 'févr. 2023',
    classes: ['identifiants', 'adresses IP'],
    selected: false,
  },
];

const FAQ = [
  {
    q: 'Est-ce que Shred voit mes données ?',
    a: "Non. Tout se passe dans ton navigateur : il n'y a pas de serveur applicatif, pas de compte, pas de traceur. La page bloque toute requête réseau, sauf vers Pwned Passwords quand tu lances un test de mot de passe : seuls 5 caractères de son empreinte partent, jamais le mot de passe.",
  },
  {
    q: 'Est-ce que Shred vérifie si mes données ont fuité ?',
    a: "Il t'y aide sans voir tes données. Tu cherches ton e-mail sur Have I Been Pwned, puis tu coches les fuites trouvées dans Shred, qui affiche les données exposées et prépare la lettre. Shred n'héberge aucune base de fuites : seulement la liste publique des fuites connues.",
  },
  {
    q: 'Une lettre suffit-elle à faire supprimer mes données ?',
    a: "Souvent, mais pas toujours. Le site doit répondre dans un délai d'un mois (article 12.3 du RGPD). Sans réponse, tu peux relancer puis saisir la CNIL. Les modèles sont indicatifs et ne remplacent pas un conseil juridique.",
  },
  {
    q: "Dois-je joindre une pièce d'identité ?",
    a: "Pas d'office. Le site ne peut te demander des informations supplémentaires qu'en cas de doute raisonnable sur ton identité (article 12.6 du RGPD).",
  },
];

const SAMPLE_DATE = '2026-10-05';
const SAMPLE = generateLetter({
  kind: 'effacement',
  fullName: 'Camille Martin',
  siteName: 'exemple-fuites.test',
  urls: ['https://exemple-fuites.test/dump/2026'],
  dataCategories: ['email', 'motDePasse'],
  date: SAMPLE_DATE,
});
const SAMPLE_EXCERPT = SAMPLE.body.split('\n\n').slice(0, 4).join('\n\n');

export function Home() {
  return (
    <div className="theme-dark">
      <section className="hero" aria-labelledby="titre">
        <BinaryField />
        <div className="hero__veil" />
        <div className="container hero__grid">
          <div>
            <span className="pill">
              <span className="pill__tag">Sans traceur</span>
              <span className="pill__text">Gratuit, sans compte, sans publicité</span>
            </span>
            <h1 id="titre">
              Demande l'effacement de <ScrambleText className="accent" text="tes données" />
            </h1>
            <p className="lead">
              Un site expose tes informations issues d'une fuite ? Shred rédige ta demande RGPD, calcule les délais et
              t'aide à relancer. Sans jamais voir tes données.
            </p>
            <div className="btn-row">
              <a className="btn btn--primary btn--lg btn--glow" href={href('/lettre')}>
                Écrire ma lettre
                <Icon name="arrow" size={18} />
              </a>
              <a className="btn btn--outline btn--lg" href={href('/verifier')}>
                <Icon name="search" size={18} />
                Vérifier mes fuites
              </a>
            </div>
            <ul className="hero__trust">
              <li>
                <Icon name="check" size={14} />0 serveur
              </li>
              <li>
                <Icon name="check" size={14} />0 traceur
              </li>
              <li>
                <Icon name="check" size={14} />
                {SOURCE_CODE_URL ? 'Code ouvert' : 'Gratuit'}
              </li>
            </ul>
          </div>
          <div className="hero__art">
            <ShredSheet />
          </div>
        </div>
      </section>

      <DataStream />

      <section className="section section--glow" aria-labelledby="verifier">
        <div className="container showcase showcase--reverse">
          <div>
            <span className="eyebrow">Vérifier</span>
            <h2 id="verifier">Sais exactement ce qui a fuité</h2>
            <p className="lead">
              Repère les fuites qui contiennent ton e-mail, vois quelles données sont exposées, puis écris à
              l'entreprise en un clic.
            </p>
            <ul className="checklist">
              <li>
                <Icon name="check" size={18} />
                Plus de mille fuites connues, avec les types de données exposées.
              </li>
              <li>
                <Icon name="check" size={18} />
                Ton e-mail ne passe jamais par Shred : tu le cherches sur Have I Been Pwned.
              </li>
              <li>
                <Icon name="check" size={18} />
                Test de mot de passe sans le confier à personne (k‑anonymat).
              </li>
            </ul>
            <a className="btn btn--primary btn--lg" href={href('/verifier')}>
              <Icon name="search" size={18} />
              Vérifier mes fuites
            </a>
          </div>
          <div className="mock" aria-hidden="true">
            <div className="mock__bar">
              <span className="terminal__dot" />
              <span className="terminal__dot" />
              <span className="terminal__dot" />
              <span className="mock__url">shred / vérifier</span>
            </div>
            <div className="mock__body">
              <div className="mock__search">
                <Icon name="search" size={16} />
                exemple
              </div>
              {MOCK_BREACHES.map((b) => (
                <div className="mock__row" data-selected={b.selected} key={b.title}>
                  <span className="mock__check">{b.selected && <Icon name="check" size={12} />}</span>
                  <div>
                    <strong>{b.title}</strong>
                    <span className="mock__meta">
                      {b.domain} · {b.date}
                    </span>
                    <span className="mock__chips">
                      {b.classes.map((c) => (
                        <span
                          key={c}
                          className={`chip${c === 'mots de passe' || c === 'cartes bancaires' ? ' chip--danger' : ''}`}
                        >
                          {c}
                        </span>
                      ))}
                    </span>
                  </div>
                </div>
              ))}
              <div className="mock__footer">
                <span>2 fuites · 5 types de données exposés</span>
                <span className="mock__cta">
                  Écrire la lettre <Icon name="arrow" size={14} />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="zero">
        <div className="container">
          <div className="section__head section__head--center">
            <span className="eyebrow">Confidentialité</span>
            <h2 id="zero">Tes données restent chez toi</h2>
            <p className="lead">Shred n'a rien à protéger, parce qu'il ne garde rien.</p>
          </div>
          <dl className="zeros">
            <div>
              <dt>donnée personnelle envoyée</dt>
              <dd>0</dd>
            </div>
            <div>
              <dt>cookie ou traceur</dt>
              <dd>0</dd>
            </div>
            <div>
              <dt>compte à créer</dt>
              <dd>0</dd>
            </div>
            <div>
              <dt>exécuté dans ton navigateur</dt>
              <dd>
                100<span>%</span>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="section section--subtle" aria-labelledby="comment">
        <div className="container">
          <div className="section__head">
            <span className="eyebrow">Méthode</span>
            <h2 id="comment">Quatre étapes, une dizaine de minutes</h2>
            <p className="lead">De la page qui t'expose à la réponse du site, Shred t'accompagne à chaque étape.</p>
          </div>
          <ol className="steps">
            {STEPS.map((step, i) => (
              <li className="step" key={step.title}>
                <span className="step__node" aria-hidden="true">
                  0{i + 1}
                </span>
                <div className="step__card">
                  <span className="step__icon">
                    <Icon name={step.icon} />
                  </span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section" aria-labelledby="principes">
        <div className="container">
          <div className="section__head">
            <span className="eyebrow">Principes</span>
            <h2 id="principes">Un outil pour te défendre, qui n'héberge rien</h2>
          </div>
          <div className="bento">
            <article className="tile tile--wide">
              <h3>Rien ne quitte ton navigateur</h3>
              <p>
                La page déclare une politique de sécurité qui bloque toute requête réseau, sauf le test de mot de passe
                par k-anonymat. Ce n'est pas une promesse : c'est ton navigateur qui l'applique.
              </p>
              <div className="tile__visual">
                <pre className="code-block" tabIndex={0} aria-label="Extrait de la politique de sécurité">
                  <span className="c">{'<!-- en-tête de chaque page publiée -->'}</span>
                  {'\n'}
                  <span className="k">Content-Security-Policy</span>
                  {': '}
                  {'\n  '}
                  <span className="k">connect-src</span> <span className="v">https://api.pwnedpasswords.com</span>
                  {';\n  '}
                  <span className="k">form-action</span> <span className="v">'none'</span>
                  {';\n  '}
                  <span className="k">default-src</span> <span className="v">'self'</span>;
                </pre>
              </div>
            </article>
            <article className="tile tile--narrow">
              <h3>Le délai légal, calculé</h3>
              <p>Un mois à compter de la réception, trois si le site prolonge (article 12.3).</p>
              <div className="tile__visual">
                <ul className="mini-timeline">
                  <li>
                    Envoyée <span>{formatLongFr(SAMPLE_DATE)}</span>
                  </li>
                  <li>
                    Échéance <span>{formatLongFr(gdprDeadlines(SAMPLE_DATE).standard)}</span>
                  </li>
                </ul>
              </div>
            </article>
            <article className="tile tile--half">
              <h3>Des lettres sourcées</h3>
              <p>Chaque lettre cite les articles du RGPD qu'elle invoque, sur la structure du modèle de la CNIL.</p>
              <div className="tile__visual">
                <ul className="article-cloud">
                  {['Art. 15', 'Art. 17.1', 'Art. 17.2', 'Art. 19', 'Art. 12.3', 'Art. 12.4', 'Art. 77'].map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>
            </article>
            <article className="tile tile--half">
              <h3>Aucune base de fuites</h3>
              <p>Shred ne stocke et ne recherche aucune donnée fuitée, même hachée. Il aide, il n'archive pas.</p>
              <div className="tile__visual" aria-hidden="true">
                <div className="bits-art">
                  {'01101110 01101111 '}
                  <b>00000000</b>
                  {' 01101100 01100101\n'}
                  {'01100001 01101011 01110011 '}
                  <b>00000000</b>
                  {' 01101000\n'}
                  {'01100101 01110010 01100101 01101111 '}
                  <b>00000000</b>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="section section--subtle" aria-labelledby="lettre">
        <div className="container showcase">
          <div>
            <span className="eyebrow">Générateur</span>
            <h2 id="lettre">Une lettre prête à envoyer, en quelques minutes</h2>
            <ul className="checklist">
              <li>
                <Icon name="check" size={18} />
                Effacement (article 17), accès (article 15) ou relance après un mois.
              </li>
              <li>
                <Icon name="check" size={18} />
                Copie, ouverture dans ta messagerie, téléchargement ou impression.
              </li>
              <li>
                <Icon name="check" size={18} />
                Ton nom et ton e-mail ne sont jamais enregistrés.
              </li>
            </ul>
            <a className="btn btn--primary btn--lg" href={href('/lettre')}>
              Ouvrir le générateur
              <Icon name="arrow" size={18} />
            </a>
          </div>
          <div className="preview-window" aria-label="Extrait d'une lettre d'effacement générée">
            <div className="preview-bar">
              <span className="small mono muted">lettre-effacement.txt</span>
              <ul className="chips">
                {SAMPLE.articles.slice(0, 4).map((a) => (
                  <li className="chip" key={a}>
                    Art. {a}
                  </li>
                ))}
              </ul>
            </div>
            <div className="paper">
              <p className="paper__subject">Objet : {SAMPLE.subject}</p>
              <pre className="paper__body">{SAMPLE_EXCERPT}</pre>
            </div>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="faq">
        <div className="container">
          <div className="section__head section__head--center">
            <span className="eyebrow">Questions</span>
            <h2 id="faq">Questions fréquentes</h2>
          </div>
          <div className="faq">
            {FAQ.map((item) => (
              <details key={item.q}>
                <summary>
                  {item.q}
                  <Icon name="plus" size={18} />
                </summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="commencer">
        <div className="container">
          <div className="cta-band">
            <BinaryField density={0.25} />
            <div className="cta-band__veil" />
            <span className="eyebrow">Passe à l'action</span>
            <h2 id="commencer">Reprends le contrôle de tes données</h2>
            <p>Ta lettre est prête en quelques minutes. Rien n'est enregistré sans ton accord.</p>
            <a className="btn btn--primary btn--lg btn--glow" href={href('/lettre')}>
              Écrire ma lettre
              <Icon name="arrow" size={18} />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
