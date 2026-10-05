# Shred

Outil libre et gratuit pour exercer ses droits RGPD (effacement, accès, relance) face aux sites qui exposent des données issues de fuites.

- Générateur de lettres d'effacement (art. 17), d'accès (art. 15), d'opposition (art. 21), de fermeture de
  compte (art. 17), de relance (art. 12.3, 12.4, 77) et de
  signalement à l'hébergeur (art. 16 du DSA), au registrar ou à Cloudflare.
- Suivi local des demandes avec calcul des délais légaux, export et import JSON, rappel calendrier (.ics)
  et récapitulatif de plainte CNIL.
- Page « Vérifier » : recherche de l'e-mail sur Have I Been Pwned (lien sortant), choix des fuites dans le
  catalogue public HIBP téléchargé au build (CC BY 4.0), lettre pré-remplie ; test de mot de passe Pwned
  Passwords par k-anonymat (seuls 5 caractères du SHA-1 partent).
- Site statique : aucune donnée personnelle ne quitte le navigateur. La CSP n'autorise qu'une origine réseau,
  `api.pwnedpasswords.com`, pour le test de mot de passe.

Les modèles de lettres sont indicatifs et ne constituent pas un conseil juridique.

## Développement

```bash
npm install
npm run dev
npm run typecheck && npm run lint && npm test && npm run build
```

Node 22.12 ou plus récent.

## Déploiement

Site statique déployé sur Vercel depuis la branche `main`. Une page HTML par adresse, servie grâce à
`cleanUrls`. Redéploiement hebdomadaire (liste des fuites à jour) si le secret GitHub `VERCEL_DEPLOY_HOOK`
contient l'URL d'un Deploy Hook Vercel. La configuration est dans `vercel.json` :
build `npm run build`, dossier `dist`, et en-têtes de sécurité (CSP identique à celle injectée dans
la page, plus `frame-ancestors 'none'`). Aucun script Vercel (Analytics, Speed Insights) n'est inclus.

## Licence

MIT.
