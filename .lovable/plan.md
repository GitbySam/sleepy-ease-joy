## Changements demandés (marché Canada uniquement)

### 1. Prix du Duo Pack — CA
Dans `src/i18n/MarketContext.tsx`, marché `CA` :
- `duo: 59.90` → **`56.90`**
- `oldDuo: 119.80` (inchangé)

Note : `prices.duo` est utilisé à la fois sur la page produit (`/product`) et sur la landing page (`BundleOffer`). Le prix CA sera donc cohérent partout (un seul prix par marché). US et FR ne sont pas modifiés.

### 2. Pourcentage de réduction recalculé
Calcul : `1 - 56.90 / 119.80 = 52,5%` → affichage **`-52%`**.

Dans `src/pages/Product.tsx`, rendre le `discount` du Duo dynamique au lieu d'être codé en dur à `-50%` :
```ts
const duoDiscount = `-${Math.round((1 - (duoPrice / prices.oldDuo)) * 100)}%`;
```
puis l'utiliser dans le bundle Duo. Cela donnera automatiquement `-52%` en CA, et restera `-50%` pour US/FR.

### 3. Ajout du tag "For couples"
Sur le bundle Duo de la page produit, ajouter un petit sous-libellé "For couples" (traduit FR : "Pour les couples", ES : "Para parejas") visible à côté ou sous le label `2 Sleep&zy` (ou en complément du badge `DUO PACK`).

Implémentation :
- Nouvelle clé i18n `product.duoSubtitle` ("For couples" / "Pour les couples" / "Para parejas") dans `src/i18n/translations.ts`.
- Dans `src/pages/Product.tsx`, ajouter un champ optionnel `subtitle` au bundle Duo et l'afficher en petit texte gold/italique sous le label dans la carte de sélection.

### Hors scope
- Aucun changement sur la landing page hormis le prix CA déjà partagé via MarketContext.
- Aucun changement US / FR.
