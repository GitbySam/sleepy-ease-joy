## Problèmes

Dans `src/components/StickyMobileCTA.tsx` :

1. **Le bouton est inactif sur la home** — il fait `document.getElementById("offer").scrollIntoView()`. Or l'id `offer` n'existe que dans `BundleOffer.tsx`, qui n'est **pas** monté sur `/` (la home utilise `ShopifyProducts` avec `id="products"`). Résultat : `getElementById` renvoie `null` et rien ne se passe au clic.

2. **Disparaît trop vite après le scroll** — la logique actuelle :
   - À chaque évènement scroll, on appelle `hideSticky()` puis on programme un timer de 3 s qui le ré-affiche.
   - Donc dès qu'on arrête de scroller, la barre est cachée et ne réapparaît que 3 s plus tard — pile pendant la fenêtre où l'utilisateur voudrait cliquer.
   - Le `isOfferCtaVisible()` cherche aussi `#offer` (absent sur la home) → renvoie toujours `false`, OK ici mais incohérent.

## Correctifs (uniquement `src/components/StickyMobileCTA.tsx`)

### A. Rendre le clic fonctionnel
- Utiliser `useNavigate` + `useLocation` de `react-router-dom`.
- Au clic :
  - Essayer d'abord `document.getElementById("offer") || document.getElementById("products")` et `scrollIntoView` si trouvé sur la page courante.
  - Sinon (cas home sans section offer visée), naviguer vers `/product` (ou `/product#offer`).
- Cela règle aussi le cas où l'utilisateur est sur une page sans section produit.

### B. Garder la barre visible assez longtemps pour cliquer
- Ne plus cacher la barre à chaque évènement scroll. Nouvelle logique :
  - Afficher dès qu'on est `pastHero` (scrollY > 100) **et** qu'on n'est pas sur la section offer/products visible.
  - Cacher uniquement quand : on remonte au-dessus du Hero, ou la section cible (`#offer` ou `#products`) entre dans le viewport (l'utilisateur est déjà sur le CTA principal).
  - Conserver l'apparition immédiate sur "scroll rapide vers le haut" (intention de quitter).
  - Supprimer le timer d'inactivité qui re-cache puis re-montre — il crée la disparition gênante.
- Mettre à jour `isOfferCtaVisible()` pour viser `#offer` **ou** `#products`.

### C. Empêcher la disparition involontaire pendant un tap
- Augmenter la zone cliquable (déjà OK) et s'assurer que `pointer-events` reste actif pendant l'animation `exit` (la durée 0.3 s de Framer est correcte, on garde).

## Hors scope
- Pas de changement de style, copy, ni de la logique d'apparition du Hero.
- Pas de modifications backend/analytics.

## Fichiers touchés
- `src/components/StickyMobileCTA.tsx`
