import { Icon, type IconName } from '../components/Icon';
import { ShredSheet } from '../components/ShredSheet';
import { href } from '../router';

const STEPS = [
  {
    title: 'Repère tes données',
    text: 'Note les adresses des pages où apparaissent ton e-mail, ton mot de passe ou ton téléphone.',
  },
  {
    title: 'Génère ta lettre',
    text: "Effacement (article 17), accès (article 15) ou relance : la lettre cite les bons articles du RGPD.",
  },
  {
    title: 'Envoie-la toi-même',
    text: 'Copie le texte, ouvre-le dans ta messagerie ou télécharge-le. Shred ne contacte personne à ta place.',
  },
  {
    title: 'Suis le délai',
    text: "Le site a un mois pour répondre. Shred te prévient quand l'échéance approche et prépare la relance.",
  },
];

const FEATURES: { icon: IconName; title: string; text: string }[] = [
  {
    icon: 'eyeOff',
    title: 'Rien ne sort de ton navigateur',
    text: "Pas de compte, pas de serveur, pas d'analytics. Une politique de sécurité bloque toute requête réseau depuis la page.",
  },
  {
    icon: 'file',
    title: 'Des lettres sourcées',
    text: "Chaque lettre cite les articles du RGPD qu'elle invoque, sur la structure du modèle de la CNIL.",
  },
  {
    icon: 'clock',
    title: 'Le délai légal, calculé',
    text: "Un mois à compter de la réception (article 12.3), trois si le site prolonge. Les dates sont calculées pour toi.",
  },
  {
    icon: 'code',
    title: 'Libre et gratuit',
    text: "Le code est public. Tu peux le lire, le vérifier et l'héberger toi-même.",
  },
];

export function Home() {
  return (
    <>
      <section className="hero">
        <div className="container hero__grid">
          <div>
            <span className="eyebrow">Tes droits RGPD, sans intermédiaire</span>
            <h1>
              Demande l'effacement de <em>tes données</em>
            </h1>
            <p className="lead">
              Un site expose tes informations issues d'une fuite ? Shred t'aide à écrire une demande d'effacement
              solide, à l'envoyer et à suivre la réponse. Gratuitement, et sans jamais voir tes données.
            </p>
            <div className="btn-row">
              <a className="btn btn--primary btn--lg" href={href('/lettre')}>
                Écrire ma lettre
                <Icon name="arrow" size={18} />
              </a>
              <a className="btn btn--lg" href={href('/ressources')}>
                Comprendre mes droits
              </a>
            </div>
            <ul className="hero__trust">
              <li>
                <Icon name="check" size={16} />
                Sans inscription
              </li>
              <li>
                <Icon name="check" size={16} />
                Aucun traceur
              </li>
              <li>
                <Icon name="check" size={16} />
                Code ouvert
              </li>
            </ul>
          </div>
          <div className="hero__art">
            <ShredSheet />
          </div>
        </div>
      </section>

      <section className="section section--alt" aria-labelledby="comment">
        <div className="container">
          <div className="section__head">
            <span className="eyebrow">Comment ça marche</span>
            <h2 id="comment">Quatre étapes, une dizaine de minutes</h2>
          </div>
          <ol className="steps">
            {STEPS.map((step) => (
              <li key={step.title}>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section" aria-labelledby="principes">
        <div className="container">
          <div className="section__head">
            <span className="eyebrow">Principes</span>
            <h2 id="principes">Un outil qui t'aide à te défendre, et qui n'héberge rien</h2>
            <p className="muted">
              Shred ne contient aucune base de fuites, même partielle. Il ne cherche pas tes données : il t'aide à
              exercer tes droits.
            </p>
          </div>
          <div className="features">
            {FEATURES.map((feature) => (
              <div className="feature" key={feature.title}>
                <h3>
                  <Icon name={feature.icon} size={22} />
                  {feature.title}
                </h3>
                <p>{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="commencer">
        <div className="container">
          <div className="cta-band">
            <div>
              <h2 id="commencer">Prêt à reprendre la main ?</h2>
              <p>Ta lettre est prête en quelques minutes. Rien n'est enregistré sans ton accord.</p>
            </div>
            <a className="btn btn--primary btn--lg" href={href('/lettre')}>
              Commencer
              <Icon name="arrow" size={18} />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
