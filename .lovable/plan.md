# Redirection vers /product à la fermeture du panier

## Objectif
Quand l'utilisateur ferme le drawer du panier juste après avoir fait un ajout au panier depuis la home (ou tout autre page hors `/product`), le rediriger automatiquement vers `/product` (en conservant la variante/couleur sélectionnée si possible).

Si l'utilisateur ouvre le panier manuellement (clic sur l'icône panier) sans ATC récent, ou si l'ATC vient déjà de `/product`, la fermeture ne déclenche aucune redirection.

## Comportement

- ATC depuis Hero / Header / StickyCTA / ShopifyProducts (landing) → ouverture auto du panier → à la fermeture (X, overlay, Escape) → redirection vers `/product?color=<couleur ajoutée>`.
- ATC depuis `/product` → fermeture du panier → reste sur place.
- Ouverture manuelle du panier (icône header) sans ATC récent → fermeture → reste sur place.
- Clic sur "Secure Checkout" → flux Shopify normal, **aucune** redirection produit (la fermeture du drawer dans ce cas ne déclenche pas non plus la redirection).

## Implémentation

### 1. `src/stores/cartStore.ts`
- Ajouter un flag éphémère `pendingProductRedirect: { color?: string } | null` dans le store (non persisté).
- Dans `addItem`, après un ajout réussi, si `window.location.pathname !== '/product'` et `pathname !== '/product/...'`, set `pendingProductRedirect = { color: item.selectedOptions?.find(o => o.name === 'Color')?.value }`.
- Setter dédié `consumePendingRedirect()` qui retourne la valeur et la remet à `null`.
- Si l'utilisateur clique Checkout, on appelle `consumePendingRedirect()` pour l'effacer sans rediriger.

### 2. `src/components/ShopifyCartDrawer.tsx`
- Au moment de la fermeture (handler `onClose` partagé par X, overlay, Escape), lire `pendingProductRedirect`. Si présent et qu'on n'est pas déjà sur `/product` :
  - `navigate('/product' + (color ? '?color=' + encodeURIComponent(color) : ''))`
  - puis `consumePendingRedirect()`.
- Le bouton Checkout appelle `consumePendingRedirect()` avant l'ouverture Shopify pour éviter une redirection parasite lors de la fermeture qui suit.

### 3. Détails techniques
- Utiliser `useNavigate` de react-router (déjà utilisé ailleurs).
- Le flag est volontairement éphémère (non persisté via `partialize`) pour ne pas survivre à un refresh.
- Aucune modification de la logique Shopify, du tracking ou des prix.

## Fichiers touchés
- `src/stores/cartStore.ts` (ajout du flag + helpers)
- `src/components/ShopifyCartDrawer.tsx` (consommation du flag à la fermeture et au checkout)

## Hors scope
- Pas de changement sur le CartDrawer legacy (`src/components/CartDrawer.tsx`) qui n'est pas le drawer actif.
- Pas de changement des CTA, du tracking, ni du flux checkout.
