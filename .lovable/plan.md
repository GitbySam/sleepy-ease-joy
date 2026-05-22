## Contexte

La section "Our customers speak for us / Nos clients parlent pour nous" se trouve dans `src/pages/Product.tsx` (galerie carousel de 9 photos en `allPhotos`, lignes ~470 et ~810).

Les photos clients ajoutées précédemment (`testimonial-mike`, `testimonial-james`, `testimonial-alex`, `testimonial-sophie`) ne vivent que dans le composant `Testimonials.tsx` — d'où le fait qu'elles n'apparaissent pas dans cette galerie.

## Modifications

1. **Optimiser la nouvelle photo uploadée** (femme avec Sleep&zy en avion)
   - Convertir `ChatGPT_Image_22_mai_2026_13_52_35.png` en WebP carré (~800×800, qualité ~78) via ffmpeg
   - Sauvegarder dans `src/assets/customer-plane-woman.webp` (cible < 100 Ko, cohérent avec la mémoire `media-optimization`)

2. **Mettre à jour la galerie `allPhotos`** dans `src/pages/Product.tsx` (les 2 blocs desktop + mobile, lignes 471 et ~810)
   - Insérer la nouvelle photo en **4ᵉ position**
   - Ajouter à la suite les 4 photos clients déjà importées : `testimonial-james`, `testimonial-mike`, `testimonial-alex`, `testimonial-sophie` (réutilisation directe, déjà optimisées WebP)
   - Nouvel ordre (13 photos) :
     ```
     1. inUse1
     2. inUsePlane4
     3. inUse2
     4. customer-plane-woman  ← NOUVELLE
     5. inUse3
     6. inUseCar
     7. inUsePlane
     8. inUsePlane2
     9. inUseCar2
     10. inUsePlane3
     11. testimonial-james
     12. testimonial-mike
     13. testimonial-alex
     14. testimonial-sophie
     ```
   - Imports ajoutés en haut du fichier

3. **Aucune autre logique modifiée** — le carousel gère déjà `visibleCount=5` avec flèches prev/next, donc plus de photos = plus de scroll, sans régression.

## Validation

- Vérifier visuellement /product (desktop + mobile) que la nouvelle photo est bien 4ᵉ et que les 4 visages clients apparaissent en fin de carousel
- Vérifier la taille du fichier WebP généré (< 100 Ko)
