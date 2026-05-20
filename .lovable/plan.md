# Test Option D — Quantity Stepper sur /product

## Objectif
Remplacer le bloc actuel "3 cartes empilées" (1 Sleep&zy / 2 Sleep&zy / 3 Sleep&zy) par **une seule carte produit** avec un **stepper de quantité** qui mappe automatiquement vers le bon variant Shopify (Single / Duo / Family). Page produit uniquement, landing intacte.

## Comportement cible

```text
┌─────────────────────────────────────────┐
│  [photo] Sleep&zy™ Travel Pillow        │
│                                         │
│  Quantity:                              │
│  ┌────┬────┬────┐                       │
│  │ 1  │ 2  │ 3  │   ← segmented buttons │
│  └────┴────┴────┘                       │
│  $29.95 │ $29.97 │ $21.65  ← prix/unité │
│         │  -50%  │  -64%   ← badge      │
│                                         │
│  Total: $64.95                          │
│  You save: $114.05 (vs $179.85)         │
│                                         │
│  [Selected badge selon qty: SOLO/DUO/FAMILY] │
└─────────────────────────────────────────┘
```

- **Pré-sélection** : qty=3 par défaut (équivalent Family pack, AOV max), sauf si `?bundle=1|2|3` en URL.
- **Click sur 1/2/3** → met à jour `selectedQty`, recalcule prix/unité, total, savings, et change le variant ciblé pour `addItem`.
- **Cliquer à nouveau sur la qty active ne désélectionne pas** (différent du comportement actuel) — on garde toujours une qty active pour que le CTA soit toujours actif. C'est l'esprit du quantity stepper.
- **Sleep Bundles (Sleep Kit)** : si l'utilisateur sélectionne un Sleep Kit, le quantity stepper passe en visuel "non actif" (opacité réduite, pas de badge "Selected"), comme aujourd'hui avec la sélection mutuellement exclusive.

## Calculs affichés

Pour chaque option du stepper :
- Prix unitaire = `bundlePrices[qty] / qty` (arrondi 2 décimales)
- Badge `-50%` / `-64%` (inchangé) à côté de la qty 2 et 3
- Total = `bundlePrices[qty]` (logique existante préservée)
- Savings = `bundleOldPrices[qty] - bundlePrices[qty]`

## Sticky CTA (mobile + desktop)
Inchangé dans sa structure. Label devient :
- `🛒 Add to cart — {qty} Sleep&zy · {total}`

## Fichiers touchés
- **`src/pages/Product.tsx`** :
  - Supprimer le bloc `bundles.map((b) => …)` (lignes 486-537).
  - Le remplacer par un nouveau composant inline `<QuantityStepper>` (3 boutons segmentés + prix unitaire + badge économie + savings line).
  - Garder la logique `handleAddToCart`, `bundles`, `bundlePrices`, `bundleOldPrices`, `singleVariant/duoVariant/familyVariant` — déjà compatible.
  - Ajuster `initialQty` → `bundleParam ?? 3` (au lieu de `null`) pour pré-sélection Family.
  - Ajuster `handleSelectPack(qty)` → ne plus désélectionner sur reclick (`setSelectedQty(qty)` simple).
  - `hasSelection` reste basé sur `selectedQty !== null || selectedBundleKey`.
- **Aucun autre fichier touché** (SleepBundles, ShopifyProducts, cartStore, Shopify config : zéro changement).

## Tracking
- `trackFunnelStep('select_bundle', …)` continue à se déclencher à chaque changement de qty.
- Meta Pixel `AddToCart` inchangé (utilise `selectedQty` final au click).

## Critères d'acceptation
- À l'arrivée sur `/product` : qty=3 pré-sélectionné, total $64.95 affiché, CTA actif.
- Cliquer sur "1" : prix unitaire $29.95, total $29.95, CTA "Add to cart — 1 Sleep&zy · $29.95".
- Cliquer sur "2" : prix unitaire ~$29.97, total $59.95, badge -50%.
- Cliquer sur "3" : prix unitaire ~$21.65, total $64.95, badge -64%, savings $114.90.
- Sélectionner un Sleep Kit → stepper devient inactif visuellement, CTA suit le Sleep Kit.
- Add to cart → ajoute le bon variant Shopify selon qty (Single/Duo/Family).
- Landing `/` : aucun changement visible.

## Hors-scope
- Pas de A/B test technique (on bascule directement, on observe la conversion via funnel tracking).
- Pas de traductions nouvelles à ajouter (les libellés "Quantity", "Total", "You save" peuvent passer par les keys existantes `product.yourPrice` ou être ajoutées si besoin — à voir au build).
- Pas de modification des prix ni des variants Shopify.
