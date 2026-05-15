## Problème observé

Sur la capture Clarity (mobile, langue FR), le bouton sticky en bas affiche « ACHETER —--%  €€€ » au lieu de « Acheter — -50%  ~~51,90 €~~ 25,95 € ».

Cause : dans `src/components/StickyMobileCTA.tsx`, le label (`sticky.cta` = « Acheter — -50% »), l'icône, le prix barré et le prix actuel sont tous mis sur **une seule ligne** dans un bouton arrondi. En français le symbole « € » est placé **après** le nombre (ex. « 25,95 € »), donc la chaîne est plus longue qu'en anglais (« $25.95 »). Sur les petits écrans (≤ 360 px), la ligne dépasse et seul le début et la fin (« —--% €€€ ») restent visibles ; le reste est tronqué/écrasé.

## Correctif proposé (UI uniquement)

Modifier `src/components/StickyMobileCTA.tsx` :

1. Empiler verticalement le label et le bloc de prix au lieu de les mettre côte à côte :
   - Ligne 1 : icône + « Acheter — -50% »
   - Ligne 2 (plus petite) : prix barré + prix actuel
2. Ajouter `whitespace-nowrap` sur la ligne des prix pour éviter le retour à la ligne au milieu d'un montant, et `text-xs` pour gagner de la place.
3. Réduire le `tracking-wider` à `tracking-wide` et passer `text-sm` → `text-[13px]` sur les très petits écrans pour garder le bouton lisible.
4. Vérifier sur viewport 360 × 800 (Clarity), 375 × 812 (iPhone SE) et 390 × 844.

## Fichiers touchés

- `src/components/StickyMobileCTA.tsx` (présentation uniquement, aucune logique métier modifiée)

Aucune traduction ni logique de prix n'est changée — la version CA/EN reste identique visuellement, et le contenu FR s'affichera enfin correctement.
