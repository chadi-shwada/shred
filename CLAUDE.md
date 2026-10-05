# Shred

Outil libre et gratuit pour exercer ses droits RGPD (effacement, accès, relance) face aux sites qui exposent des données issues de fuites. Site statique React + TypeScript + Vite, sans serveur. Langue de l'interface et des lettres : français.

## Commandes

```bash
npm install
npm run dev         # développement
npm run typecheck && npm run lint && npm test && npm run build   # à lancer avant chaque commit
```

## Structure

- `src/lib/` : logique pure et testée (dates, génération des lettres, suivi, slug). Pas de React ni de DOM ici.
- `src/browser.ts` : accès au navigateur (téléchargement, presse-papiers).
- `src/useTracking.ts` : hook qui persiste le suivi dans `localStorage`.
- `src/router.ts` : routage par fragment (`#/lettre`, `#/suivi`, `#/ressources`, `#/a-propos`).
- `src/data/sites.ts` : sites connus. Source et date de vérification obligatoires (vérifié par `sites.test.ts`). Vide pour l'instant.
- `src/pages/`, `src/components/` : interface. `ShredSheet` (accueil) et `Logo` sont décoratifs.
- `src/styles/global.css` : tokens de couleur et de typographie, mode sombre inclus.
- `vite.config.ts` : injecte au build une CSP stricte (`connect-src 'none'`). Toute fonctionnalité réseau future (Pwned Passwords) devra l'assouplir pour un seul domaine, explicitement.

## Règles non négociables

1. Aucune donnée personnelle envoyée à un serveur ou à un tiers. Pas d'analytics, pas de CDN de polices, pas de requête externe.
2. Aucune base de fuites, même partielle, même hachée côté serveur. L'outil aide à se défendre, il n'héberge rien.
3. Ne jamais inventer un contact de DPO ou de responsable de traitement. Laisser `contact` vide si on n'a pas de source.
4. Toute modification d'une lettre cite l'article du RGPD concerné et met à jour `src/lib/letters.test.ts`.
5. Ne jamais écrire de secret (token, clé d'API) dans le dépôt.

## Style

- Texte d'interface en français, casse de phrase, tutoiement, voix active. Pas de « veuillez », pas de « simplement ».
- Les lettres, adressées aux responsables de traitement, vouvoient.
- Les modèles de lettres sont indicatifs : ne jamais présenter l'outil comme un conseil juridique.
- Accessibilité : focus visible, `prefers-reduced-motion` respecté, contrastes AA en clair et en sombre.

## État du projet

Fait :
- générateur de lettres (effacement art. 17, accès art. 15, relance art. 12.3/12.4/77), copie, mailto, téléchargement, impression ;
- suivi local avec échéances (1 mois, 3 si prolongé), export et import JSON ;
- pages ressources et à propos, logo, animation d'accueil ;
- CI et déploiement GitHub Pages (sur `main`, source Pages « GitHub Actions » à activer).

Vérifié dans Chromium (Playwright) : rendu bureau 1280 px et mobile 375 px, clair et sombre, sans débordement horizontal ; aucune violation CSP ni requête externe ; logo lisible à 16 px ; contrastes des tokens ≥ 4,5:1.

Non vérifié : Safari et Firefox, lecteurs d'écran réels, appareils mobiles physiques.

À faire :
- Faire relire les lettres par un juriste. Leur structure suit le modèle CNIL (art. 17.1, 12.3, 19), mais le texte complet du modèle n'a pas pu être consulté depuis l'environnement de développement.
- Vérifier la disponibilité du nom (domaine, INPI).
- Test de mot de passe via Pwned Passwords (k-anonymity, SHA-1 calculé côté client). Vérifier d'abord le CORS depuis une page statique, puis ouvrir la CSP pour `api.pwnedpasswords.com` uniquement.
- Test d'email via Have I Been Pwned : clé d'API payante, mode « apporte ta clé » stockée dans le navigateur. Vérifier que l'API accepte les appels depuis un navigateur ; sinon il faudrait un proxy, ce qui contredit la règle 1. Attribution CC BY 4.0 obligatoire.
- Modèles de signalement aux hébergeurs, registrars et Cloudflare.
