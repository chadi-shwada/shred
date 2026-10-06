import { ExternalLink } from '../components/ExternalLink';
import { Icon } from '../components/Icon';
import { Notice } from '../components/Notice';
import { PageHead } from '../components/PageHead';
import { VideoPlayer } from '../components/VideoPlayer';
import { DEMO } from '../data/videos';
import { href } from '../router';

const TIMELINE = [
  {
    title: 'Garde des preuves',
    text: "Fais des captures d'écran datées des pages qui t'exposent et note leurs adresses exactes. Elles serviront si tu dois saisir la CNIL.",
  },
  {
    title: 'Trouve le bon contact',
    text: "Cherche un e-mail de DPO ou un formulaire « données personnelles » dans les mentions légales ou la politique de confidentialité. Sans contact, écris à l'adresse de contact générale. Le générateur t'aide à trouver le registrar et l'hébergeur.",
  },
  {
    title: "Envoie ta demande d'effacement",
    text: "Le site doit répondre dans un délai d'un mois à compter de la réception (article 12.3 du RGPD). Il peut le prolonger de deux mois s'il te prévient dans le premier mois.",
  },
  {
    title: 'Relance après un mois',
    text: "Sans réponse, envoie une relance. S'il refuse, il doit te dire pourquoi (article 12.4).",
  },
  {
    title: "Signale le contenu à l'hébergeur",
    text: 'Site anonyme ou muet ? Écris à son hébergeur : il doit traiter les signalements de contenus illicites (article 16 du règlement européen sur les services numériques). Le registrar et Cloudflare peuvent aussi transmettre.',
  },
  {
    title: 'Saisis la CNIL',
    text: 'Sans réponse satisfaisante, tu peux introduire une réclamation auprès de la CNIL (article 77). Joins ta demande, ta relance et tes preuves.',
  },
];

const LINKS = [
  {
    href: 'https://www.cnil.fr/fr/comprendre-mes-droits/le-droit-leffacement-supprimer-vos-donnees-en-ligne',
    title: "Le droit à l'effacement",
    text: 'Explications de la CNIL',
    host: 'cnil.fr',
  },
  {
    href: 'https://www.cnil.fr/fr/modele/courrier/supprimer-des-donnees-personnelles',
    title: 'Modèle de courrier de la CNIL',
    text: 'Supprimer des données personnelles',
    host: 'cnil.fr',
  },
  {
    href: 'https://www.cnil.fr/fr/adresser-une-plainte',
    title: 'Adresser une plainte à la CNIL',
    text: 'Après une demande restée sans réponse',
    host: 'cnil.fr',
  },
  {
    href: 'https://eur-lex.europa.eu/eli/reg/2016/679/oj?locale=fr',
    title: 'Texte du RGPD',
    text: 'Règlement (UE) 2016/679, version officielle',
    host: 'eur-lex.europa.eu',
  },
  {
    href: 'https://www.cybermalveillance.gouv.fr',
    title: 'Cybermalveillance.gouv.fr',
    text: "Assistance aux victimes d'actes de cybermalveillance",
    host: 'cybermalveillance.gouv.fr',
  },
  {
    href: 'https://www.internet-signalement.gouv.fr',
    title: 'Pharos',
    text: 'Signaler un contenu illicite en ligne',
    host: 'internet-signalement.gouv.fr',
  },
  {
    href: 'https://haveibeenpwned.com',
    title: 'Have I Been Pwned',
    text: 'Vérifier si ton e-mail figure dans une fuite connue (service tiers)',
    host: 'haveibeenpwned.com',
  },
];

