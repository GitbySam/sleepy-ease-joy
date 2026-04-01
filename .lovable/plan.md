

# Optimisations Mobile pour Maximiser la Conversion

## Constat actuel
Sur mobile (390px), plusieurs points freinent la conversion :
- Le Hero prend beaucoup d'espace vertical sans CTA immédiatement visible (il faut scroller)
- Pas de bouton d'achat flottant/sticky visible en permanence
- Le header mobile affiche les drapeaux de langues qui prennent de la place utile
- Les sections sont très espacées (py-24) ce qui rallonge le parcours
- Pas de barre de progression/urgence visible en continu

## Plan d'implémentation

### 1. Bouton CTA sticky en bas de l'écran (mobile uniquement)
Ajouter un composant `StickyMobileCTA` qui apparaît dès que l'utilisateur scrolle au-delà du Hero. Bouton plein écran en bas avec le prix barré + prix promo + texte CTA. Visible uniquement sur mobile (`md:hidden`). Se masque quand le BundleOffer est visible à l'écran.

**Fichier** : `src/components/StickyMobileCTA.tsx` (nouveau)
**Modif** : `src/pages/Index.tsx` — ajouter le composant

### 2. Réduire les espacements sur mobile
Passer les sections de `py-24` à `py-14 md:py-24` pour réduire le temps de scroll et exposer plus vite le contenu de conversion (témoignages, offre bundle).

**Fichiers** : `ComparisonSlider.tsx`, `Benefits.tsx`, `BundleOffer.tsx`, `FAQ.tsx`, `Testimonials.tsx`, `InAction.tsx`

### 3. Hero mobile plus compact
- Réduire le `min-h-[80vh]` à `min-h-[60vh]` sur mobile pour que le CTA et les étoiles soient visibles sans scroller
- Réduire la taille de l'image produit sur mobile
- Remonter le CTA visuellement

**Fichier** : `src/components/Hero.tsx`

### 4. Header mobile simplifié
Masquer les drapeaux de langues derrière un menu hamburger ou les réduire à un seul icône globe sur mobile, libérant l'espace pour le logo et le panier.

**Fichier** : `src/components/Header.tsx`

### 5. Ajout d'une barre d'urgence/rareté persistante
Ajouter sous le sticky CTA mobile un texte dynamique type "🔥 147 personnes regardent ce produit" ou un countdown timer pour créer l'urgence.

**Fichier** : intégré dans `StickyMobileCTA.tsx`

### 6. Traductions
Ajouter les nouvelles clés dans `src/i18n/translations.ts` (sticky CTA text, urgence text) en EN/FR/ES.

---

**Résumé** : 6 modifications ciblées pour raccourcir le parcours mobile, garder le CTA toujours visible, et ajouter de l'urgence — les 3 leviers les plus impactants sur la conversion mobile.

