import { ExternalLink } from '../components/ExternalLink';
import { Icon, type IconName } from '../components/Icon';
import { Notice } from '../components/Notice';
import { PageHead } from '../components/PageHead';
import { href } from '../router';

/*
 * Canaux officiels et démarches, vérifiés le 5 octobre 2026 :
 * - 33700 : plateforme des opérateurs pour les SMS et appels indésirables (33700.fr) ;
 * - Signal Spam (signal-spam.fr) : e-mails indésirables et hameçonnage ;
 * - Phishing Initiative (phishing-initiative.fr) : adresses de sites d'hameçonnage ;
 * - Pharos (internet-signalement.gouv.fr) : contenus et escroqueries en ligne ;
 * - démarchage téléphonique sans consentement préalable interdit depuis le
 *   11 août 2026 (loi du 30 juin 2025), fin de Bloctel ; signalement : SignalConso ;
 * - opposition interbancaire : 0 892 705 705, 7 j/7, 24 h/24, 0,34 €/min ;
 * - France Victimes : 116 006, 7 j/7 de 9 h à 19 h.
 */

interface Channel {
  icon: IconName;
  title: string;
  text: string;
  action: { label: string; href: string };
}

const MESSAGES: Channel[] = [
  {
    icon: 'mail',
    title: 'Un SMS suspect',
    text: 'Transfère-le gratuitement au 33700, puis réponds au SMS automatique avec le numéro de l’expéditeur. Supprime-le ensuite sans cliquer sur le lien.',
    action: { label: '33700.fr', href: 'https://www.33700.fr/' },
  },
  {
    icon: 'bell',
    title: 'Un appel ou un message vocal suspect',
    text: 'Envoie « spam vocal » suivi du numéro qui t’a appelé, par SMS au 33700. Ne rappelle jamais un numéro inconnu qui cite tes informations.',
    action: { label: '33700.fr', href: 'https://www.33700.fr/' },
  },
  {
    icon: 'send',
    title: 'Un e-mail d’hameçonnage',
    text: "Ne clique sur rien, ne réponds pas. Signale-le sur Signal Spam : l'e-mail est transmis aux autorités et aux messageries.",
    action: { label: 'signal-spam.fr', href: 'https://www.signal-spam.fr/' },
  },
  {
    icon: 'external',
    title: 'Un lien vers un faux site',
    text: "Copie l'adresse du site (sans l'ouvrir) et signale-la sur Phishing Initiative pour qu'il soit bloqué. Pour une escroquerie, signale-la aussi sur Pharos.",
    action: { label: 'phishing-initiative.fr', href: 'https://phishing-initiative.fr/' },
  },
  {
    icon: 'alert',
    title: 'Un démarchage téléphonique',
    text: "Depuis le 11 août 2026, un professionnel ne peut plus te démarcher par téléphone sans ton accord préalable (Bloctel n'existe plus). Signale l'entreprise à la répression des fraudes sur SignalConso.",
    action: { label: 'signal.conso.gouv.fr', href: 'https://signal.conso.gouv.fr/' },
  },
  {
    icon: 'shield',
    title: 'Une arnaque ou un contenu illicite en ligne',
    text: 'Signale-le aux policiers et gendarmes de la plateforme Pharos. Si tu as perdu de l’argent, dépose plainte.',
    action: { label: 'internet-signalement.gouv.fr', href: 'https://www.internet-signalement.gouv.fr/' },
  },
];

interface Guide {
  id: string;
  title: string;
  steps: string[];
  links: { label: string; href: string }[];
}

