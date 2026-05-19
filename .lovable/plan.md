# Plan d'implémentation — Comportement page produit

## Décisions validées
1. **Philosophie A** : sélection exclusive entre pack Sleep&zy et bundle Sleep Kit.
2. **Un seul CTA global sticky** qui suit la sélection active.
3. **Landing page (`/`) : retirer complètement les Sleep Kit Bundles**. On garde uniquement l'offre Sleep&zy de base (`BundleOffer`).

---

## 1. Landing page (`src/pages/Index.tsx`)

- **Aucun changement** : `SleepBundles` n'y est pas monté actuellement → rien à retirer côté Index.
- Vérification : confirmer qu'aucun autre composant de la home n'importe `SleepBundles`. Si oui, supprimer l'import et l'usage.

---

## 2. Page Produit (`src/pages/Product.tsx`)

### Architecture cible
- **Lifting state up** : `Product.tsx` détient l'état de sélection global :
  ```ts
  type Selection =
    | { kind: 'pack', packKey: 'single'|'duo'|'family', color: string }
    | { kind: 'bundle', bundleKey: 'solo'|'duo'|'family' }
    | null;
  ```
- Initial : `null` (rien de pré-sélectionné nulle part).
- Sélectionner un pack Sleep&zy → **désélectionne** automatiquement le bundle.
- Sélectionner un bundle → **désélectionne** automatiquement le pack Sleep&zy.
- Recliquer sur l'élément actif → repasse à `null`.

### Composants à adapter
- **`ShopifyProducts`** (ou le sélecteur de pack utilisé sur `/product`) : passe en mode "contrôlé" via props `selectedPack` / `onSelectPack`. Plus de state local de sélection ni de CTA interne.
- **`SleepBundles` (mode `compact`)** : passe en mode contrôlé via `selectedBundle` / `onSelectBundle`. Le CTA interne actuel est **retiré**.
- **Nouveau CTA sticky global** (sur la page produit uniquement) :
  - Position : sticky en bas sur mobile, encart fixe ou inline pour desktop.
  - Désactivé tant que `selection === null` avec libellé "Choisissez un format ci-dessus".
  - Actif : "🛒 Ajouter au panier — {nom du pack/bundle} · {prix}".
  - Au clic : déclenche `addItem` (logique déjà présente dans `ShopifyProducts.handleAdd` / `SleepBundles.handleAdd`) puis ouverture du Cart Drawer après 500ms.

### Logique d'ajout centralisée
- Déplacer le `handleAdd` de `SleepBundles` (compact) et l'équivalent côté pack Sleep&zy dans une fonction unique `handleAddSelection(selection)` dans `Product.tsx`.
- Conserve tracking Meta Pixel + funnelTracking + toast existants.

---

## 3. Sticky Mobile CTA

- Le `StickyMobileCTA` actuel n'existe que sur la landing (`Index.tsx`). Sur `/product`, on crée un sticky dédié piloté par la sélection (et non par scroll/inactivité). Pas de réutilisation pour éviter de casser le comportement de la home.

---

## 4. Désélection et UX

- Bordure gold + checkmark uniquement si l'élément est l'élément actif de `selection`.
- Quand l'utilisateur change de catégorie (pack ↔ bundle), l'ancienne carte se désélectionne visuellement et la nouvelle s'allume — comportement instantané, sans animation lourde.
- Toast et auto-ouverture du Cart Drawer : inchangés.

---

## 5. Hors-scope (intentionnel)

- Pas de cross-sell automatique dans le Cart Drawer dans ce ticket (peut être un suivi).
- Pas de changement de prix, de variants Shopify ou de tracking.
- `BundleOffer` sur la landing reste inchangé.

---

## Fichiers touchés
- `src/pages/Product.tsx` — state de sélection global + CTA sticky + handler centralisé.
- `src/components/SleepBundles.tsx` — mode compact contrôlé, suppression du CTA interne.
- `src/components/ShopifyProducts.tsx` — sélecteur de pack contrôlé, suppression du CTA interne (sur `/product` uniquement, garder le comportement actuel sur la home si le composant y est utilisé — sinon ajouter une prop `controlled?: boolean`).
- `src/pages/Index.tsx` — vérification, aucune modif a priori.

---

## Critères d'acceptation
- À l'arrivée sur `/product` : aucun pack ni bundle sélectionné, CTA grisé.
- Sélectionner un pack Sleep&zy : seule cette carte est en gold, CTA actif au bon prix.
- Sélectionner ensuite un bundle : le pack se désélectionne, le bundle s'allume, CTA mis à jour.
- Recliquer sur l'élément actif : tout se désélectionne, CTA grisé.
- Ajout au panier : un seul item ajouté (jamais les deux), drawer s'ouvre.
- Landing page (`/`) : aucun Sleep Kit Bundle visible.
