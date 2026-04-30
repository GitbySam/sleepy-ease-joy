
# Plan — Multi-marchés Sleep&zy (CA / US / FR)

## Pricing finalisé (Option A)

| Marché | Devise | Single | Duo (×2) | Family (×3) |
|---|---|---|---|---|
| 🇨🇦 Canada | CAD | $29.95 (barré $59.90) | $59.90 (barré $119.80) | $64.95 (barré $179.70) |
| 🇺🇸 USA | USD | $29.95 (barré $59.90) | $59.90 (barré $119.80) | $64.95 (barré $179.95) |
| 🇫🇷 France | EUR (TTC) | 25.95 € (barré 51.90 €) | 51.90 € (barré 103.80 €) | 56.95 € (barré 155.95 €) |

Réductions affichées : Single -50%, Duo -50%, Family -64% (identique sur les 3 marchés).

---

## Étape 1 — Configuration Shopify Markets (à faire par toi côté admin)

Tu fais ces étapes dans ton admin Shopify avant que le code soit utile :

1. **Settings → Markets → Add market**
   - Créer **United States** (USD)
   - Créer **France** (EUR)
   - Canada reste le marché principal (CAD)
2. **Pour chaque marché → Products and pricing :**
   - Choisir « Set prices manually » (pas de conversion auto)
   - Définir les prix par variante (9 variantes : 3 packs × 3 couleurs)
   - Saisir les prix exacts du tableau ci-dessus
3. **Domains/URLs** : laisser le routing auto (Shopify route via le même domaine, le `@inContext` du Storefront API gère la devise)
4. **Activer** les 3 marchés
5. **Shipping** : créer des zones de livraison pour US et FR (Settings → Shipping)

Une fois fait, le Storefront API renverra automatiquement les bons prix quand on ajoute la directive `@inContext(country: ...)` aux requêtes.

---

## Étape 2 — Code côté Lovable

### 2.1 Nouveau `MarketContext` (`src/i18n/MarketContext.tsx`)

Source de vérité unique pour pays/devise/prix. Provider en haut de l'app.

État exposé :
- `country: 'CA' | 'US' | 'FR'`
- `currency: 'CAD' | 'USD' | 'EUR'`
- `currencySymbol: '$' | '€'`
- `currencyCode` (suffixe affiché : "CAD", "USD", "" pour EUR)
- `prices`: table figée par pays (Single/Duo/Family + prix barrés)
- `setCountry(c)` → persisté dans `localStorage` (`sleepzy-market`)
- `formatPrice(amount)` → helper unifié

Détection initiale (priorité) :
1. `localStorage.sleepzy-market` si présent
2. Détection IP via `https://ipapi.co/country/` (fetch léger, fallback silencieux)
3. Mapping langue → pays (`fr` → FR, `en` → CA par défaut)
4. Fallback : `CA`

Lien langue/pays : changer le pays met à jour la langue compatible (FR→fr, CA→en par défaut, US→en) sans forcer ; l'utilisateur peut toujours changer via le sélecteur.

### 2.2 Sélecteur pays dans le Header (`src/components/CountrySelector.tsx`)

- Petit bouton dans le `Header` (desktop + menu mobile) à côté du panier
- Affiche drapeau + code pays (🇨🇦 CA / 🇺🇸 US / 🇫🇷 FR)
- Dropdown (Radix `DropdownMenu` déjà dispo) avec les 3 options
- Au changement : `setCountry()` → MAJ devise + prix + langue suggérée + reset du cart Shopify (le panier est lié à une devise, on ne peut pas mélanger)

### 2.3 Refactor des composants prix

Tous tirent désormais leurs prix du `MarketContext` au lieu de hardcoder :

- **`BundleOffer.tsx`** : remplacer le tableau `bundles` par `prices` du context
- **`Product.tsx`** : remplacer `singlePrice/duoPrice/familyPrice` et `bundleOldPrices` par le context. `currencySymbol` vient du context. Suffixe "CAD"/"USD" conditionnel.
- **`CartDrawer.tsx` / `ShopifyCartDrawer.tsx`** : afficher la devise du context, recalculer totaux en local
- **`UpsellPopup.tsx`** : prix conditionnels via context
- **`StickyMobileCTA.tsx`** : prix conditionnels via context
- **`CtaBridge.tsx`** : prix conditionnels via context
- **`ShopifyProducts.tsx`** : passer `country` aux requêtes Storefront

Helper unique `formatPrice(amount, { showCode })` :
- CA → `$29.95 CAD`
- US → `$29.95 USD`
- FR → `25,95 €` (virgule, suffixe vide)

### 2.4 Storefront API : `@inContext`

Modifier `src/lib/shopify.ts` pour injecter le pays dans toutes les requêtes :

- `fetchProducts(first, query, country)` → ajoute `@inContext(country: $country)`
- `createShopifyCart(item, country)` → idem sur la mutation `cartCreate` avec `buyerIdentity.countryCode`
- `addLineToShopifyCart` / updates : Shopify garde le contexte du cart créé, pas de changement
- Le `cartStore` mémorise le `country` du cart courant ; si l'utilisateur change de pays alors qu'un cart existe → vider le cart avant de recréer

