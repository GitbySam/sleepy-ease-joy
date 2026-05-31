## Objectif

Le sticky "Shop Now" mobile ajoute actuellement automatiquement le **Sleep Kit ($19.95)** en plus de l'oreiller Single Grey ($34.95), gonflant le panier à $54.90 sans consentement. On retire cet ajout automatique. Le Sleep Kit reste disponible **en opt-in** via la carte d'upsell déjà présente dans le drawer ("Complete your sleep experience").

## Changements

### `src/components/StickyMobileCTA.tsx`

1. **Supprimer le fetch parallèle du Sleep Kit** — ne fetcher que le produit oreiller.
2. **Supprimer le bloc "Add Sleep Kit"** qui appelle `addItem({ bundleLabel: "Sleep Kit", ... })`.
3. **Tracking** — remettre `value` et `contentName` à la valeur de l'oreiller seul :
   - `contentName: "1 Sleep&zy (Grey)"`
   - `value: prices.single` (au lieu de `prices.single + prices.sleepKit`)
4. **Garder** : la sélection du variant Single + Grey, l'ajout de l'oreiller, l'ouverture du drawer, le spinner `busy`, et la gestion d'erreurs.

### Aucun autre fichier touché

- `ShopifyCartDrawer.tsx` — déjà OK : la carte d'upsell Sleep Kit s'affiche dès qu'un pack Sleep&zy est dans le panier (`showSleepKit = hasSleepzyPack && !hasSleepBundle`), avec boutons +/− pour l'ajouter volontairement.
- Pas de changement de copy ni de pricing.

## Résultat attendu

- Clic sur le sticky "Shop Now" → panier contient **1× Sleep&zy Single Grey à $34.95**, total **$34.95 CAD**.
- Le client voit la carte "✨ Complete your sleep experience" avec le Sleep Kit à $19.95 et peut l'ajouter d'un clic sur le `+` s'il le souhaite.
- Aucune régression pour les autres CTA (BundleOffer, page produit) qui n'ajoutaient déjà pas le Sleep Kit automatiquement.
