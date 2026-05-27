## Objectif

Sur mobile, quand l'utilisateur clique sur une pastille de couleur, faire défiler la page automatiquement vers l'image du produit pour qu'il voit immédiatement le changement.

## Fichiers modifiés

### 1. `src/pages/Product.tsx`
- Ajouter `useIsMobile` (hook déjà existant dans `src/hooks/use-mobile.tsx`)
- Ajouter une `ref` (`imageRef`) sur le conteneur de la galerie image (colonne gauche)
- Dans le `onClick` de chaque pastille de couleur, après `setSelectedColor(...)` :
  ```ts
  if (isMobile) {
    imageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  ```
- Délai léger (`setTimeout` 50ms) pour laisser le re-render se faire avant le scroll

### 2. `src/components/ShopifyProducts.tsx`
- Même logique pour le sélecteur de couleur global de la section produits
- Ajouter une `ref` sur le conteneur de la grille de produits
- Scroll vers le haut de la grille au clic (mobile uniquement)

### 3. `src/components/BundleOffer.tsx` (si concerné)
- Vérifier la présence d'un sélecteur de couleur et appliquer la même logique si besoin

## Comportement

- **Desktop** : aucun changement (image toujours visible à côté du sélecteur)
- **Mobile** : scroll fluide vers l'image dès le clic, l'utilisateur voit le changement de couleur sans effort
- Le scroll utilise `block: 'start'` avec un offset visuel naturel (header sticky pris en compte via `scroll-margin-top` sur le conteneur image)

## Détail technique

Ajouter sur le conteneur image :
```tsx
<div ref={imageRef} className="scroll-mt-20 ...">
```
Le `scroll-mt-20` (Tailwind) évite que l'image soit cachée sous le header sticky mobile.
