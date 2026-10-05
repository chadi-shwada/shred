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

Le workflow `.github/workflows/deploy.yml` publie `dist/` sur GitHub Pages à chaque push sur `main`.
Dans les réglages du dépôt, choisir **Pages → Source : GitHub Actions**.

## Licence

MIT.
