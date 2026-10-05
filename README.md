# Shred

Outil libre et gratuit pour exercer ses droits RGPD (effacement, accès, relance) face aux sites qui exposent des données issues de fuites.

- Générateur de lettres d'effacement (art. 17), d'accès (art. 15) et de relance (art. 12.3, 12.4, 77).
- Suivi local des demandes avec calcul des délais légaux, export et import JSON.
- Site statique : aucune donnée ne quitte le navigateur. Le build déclare une CSP `connect-src 'none'`.

Les modèles de lettres sont indicatifs et ne constituent pas un conseil juridique.

## Développement

```bash
npm install
npm run dev
npm run typecheck && npm run lint && npm test && npm run build
```

Node 22.12 ou plus récent.

## Déploiement

Site statique déployé sur Vercel depuis la branche `main`. La configuration est dans `vercel.json` :
build `npm run build`, dossier `dist`, et en-têtes de sécurité (CSP identique à celle injectée dans
la page, plus `frame-ancestors 'none'`). Aucun script Vercel (Analytics, Speed Insights) n'est inclus.

## Licence

MIT.
