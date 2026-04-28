# Renommer "Checkout initié" → mesurer "Checkout affiché"

## Contexte

Aujourd'hui dans `ShopifyCartDrawer.tsx`, dès le clic sur "Secure Checkout" :
- on insère une ligne dans `checkout_events` (Supabase)
- on track `InitiateCheckout` (Meta Pixel)
- puis on fait `window.open(finalUrl, '_blank')`

→ C'est un **clic d'intention**, pas une preuve que la page Shopify s'est affichée. Si la page met 5s à charger ou si l'onglet est bloqué par le navigateur, on compte quand même.

## Problème de fond

On ne peut pas savoir de manière fiable, depuis notre app, si la page checkout Shopify s'est **réellement affichée** chez l'utilisateur :
- l'onglet checkout est sur un autre domaine (`checkout.sleepenzy.com` / `*.myshopify.com`) → pas d'accès cross-origin
- `window.open()` retourne une référence mais on ne peut pas lire `readyState` cross-origin
- Shopify ne nous notifie pas du chargement

## Solutions possibles (à choisir)

### Option A — Mesure de latence côté Storefront API (recommandé, sans dev Shopify)
Renommer la métrique en **"Checkout prêt"** et la logger seulement quand l'URL checkout est **disponible et ouverte**. Aujourd'hui, `getCheckoutUrl()` est déjà mis en cache au moment de l'`addItem`, donc l'URL est instantanée. Le vrai goulot, c'est le **temps de chargement** de la page Shopify côté navigateur.

On ajoute un **timing** :
1. Au clic : enregistrer `clickedAt = performance.now()`, ouvrir l'onglet, **ne pas** logger encore
2. Surveiller `document.visibilitychange` : quand l'utilisateur **revient** sur notre onglet, on sait que le checkout s'est affiché (l'onglet est passé en arrière-plan ≥ X ms)
3. Logger alors `checkout_events` avec un champ `display_latency_ms` = temps entre clic et changement de visibilité
4. Si l'utilisateur ne revient jamais → log après timeout (ex. 8s) avec un flag `displayed: false/unknown`

Renommer dans le dashboard `AdminAnalytics.tsx` :
- "Checkouts initiés" → **"Checkouts affichés"**
- "Bar dataKey checkout" garde le nom interne, label change
- Ajouter une carte **"Latence médiane d'affichage"** (p50/p95)

### Option B — Renommage simple uniquement
Juste renommer "initié" → "affiché" dans l'UI Admin sans changer la logique. Honnête seulement si on accepte que c'est une approximation. **Pas recommandé** si tu suspectes vraiment de la lenteur — ça masquerait le problème.

### Option C — Ajout d'un `Script Tag` Shopify (le plus précis, mais demande accès Admin)
Installer un petit script JS sur le thème checkout Shopify qui ping un endpoint Supabase (`checkout_displayed`) au `DOMContentLoaded`. Nécessite :
- token Admin avec scope `write_script_tags`
- une edge function Supabase publique pour recevoir les pings

## Changements de code (Option A)

### `src/components/ShopifyCartDrawer.tsx`
- Ajouter `const clickedAtRef = useRef<number | null>(null)`
- Dans `handleCheckout` : stocker `performance.now()`, ne plus insérer dans `checkout_events` immédiatement
- Ajouter un `useEffect` qui écoute `visibilitychange` :
  - quand `document.hidden === true` puis `false` après le clic, on calcule la latence et on insère le row avec `displayed: true, display_latency_ms: ...`
- Garder `trackInitiateCheckout` (Meta) au clic — c'est ce que Meta attend de toute façon

### Migration Supabase
Ajouter colonnes à `checkout_events` :
- `displayed boolean default false`
- `display_latency_ms integer null`

### `src/pages/AdminAnalytics.tsx`
- Filtrer `checkout_events` sur `displayed = true` pour le KPI principal
- Renommer label : "Checkouts initiés" → **"Checkouts affichés"**
- Bar chart : `name="Checkouts affichés"`
- Nouvelle carte KPI : **"Latence médiane d'affichage"** (p50) + p95
- Le taux de conversion `conversionRate` utilise désormais checkouts affichés / paniers (plus honnête)

### `mem://features/admin-dashboard`
Mettre à jour pour refléter la nouvelle métrique et la mesure de latence.

## Question pour toi

Confirme l'option (A, B ou C) avant que je passe en mode build.