export function Resources() {
  return (
    <>
      <PageHead
        eyebrow="Ressources"
        command={{ input: 'shred droits --aide', output: 'RGPD · CNIL · DSA' }}
        title="Tes droits, étape par étape"
      >
        Le RGPD te permet d'obtenir l'effacement de données publiées sans base légale. Voici comment t'y prendre, et
        vers qui te tourner.
      </PageHead>

      <div className="container page-body">
        <div className="content-grid">
          <div className="prose">
            <h2>La marche à suivre</h2>
            <ol className="timeline">
              {TIMELINE.map((step, i) => (
                <li key={step.title}>
                  <span className="timeline__dot" aria-hidden="true">
                    0{i + 1}
                  </span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </li>
              ))}
            </ol>
            <p>
              <a className="btn btn--primary" href={href('/lettre')}>
                Écrire ma lettre
              </a>
            </p>

            <h2>La démo, de A à Z</h2>
            <p>Le parcours complet sur une vraie fuite (Deezer, 2019), avec une personne fictive.</p>
            <VideoPlayer video={DEMO} />

            <h2>Comment envoyer ta demande</h2>
            <p>
              Le RGPD n'impose pas de forme : un e-mail ou le formulaire du site suffisent. Ce qui compte, c'est de
              pouvoir prouver la date de réception, car le délai d'un mois part de là.
            </p>
            <ul>
              <li>
                <strong>E-mail ou formulaire</strong> : garde une copie de ton message, la date d'envoi et tout accusé
                de réception (capture d'écran de la confirmation, numéro de ticket).
              </li>
              <li>
                <strong>Lettre recommandée avec accusé de réception</strong> : la preuve la plus solide, utile si le
                site ne répond pas aux e-mails ou si tu prévois de saisir la CNIL. La Poste propose aussi un envoi
                recommandé en ligne.
              </li>
              <li>
                Note la date de réception dans le <a href={href('/suivi')}>suivi</a> : Shred calcule l'échéance et peut
                l'ajouter à ton agenda.
              </li>
            </ul>

            <h2>Protège-toi en parallèle</h2>
            <ul>
              <li>Change le mot de passe exposé partout où tu l'utilises, et n'en réutilise plus.</li>
              <li>Active la double authentification sur tes comptes importants, en priorité ta messagerie.</li>
              <li>
                Méfie-toi des e-mails, SMS et appels qui citent tes données : la fuite sert souvent à l'hameçonnage.
              </li>
              <li>Si des coordonnées bancaires sont exposées, préviens ta banque.</li>
            </ul>

            <h2>Questions fréquentes</h2>
            <h3>Dois-je joindre une pièce d'identité ?</h3>
            <p>
              Pas d'office. Le site ne peut te demander des informations supplémentaires qu'en cas de doute raisonnable
              sur ton identité (article 12.6 du RGPD). Si c'est le cas, masque ce qui n'est pas utile.
            </p>
            <h3>Et si le site est hors de l'Union européenne ?</h3>
            <p>
              Le RGPD s'applique aussi aux sites qui ciblent des personnes dans l'Union (article 3.2), mais le faire
              respecter est plus difficile. Écris quand même, garde tes preuves et signale le contenu à son hébergeur.
            </p>
            <h3>Est-ce que Shred vérifie si mes données ont fuité ?</h3>
            <p>
              Shred t'y aide sans voir tes données : tu cherches ton e-mail sur Have I Been Pwned, puis tu coches les
              fuites trouvées sur la page <a href={href('/verifier')}>Vérifier</a>. Shred affiche les données exposées
              et prépare la lettre. Il n'héberge aucune base de fuites.
            </p>

            <Notice>
              <p>
                Ces informations sont générales et ne remplacent pas un conseil juridique. En cas de doute,
                rapproche-toi d'une association ou d'un professionnel du droit.
              </p>
            </Notice>
          </div>

          <aside aria-labelledby="liens">
            <div className="card">
              <h2 className="card__title" id="liens">
                Liens utiles
              </h2>
              <ul className="link-list">
                {LINKS.map((link) => (
                  <li key={link.href}>
                    <ExternalLink href={link.href}>
                      <strong>{link.title}</strong>
                      <span>{link.text}</span>
                      <span className="host">{link.host}</span>
                      <Icon name="external" size={16} />
                    </ExternalLink>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
