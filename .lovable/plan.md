

## Centrage du popup d'inactivité

Le popup d'inactivité (`InactivityPopup.tsx`) utilise actuellement `left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2` pour le centrage, ce qui peut être peu fiable sur certains navigateurs/viewports.

**Correction :** Remplacer par la même approche que l'UpsellPopup — un conteneur `fixed inset-0 flex items-center justify-center` qui centre le popup de manière fiable via flexbox, au lieu du positionnement par `translate`.

**Fichier modifié :** `src/components/InactivityPopup.tsx`
- Remplacer le `motion.div` du popup : retirer `left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2` et utiliser `inset-0 flex items-center justify-center p-4`
- Wrapper le contenu dans un `div` avec `w-[90vw] max-w-sm` pour conserver la largeur

