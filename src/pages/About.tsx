import { ExternalLink } from '../components/ExternalLink';
import { PageHead } from '../components/PageHead';
import { AUTHOR, SOURCE_CODE_URL } from '../config';
import { KNOWN_SITES } from '../data/sites';

export function About() {
  return (
    <>
      <PageHead
        eyebrow="À propos"
        command={{ input: 'shredrgpd --a-propos', output: 'gratuit · sans compte · sans traceur' }}
        title="Un outil pour se défendre, pas pour surveiller"
      >
        ShredRGPD aide les personnes dont les données ont fuité à exercer leurs droits, sans rien leur demander en
        retour.
      </PageHead>

      <div className="container page-body">
        <div className="prose">
          <h2>Ce que fait ShredRGPD</h2>
          <ul>
            <li>Il rédige des lettres d'effacement, d'accès et de relance fondées sur le RGPD.</li>
            <li>Il calcule les délais légaux de réponse et t'aide à suivre tes demandes.</li>
            <li>Il te renvoie vers les bons interlocuteurs, à commencer par la CNIL.</li>
          </ul>

          <h2>Ce que ShredRGPD ne fera jamais</h2>
          <ul>
            <li>
              Envoyer ton e-mail, le contenu de tes lettres ou tes données de suivi à un serveur ou à un tiers. Le site
              est statique et n'a pas de serveur applicatif.
            </li>
            <li>Héberger une base de fuites, même partielle, même hachée.</li>
            <li>Inventer le contact d'un responsable de traitement ou d'un DPO.</li>
            <li>Se présenter comme un conseil juridique : les modèles sont indicatifs.</li>
          </ul>

          <h2>Vie privée</h2>
          <p>
            Pas de compte, pas de cookie, pas d'analytics, pas de police chargée depuis un CDN. La page déclare une
            politique de sécurité du contenu : ton navigateur bloque toute requête de la page vers un autre site, avec
            une seule exception, <code>api.pwnedpasswords.com</code>.
          </p>
          <p>
            Cette exception sert au test de mot de passe, et seulement quand tu le lances. ShredRGPD calcule l'empreinte
            SHA-1 du mot de passe dans ton navigateur et n'en envoie que les 5 premiers caractères. Le service renvoie
            des centaines d'empreintes qui commencent pareil et la comparaison se fait chez toi (k-anonymat).
          </p>
          <p>
            Pour ton adresse e-mail, ShredRGPD ne fait aucune requête : tu la cherches toi-même sur Have I Been Pwned.
            La liste des fuites connues est intégrée au site au moment de sa publication (source : Have I Been Pwned,
            licence CC BY 4.0). Elle contient des informations publiques sur les fuites, jamais les données fuitées.
          </p>
          <p>
            Le formulaire de lettre reste en mémoire dans l'onglet et disparaît quand tu le fermes. Le suivi enregistre
            seulement le site, le type de demande, les dates, le statut et tes notes, dans le stockage local de ton
            navigateur. Tu peux l'exporter ou l'effacer à tout moment.
          </p>
          <p>
            Le bouton « Ouvrir dans ma messagerie » passe la lettre à ton logiciel de messagerie : c'est lui qui
            l'envoie, pas ShredRGPD. Les liens vers des sites externes s'ouvrent sans transmettre d'adresse d'origine.
          </p>

          <h2>Sites connus</h2>
          <p>
            {KNOWN_SITES.length === 0
              ? "La liste des sites connus est vide pour l'instant. Un site n'y entre qu'avec une source publique et une date de vérification, et son contact n'est indiqué que s'il est sourcé."
              : `La liste compte ${KNOWN_SITES.length} site${KNOWN_SITES.length > 1 ? 's' : ''}, chacun avec une source publique et une date de vérification.`}
          </p>

          <h2>Contribuer</h2>
          {SOURCE_CODE_URL ? (
            <p>
              Le code est libre. Tu peux signaler une erreur dans une lettre, proposer une amélioration ou héberger ta
              propre copie :{' '}
              <ExternalLink href={SOURCE_CODE_URL}>{SOURCE_CODE_URL.replace(/^https:\/\//, '')}</ExternalLink>.
            </p>
          ) : (
            <p>
              Tu as repéré une erreur dans une lettre ou tu as une idée d'amélioration ? Écris à{' '}
              <ExternalLink href={AUTHOR.url}>{AUTHOR.name}</ExternalLink> sur X.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
