## Changements sur SleepBundles

**Objectif** : aucun bundle pré-sélectionné, et clic sur un bundle déjà sélectionné = désélection.

### Modifications dans `src/components/SleepBundles.tsx`

1. **État initial** : `selectedBundle` passe de `"family"` à `null` (type `string | null`).
2. **Toggle** : au clic sur une carte, si `selectedBundle === bundle.id` → repasser à `null`, sinon sélectionner ce bundle.
3. **CTA "Add to Cart"** :
   - Désactivé tant que `selectedBundle === null`.
   - Libellé adapté quand rien n'est sélectionné (ex. "Choisis un pack" / "Select a bundle", via les traductions existantes ou texte neutre).
4. **Visuel** : la bordure dorée / glow / checkmark ne s'affichent que si un bundle est réellement sélectionné (aucun état "famille" par défaut au chargement).

Aucun changement de logique métier, de prix ou d'intégration Shopify.
