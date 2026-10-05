# Shred

Outil libre et gratuit pour exercer ses droits RGPD (effacement, accès, relance) face aux sites qui exposent des données issues de fuites. Site statique React + TypeScript + Vite, sans serveur. Langue de l'interface et des lettres : français.

## Commandes

```bash
npm install
npm run dev         # développement
npm run typecheck && npm run lint && npm test && npm run build   # à lancer avant chaque commit
npx prettier --write "src/**/*.{ts,tsx}"   # mise en forme (.prettierrc)
```

## Structure

- Types de demande RGPD : table unique `INITIAL_KINDS` dans `src/lib/letters.ts` (libellé, formulation, article), utilisée par le suivi, la relance et la plainte CNIL.
- `src/lib/` : logique pure et testée (dates, lettres, suivi, slug, `pwned.ts` pour le test de mot de passe, `breaches.ts` pour le catalogue des fuites, `letterLink.ts` pour pré-remplir une lettre depuis une fuite, `domain.ts` pour la recherche WHOIS/ICANN, `ics.ts` pour le rappel d'échéance, `complaint.ts` pour le récapitulatif de plainte CNIL). Pas de React ni de DOM ici.
- `src/config.ts` : adresse du site (`SITE_URL`), auteur, pages du sitemap, titre et description, et `SOURCE_CODE_URL` (null tant que le dépôt est privé : les liens « Code source » et la mention « code ouvert » sont alors masqués).
- `scripts/fetch-breaches.mjs` : lancé par `prebuild`, télécharge le catalogue public HIBP (`/api/v3/breaches`, métadonnées, CC BY 4.0) vers `src/data/breaches.generated.json` (non versionné). En cas d'échec, le build continue et la page Vérifier affiche « liste indisponible ». `src/breachCatalog.ts` le charge à la demande via `import.meta.glob`.
- `src/browser.ts` : accès au navigateur (téléchargement, presse-papiers).
- `src/useTracking.ts` : hook qui persiste le suivi dans `localStorage`.
- `src/router.ts` : routage par chemin (`/verifier`, `/lettre`, `/suivi`, `/ressources`, `/a-propos`, `/mentions-legales`) ; une adresse inconnue reçoit `404.html`. Les paramètres de pré-remplissage vont dans le fragment (`/lettre#site=…`), jamais dans `?…`, pour ne pas apparaître dans les journaux de l'hébergeur. Les anciennes adresses `#/page?…` sont converties. Le générateur lit `type`, `site`, `contexte`, `fuite`, `date-fuite`, `donnees`, `autres`, `cible`, `depuis`, `premiere`, `suivi`.
- `src/data/sites.ts` : sites connus. Source et date de vérification obligatoires (vérifié par `sites.test.ts`). Vide pour l'instant.
- `src/pages/`, `src/components/` : interface. `ShredSheet`, `BinaryField`, `ScrambleText`, `DataStream`, `FooterWord` et `Logo` sont décoratifs (`aria-hidden`, figés si `prefers-reduced-motion`).
- `src/styles/global.css` : tokens de couleur et de typographie, mode sombre inclus. Le site est entièrement sombre : `<html class="theme-dark">` dans `index.html` (choix de design). Les tokens clairs de `:root` restent comme base.
- Identité : bleu `#2F4BDC` du logo (`public/logo.png`, tracé vectoriel dans `Logo.tsx` et `public/favicon.svg`), polices Inter et JetBrains Mono auto-hébergées via `@fontsource-variable` (OFL).
- `src/security.ts` : source unique de la CSP. `vite.config.ts` l'injecte en `<meta>`, `vercel.json` l'envoie en en-tête HTTP (avec `frame-ancestors`) ; `security.test.ts` vérifie qu'elles restent alignées.
- `src/seo.ts` : titre, description et aperçu de chaque page (testé : une entrée par route de `PUBLIC_ROUTES`). Le plugin `seo` de `vite.config.ts` génère une page HTML par adresse (`verifier.html`…, servies sur `/verifier` grâce à `cleanUrls` dans `vercel.json`), un `404.html` non indexé, `robots.txt` et `sitemap.xml`. `public/og.png` est l'image d'aperçu 1200×630.
- `.github/workflows/refresh-breaches.yml` : redéploiement hebdomadaire pour rafraîchir le catalogue HIBP, via le secret GitHub `VERCEL_DEPLOY_HOOK` (à créer par l'auteur ; sans lui, le workflow ne fait rien). Injecte aussi au build la CSP (`connect-src https://api.pwnedpasswords.com` seulement, `font-src 'self'`) et désactive l'intégration des fichiers en `data:` (`assetsInlineLimit: 0`), sinon la CSP bloque les petites polices.

## Règles non négociables

1. Aucune donnée personnelle envoyée à un serveur ou à un tiers. Pas d'analytics, pas de CDN de polices, pas de requête externe. Seule exception, validée : le test de mot de passe par k-anonymat vers `api.pwnedpasswords.com`, lancé par la personne, qui n'envoie que les 5 premiers caractères du SHA-1. L'e-mail ne passe jamais par Shred : la recherche se fait sur haveibeenpwned.com.
2. Aucune base de fuites, même partielle, même hachée côté serveur. L'outil aide à se défendre, il n'héberge rien. Le catalogue HIBP embarqué ne contient que des métadonnées publiques (nom, date, types de données), jamais de données fuitées ; attribution CC BY 4.0 affichée sur la page Vérifier.
3. Ne jamais inventer un contact de DPO ou de responsable de traitement. Laisser `contact` vide si on n'a pas de source.
4. Toute modification d'une lettre cite l'article du RGPD concerné et met à jour `src/lib/letters.test.ts`.
5. Ne jamais écrire de secret (token, clé d'API) dans le dépôt.

## Style

- Texte d'interface en français, casse de phrase, tutoiement, voix active. Pas de « veuillez », pas de « simplement ».
- Les lettres, adressées aux responsables de traitement, vouvoient.
- Les modèles de lettres sont indicatifs : ne jamais présenter l'outil comme un conseil juridique.
- Accessibilité : focus visible, `prefers-reduced-motion` respecté, contrastes AA sur le thème sombre, liens soulignés dans le texte, zones défilantes accessibles au clavier. Audit axe (WCAG 2.1 AA + bonnes pratiques) : 0 erreur sur toutes les pages.

## État du projet

Fait :
- générateur de lettres (effacement art. 17, accès art. 15, opposition art. 21.1/21.2/21.3 avec 17.1 c et 15.1 g, fermeture de compte art. 17.1 a/b, 7.3, 17.3 b, relance art. 12.3/12.4/77, signalement à l'hébergeur au titre de l'art. 16 du DSA ou au registrar et à Cloudflare au titre de leur politique anti-abus, illégalité fondée sur les art. 5 et 6 du RGPD), avec aide pour trouver le contact (ICANN, Cloudflare), en deux contextes : « exposition » (un site publie les données, art. 17.1 d, 17.2) et « violation » (l'entreprise a subi la fuite, art. 17.1 a/b, 34, 34.2, 33.3) ; copie, mailto, téléchargement, impression ;
- page Vérifier : lien vers HIBP pour l'e-mail, recherche dans le catalogue des fuites, données exposées et conseils, lettre pré-remplie ; test de mot de passe Pwned Passwords ;
- suivi local avec échéances (1 mois, 3 si prolongé), export et import JSON, rappel `.ics` et récapitulatif de plainte CNIL ;
- mentions légales (éditeur Cha4Sh, hébergeur Vercel Inc.), aperçu de partage, sitemap ;
- pages ressources et à propos, logo, animation d'accueil ;
- CI GitHub Actions ; déploiement Vercel depuis `main` (`vercel.json`). GitHub Pages abandonné : le dépôt est privé.
- Ne jamais ajouter `@vercel/analytics` ni `@vercel/speed-insights` (règle 1).

Vérifié dans Chromium (Playwright) : rendu bureau 1440 px et mobile 390 px, clair, sombre et animations réduites, sans débordement horizontal ; aucune violation CSP ni requête externe ; contrastes des tokens ≥ 4,5:1 (clair, sombre, `.theme-dark`).

Non vérifié : Safari et Firefox, lecteurs d'écran réels, appareils mobiles physiques.

À faire :
- Faire relire les lettres par un juriste. Leur structure suit le modèle CNIL (art. 17.1, 12.3, 19), mais le texte complet du modèle n'a pas pu être consulté depuis l'environnement de développement.
- Vérifier la disponibilité du nom (domaine, INPI).
- Vérifier en production (non testable depuis l'environnement de dev, réseau bloqué) : que `api.pwnedpasswords.com` répond bien depuis le navigateur (CORS, testé seulement avec un faux service) et que le catalogue HIBP est bien téléchargé au build Vercel (log `[fetch-breaches]`).
- Test d'e-mail intégré via l'API HIBP : écarté (envoie l'e-mail à un tiers, clé payante).
- Mentions légales : l'éditeur reste anonyme (personne physique non professionnelle) ; à confirmer par l'auteur. Le téléphone de l'hébergeur, demandé par la LCEN, n'est pas indiqué faute de source vérifiée.
- Rendre le dépôt public puis renseigner `SOURCE_CODE_URL`, ou retirer la licence MIT annoncée dans le README.
