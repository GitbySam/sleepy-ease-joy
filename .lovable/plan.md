## Problème

L'affichage des chiffres dans la landing page a été corrigé en ajoutant `data-clarity-unmask="true"` sur le wrapper `<div>` de `src/pages/Index.tsx`. Mais le panier (`ShopifyCartDrawer`) est rendu via un **portal Radix Sheet**, donc il sort du DOM de Index.tsx et l'attribut Clarity ne s'y applique pas. Résultat : Clarity continue de masquer les chiffres (prix, quantités, total) dans les enregistrements du panier.

La classe `font-numeric-safe` est déjà appliquée sur les prix du panier — le rendu est OK pour les vrais utilisateurs, c'est uniquement Clarity (et donc tes screenshots de session) qui voit des blocs/tirets à la place des chiffres.

## Correctif

Ajouter `data-clarity-unmask="true"` sur le contenu portalé du panier :

1. **`src/components/ShopifyCartDrawer.tsx`** — ajouter `data-clarity-unmask="true"` sur `<SheetContent>` (panier principal utilisé sur landing + page produit).
2. **`src/components/CartDrawer.tsx`** — ajouter `data-clarity-unmask="true"` sur le `motion.div` du drawer (panier legacy, par sécurité au cas où il est encore monté quelque part).
3. **`src/components/UpsellPopup.tsx`** (si présent en portal) — vérifier et appliquer le même attribut sur son conteneur racine pour que les prix d'upsell soient aussi visibles dans Clarity.

Aucune modification de logique, de prix ou de style — uniquement l'attribut d'unmask Clarity.

## Vérification

Après publication, contrôler dans un nouvel enregistrement Clarity que les chiffres du panier (prix unitaire, quantité, total) sont lisibles au lieu d'être masqués.
