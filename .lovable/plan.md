# Bundle image réactive à la couleur (Page produit)

## Objectif
Sur `/product`, l'image du **Sleep Kit Bundle (3 articles)** doit changer en fonction de la pastille de couleur sélectionnée, exactement comme l'oreiller seul le fait déjà via `COLOR_IMAGES`.

## Changements

### `src/pages/Product.tsx`
1. **Ajouter 2 imports** d'images bundle déjà présentes :
   - `bundle-three-items-black.jpg`
   - `bundle-three-items-red.jpg`
   (`bundle-three-items-hero.jpg` est déjà importé)

2. **Créer une map `BUNDLE_IMAGES`** sur le même modèle que `COLOR_IMAGES` :
   ```ts
   const BUNDLE_IMAGES: Record<string, string> = {
     Black: bundleThreeItemsBlack,
     Red:   bundleThreeItemsRed,
     Grey:  bundleThreeItemsHero, // fallback neutre (pas d'image grey dédiée)
   };
   ```

3. **Remplacer l'usage statique** à la ligne ~738 :
   - `src={bundleThreeItemsHero}` → `src={BUNDLE_IMAGES[selectedColor] || bundleThreeItemsHero}`
   - Idem pour `onClick={() => setLightboxSrc(...)}`
   - Mettre à jour le `alt` pour inclure la couleur
   - Ajouter `key={selectedColor}` sur le `<img>` pour forcer un re-render propre (cohérent avec l'oreiller ligne 464)

## Hors-scope
- Cart drawer : déjà géré côté variantes Shopify (pas de changement).
- Aucune modification du composant `SleepBundles` (cards), ni des autres pages.
- Pas de génération de nouvelle image grey — utilisation de l'image hero existante comme fallback.
