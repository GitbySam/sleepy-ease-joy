

## Renforcer la confiance dans le Cart Drawer

### Constat
Le drawer a deja des badges basiques (icones paiement, SSL, livraison gratuite, garantie 90j) mais ils sont petits, en bas, et peu visibles. Avec un bounce rate de 82% et seulement 12 AddToCart sur 211 visiteurs, chaque micro-hesitation dans le panier coute cher.

### Propositions (par ordre d'impact)

**1. Bandeau de reassurance en haut du panier**
Juste sous le header du drawer, ajouter un bandeau vert/dore compact :
`"Free shipping + 90-day money-back guarantee"`
Visible immediatement a l'ouverture, avant meme de voir les articles.

**2. Mini social proof**
Sous le bandeau : `"4.9/5 — 12,000+ happy sleepers"` avec des etoiles dorees.
Rappel de la preuve sociale du Hero directement dans le contexte d'achat.

**3. Barre de progression livraison gratuite**
Si le seuil est atteint : `"You qualify for FREE shipping!"` avec une barre pleine en or.
Renforce le sentiment de bonne affaire.

**4. Mini-temoignage rotatif**
Un court temoignage (1 ligne) au-dessus du bouton checkout, par exemple :
`"Best pillow I've ever bought!" — Sarah T.`
Change toutes les 5 secondes entre 2-3 temoignages.

**5. Bouton checkout plus rassurant**
Remplacer l'icone ExternalLink (qui suggere "vous quittez le site") par un cadenas Lock + texte "Secure Checkout".

### Fichier modifie
- `src/components/ShopifyCartDrawer.tsx` uniquement
- Traductions ajoutees dans `src/i18n/translations.ts`

### Structure visuelle du drawer apres modification

```text
┌─────────────────────────┐
│  Your Cart (1 item)     │
├─────────────────────────┤
│ ✅ Free shipping + 90d  │  ← nouveau bandeau
│ ⭐ 4.9/5 — 12,000+     │  ← social proof
├─────────────────────────┤
│ [img] Sleep&zy DUO PACK │
│       $59.90            │
├─────────────────────────┤
│ "Best pillow!" —Sarah   │  ← mini temoignage
├─────────────────────────┤
│ Total         $59.90    │
│ [🔒 Secure Checkout]    │  ← Lock au lieu de ExternalLink
│ VISA MC AMEX GPay PP    │
│ 🔐 SSL Encrypted        │
└─────────────────────────┘
```

