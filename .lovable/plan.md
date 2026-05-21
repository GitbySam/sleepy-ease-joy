## Objectif
Associer chaque pastille de couleur à la bonne image bundle dans le panier :
- Grey → bundle gris
- Black → bundle noir (nouvelle image générée)
- Red → bundle rouge

## Statut
- Image `src/assets/bundle-three-items-black.jpg` **déjà générée** (oreiller noir + accessoires sur fond beige, identique en composition au bundle gris)

## Changements
**`src/components/ShopifyCartDrawer.tsx`**
- Importer `bundleBlackImg from "@/assets/bundle-three-items-black.jpg"`
- Dans `BUNDLE_COLOR_IMAGES`, remplacer `black: bundleGreyImg` par `black: bundleBlackImg`

Aucun autre fichier impacté — la logique de détection de couleur existante (`colorKey` en lowercase) gère déjà le mapping.