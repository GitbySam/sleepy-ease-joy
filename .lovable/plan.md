

## Plan : Sélecteur de couleur fluide pour Sleep&zy

### Contexte
Le produit Shopify actuel n'a qu'une seule option ("Pack" : Single, Duo Pack, Family Pack). Il faut ajouter une option "Color" (Gris, Noir, Rouge) avec des variantes croisées (3 couleurs x 3 packs = 9 variantes).

### Approche UX
Sélecteur de couleur sous forme de **cercles colorés cliquables** (swatches) placés juste au-dessus du sélecteur de bundle. Au clic, la couleur sélectée est mise en évidence avec un anneau doré et une coche. L'image produit change en fonction de la couleur sélectionnée (transition fluide avec Framer Motion).

### Etapes

**1. Mise a jour du produit Shopify**
- Ajouter l'option "Color" avec les valeurs "Grey", "Black", "Red" via l'API Shopify
- Cela transforme les 3 variantes actuelles en 9 variantes (Grey/Single, Grey/Duo Pack, Grey/Family Pack, Black/Single, etc.)
- Chaque variante conserve les memes prix par pack
- Uploader les images produit par couleur si disponibles

**2. Mise a jour de la page produit (`src/pages/Product.tsx`)**
- Ajouter un state `selectedColor` (defaut: "Grey")
- Extraire les couleurs disponibles depuis `product.node.options`
- Afficher des swatches couleur (cercles) avec mapping : Grey → `#9CA3AF`, Black → `#1F2937`, Red → `#DC2626`
- Filtrer les variantes par couleur selectionnee pour le sélecteur de bundle
- Animer le changement d'image produit (fade) quand la couleur change
- Transmettre la couleur dans `selectedOptions` lors de l'ajout au panier

**3. Adaptation du query GraphQL**
- Augmenter `variants(first: 10)` a `variants(first: 30)` dans la requete Storefront pour couvrir les 9+ variantes

### Details techniques

```text
┌──────────────────────────────────────┐
│  [Image produit - change par couleur]│
│                                      │
├──────────────────────────────────────┤
│  Couleur: ● Gris  ● Noir  ● Rouge   │  ← swatches circulaires
│                                      │
│  ┌─ 1 Sleep&zy  ─────── $34.95 ──┐  │
│  ├─ 2 Sleep&zy (DUO)── $54.87 ──┤  │  ← bundles filtrés par couleur
│  └─ 3 Sleep&zy (FAMILY) $69.90 ──┘  │
│                                      │
│  [🛒 Add to cart — 1 Sleep&zy]       │
└──────────────────────────────────────┘
```

- Chaque swatch = `<button>` rond de 32px avec `ring-2 ring-gold` quand sélectionné + coche animée
- La sélection de variante croisera `selectedColor` + `selectedQty` pour trouver la bonne variante Shopify
- Le composant `ShopifyProducts` (grille) sera aussi adapte pour afficher la couleur par defaut