Résultat : Shopify renvoie les prix dans la bonne devise et le checkout s'ouvre dans la devise du marché choisi.

### 2.5 Prix d'affichage vs prix Shopify

Aujourd'hui le code utilise des prix "fictifs" côté frontend (`bundlePrice`) parce que les variantes Shopify ont un seul prix de base. Avec Markets configuré correctement (étape 1), on peut **soit** :
- (a) Garder l'affichage hardcodé via `MarketContext` (rapide, exact, dépend de la cohérence avec Shopify) ✅ choix recommandé
- (b) Lire le prix retourné par `@inContext` (source unique de vérité, mais demande un refactor plus large des composants prix)

On part sur **(a)** : `MarketContext` est la source pour l'affichage, Shopify Markets est la source pour le checkout. À toi de bien saisir les mêmes prix dans Shopify Markets.

### 2.6 Persistance & UX

- `localStorage.sleepzy-market` → pays choisi
- Bandeau discret la première fois : « On dirait que tu es en France 🇫🇷 — voir les prix en euros ? » (acceptable / refuser) — optionnel, peut être ajouté en V2
- Si pays change pendant qu'un cart existe : toast « Devise mise à jour, panier réinitialisé »

### 2.7 Mises à jour mémoires Lovable

- Mettre à jour `mem://marketing/pricing-strategy` avec les 3 marchés
- Mettre à jour la Core memory pour refléter "CA/US/FR markets"

---

## Détails techniques

### Prix figés dans MarketContext

```text
PRICES = {
  CA: { currency: 'CAD', symbol: '$', code: 'CAD',
        single: 29.95, duo: 59.90, family: 64.95,
        oldSingle: 59.90, oldDuo: 119.80, oldFamily: 179.70 },
  US: { currency: 'USD', symbol: '$', code: 'USD',
        single: 29.95, duo: 59.90, family: 64.95,
        oldSingle: 59.90, oldDuo: 119.80, oldFamily: 179.95 },
  FR: { currency: 'EUR', symbol: '€', code: '',
        single: 25.95, duo: 51.90, family: 56.95,
        oldSingle: 51.90, oldDuo: 103.80, oldFamily: 155.95 },
}
```

### GraphQL `@inContext`

```text
query GetProducts($first: Int!, $country: CountryCode!)
@inContext(country: $country) { products(first: $first) { ... } }

mutation cartCreate($input: CartInput!, $country: CountryCode!)
@inContext(country: $country) { cartCreate(input: $input) { ... } }
```

### Architecture provider

```text
App
 └── LanguageProvider
      └── MarketProvider   ← nouveau
           └── Routes
                ├── Header (CountrySelector)
                ├── Index (BundleOffer, CtaBridge, etc.)
                └── Product
```

---

## Fichiers touchés

**Créés**
- `src/i18n/MarketContext.tsx`
- `src/components/CountrySelector.tsx`

**Modifiés**
- `src/App.tsx` (wrap MarketProvider)
- `src/components/Header.tsx` (ajout CountrySelector)
- `src/lib/shopify.ts` (`@inContext` + signature des fonctions)
- `src/stores/cartStore.ts` (mémoriser country, reset si changement)
- `src/components/BundleOffer.tsx`
- `src/components/CtaBridge.tsx`
- `src/components/StickyMobileCTA.tsx`
- `src/components/UpsellPopup.tsx`
- `src/components/CartDrawer.tsx`
- `src/components/ShopifyCartDrawer.tsx`
- `src/components/ShopifyProducts.tsx`
- `src/pages/Product.tsx`
- `src/i18n/translations.ts` (clés sélecteur pays)
- `mem://index.md` + `mem://marketing/pricing-strategy`

---

## Ordre d'implémentation

1. Créer `MarketContext` + `PRICES`
2. Brancher `MarketProvider` dans `App.tsx`
3. Créer `CountrySelector` + l'ajouter au `Header`
4. Refactor `shopify.ts` avec `@inContext` + signatures
5. Refactor `cartStore.ts` (gestion changement pays)
6. Refactor des 7 composants prix un par un (BundleOffer → Product → Cart → autres)
7. Test manuel : switch CA→US→FR, vérifier prix + checkout
8. Mettre à jour la mémoire

---

## Ce dont j'ai besoin de toi pour valider

1. **Plan OK ?** Je passe à l'implémentation.
2. **Sélecteur pays visible où exactement ?** Header desktop à côté du panier + dans le menu mobile (recommandé), ou juste menu mobile ?
3. **Détection IP** : OK pour `ipapi.co` (gratuit, ~1000 req/jour) ou tu préfères pas de détection auto (uniquement choix manuel + langue) ?
4. **Tu confirmes saisir les prix dans Shopify Markets toi-même** une fois que je t'aurai donné le mémo des prix exacts à saisir ?

Une fois validé, je code l'ensemble en mode build.
