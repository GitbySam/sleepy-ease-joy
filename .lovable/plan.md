

## Remplacer l'image Hero par la vidéo demo

### Concept
Utiliser `demo-video.mp4` (actuellement dans la section "Sleep with dignity") comme fond vidéo du Hero, en remplacement de `hero-banner.jpg`. La vidéo tourne en boucle, muette, en autoplay — exactement comme les sites e-commerce premium.

### Modifications — fichier unique : `src/components/Hero.tsx`

**Mobile Hero :**
- Remplacer le `<img src={heroBanner}>` par un `<video>` avec `autoPlay`, `loop`, `muted`, `playsInline`
- Source : `demoVideo` (import existant dans le projet via `@/assets/demo-video.mp4`)
- Conserver le badge "Best Seller" et le compteur live en overlay
- Garder le même ratio `aspect-[4/3]` et `object-cover`

**Desktop Hero :**
- Remplacer le `<img src={heroBanner}>` par un `<video>` identique
- Conserver le gradient overlay `bg-gradient-to-r from-background via-background/70 to-background/20`
- Conserver `object-cover` et le positionnement plein écran

**Import :**
- Ajouter `import demoVideo from "@/assets/demo-video.mp4"`
- Supprimer `import heroBanner` (devenu inutile)

### Considérations techniques
- `playsInline` est essentiel pour iOS (sinon la vidéo s'ouvre en plein écran)
- `muted` est requis pour l'autoplay sur tous les navigateurs
- Poster fallback : on peut garder `heroBanner` comme attribut `poster` de la balise `<video>` pour afficher l'image pendant le chargement — meilleure UX

### Résultat attendu
Un Hero dynamique et engageant avec la vidéo de démo du produit en fond, tout en conservant les overlays texte, badges et CTA existants.