const GUIDES: Guide[] = [
  {
    id: 'mot-de-passe',
    title: 'Mon mot de passe a fuité',
    steps: [
      "Change-le sur le site concerné, puis partout où tu l'as réutilisé.",
      'Active la double authentification, en commençant par ta messagerie : elle permet de réinitialiser tous tes autres comptes.',
      'Vérifie les appareils et sessions connectés à tes comptes importants et déconnecte ceux que tu ne reconnais pas.',
      'Utilise un mot de passe différent par site, gardé dans un gestionnaire de mots de passe.',
    ],
    links: [{ label: 'Tester un mot de passe et en créer un', href: '/verifier#parcours=mot-de-passe' }],
  },
  {
    id: 'carte',
    title: 'Ma carte ou mes coordonnées bancaires ont fuité',
    steps: [
      'Préviens ta banque et surveille tes relevés dans les jours et les semaines qui suivent.',
      "En cas d'opération que tu n'as pas faite, fais opposition tout de suite : auprès de ta banque, ou au 0 892 705 705 (service interbancaire, 7 j/7, 24 h/24, 0,34 €/min). Note le numéro d'enregistrement de l'opposition.",
      'Ta banque ne te demandera jamais un code reçu par SMS ni tes identifiants par téléphone ou par e-mail.',
      'Conteste les opérations frauduleuses auprès de ta banque et dépose plainte si nécessaire.',
    ],
    links: [
      {
        label: 'Fraude à la carte bancaire (cybermalveillance.gouv.fr)',
        href: 'https://www.cybermalveillance.gouv.fr/tous-nos-contenus/fiches-reflexes/fraude-carte-bancaire',
      },
    ],
  },
  {
    id: 'identite',
    title: "Ma pièce d'identité ou mon numéro de sécurité sociale ont fuité",
    steps: [
      "Garde des preuves : captures d'écran datées, adresses des pages, messages reçus.",
      "Surveille ton courrier et tes comptes (banque, ameli, impôts) : un crédit ou un abonnement que tu n'as pas demandé est un signe d'usurpation.",
      "Ton numéro de sécurité sociale ne se change pas : méfie-toi longtemps des faux messages de l'Assurance maladie ou d'une mutuelle.",
      "En cas d'usurpation, dépose plainte et préviens les organismes concernés. France Victimes t'accompagne gratuitement au 116 006, 7 j/7 de 9 h à 19 h.",
    ],
    links: [
      {
        label: "Usurpation d'identité, que faire ? (cybermalveillance.gouv.fr)",
        href: 'https://www.cybermalveillance.gouv.fr/tous-nos-contenus/fiches-reflexes/usurpation-identite-que-faire',
      },
    ],
  },
  {
    id: 'email',
    title: 'Mon adresse e-mail a fuité',
    steps: [
      "Attends-toi à de l'hameçonnage crédible, qui reprend ton nom ou les services que tu utilises.",
      'Sécurise ta messagerie en premier : mot de passe unique et double authentification.',
      'Vérifie les règles de transfert automatique de ta messagerie : un pirate peut en ajouter une pour lire ton courrier.',
    ],
    links: [
      {
        label: "Que faire en cas d'hameçonnage (cybermalveillance.gouv.fr)",
        href: 'https://www.cybermalveillance.gouv.fr/tous-nos-contenus/fiches-reflexes/hameconnage-phishing',
      },
    ],
  },
  {
    id: 'telephone',
    title: 'Mon numéro de téléphone a fuité',
    steps: [
      'Signale les SMS et appels suspects au 33700.',
      'Méfie-toi des faux conseillers bancaires : raccroche et rappelle ta banque au numéro habituel.',
      'Si ton téléphone perd soudain le réseau, contacte ton opérateur : ce peut être un détournement de ta ligne (changement frauduleux de carte SIM).',
    ],
    links: [{ label: '33700.fr', href: 'https://www.33700.fr/' }],
  },
];

export function WhatToDo() {
  return (
    <>
      <PageHead
        eyebrow="Que faire ?"
        command={{ input: 'shredrgpd aide --urgence', output: 'canaux officiels · démarches' }}
        title="Les bons réflexes après une fuite"
      >
        Un message suspect, une carte exposée, un mot de passe dans la nature : voici à qui t'adresser, avec les canaux
        officiels.
      </PageHead>

      <div className="container page-body">
        <section aria-labelledby="message-suspect">
          <div className="section__head">
            <span className="eyebrow">Message suspect</span>
            <h2 id="message-suspect">J'ai reçu un message suspect</h2>
            <p className="lead">
              Les fuites servent souvent à rendre les arnaques plus crédibles. Ne clique pas, ne réponds pas, signale.
            </p>
          </div>
          <ul className="channels">
            {MESSAGES.map((c) => (
              <li className="channel" key={c.title}>
                <span className="step__icon">
                  <Icon name={c.icon} />
                </span>
                <h3>{c.title}</h3>
                <p>{c.text}</p>
                <ExternalLink href={c.action.href} className="channel__link">
                  {c.action.label}
                  <Icon name="external" size={14} />
                </ExternalLink>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="selon-donnee" className="guides">
          <div className="section__head">
            <span className="eyebrow">Selon ce qui a fuité</span>
            <h2 id="selon-donnee">Les démarches, donnée par donnée</h2>
          </div>
          <div className="faq">
            {GUIDES.map((g) => (
              <details key={g.id} id={g.id}>
                <summary>
                  {g.title}
                  <Icon name="plus" size={18} />
                </summary>
                <ol className="guide__steps">
                  {g.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                <ul className="guide__links">
                  {g.links.map((l) => (
                    <li key={l.href}>
                      {l.href.startsWith('/') ? (
                        <a href={l.href}>{l.label}</a>
                      ) : (
                        <ExternalLink href={l.href}>{l.label}</ExternalLink>
                      )}
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </section>

        <div className="guides__notice">
          <Notice>
            <p>
              Ensuite, exerce tes droits : <a href={href('/verifier')}>vérifie ce qui a fuité</a> et{' '}
              <a href={href('/lettre')}>écris aux entreprises concernées</a>. En cas d'urgence ou de danger, compose le
              17.
            </p>
          </Notice>
        </div>
      </div>
    </>
  );
}
