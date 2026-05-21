## Objectif
Instrumenter l'ouverture du checkout pour distinguer `click → ouvert avec succès` vs `popup bloqué → fallback même onglet`, mesurer la latence, et exposer un nouveau compteur dans `/admin/analytics`.

## 1. Tracking côté code

**`src/lib/funnelTracking.ts`** — ajouter 2 nouveaux steps au type `FunnelStep` :
- `checkout_opened` — popup ouvert dans nouvel onglet OK
- `checkout_popup_blocked` — popup bloqué, fallback `window.location.href` (même onglet)

**`src/components/ShopifyCartDrawer.tsx`** (`handleCheckout`) — après le `window.open('about:blank', '_blank')` synchrone, mesurer `latencyMs = Date.now() - clickTs` et envoyer :
- `trackFunnelStep('checkout_opened', { value, currency, metadata: { latencyMs, mode: 'new_tab' } })` si `popup && !popup.closed`
- `trackFunnelStep('checkout_popup_blocked', { value, currency, metadata: { latencyMs, mode: 'same_tab_fallback' } })` sinon (en plus du `trackFriction` déjà présent)

Le `clickTs` est capturé en tout début de handler.

## 2. Admin analytics — nouveau compteur

**`src/pages/AdminAnalytics.tsx` → `CheckoutFunnelTab`** :
- Ajouter 2 requêtes `count` en parallèle des existantes sur `funnel_events` : `checkout_opened` et `checkout_popup_blocked`
- Insérer une nouvelle ligne au-dessus des 4 cards du funnel : **"Ouverture checkout"** avec 3 KPIs :
  - Popup ouvert (nouvel onglet) — vert
  - Popup bloqué (fallback même onglet) — orange
  - Taux de blocage = `blocked / (opened + blocked) × 100`
- Mettre à jour la note méthodologie pour expliquer ces nouvelles métriques

## Hors périmètre
- Pas de modif de la logique d'ouverture (déjà optimisée : pré-open sync + fallback)
- Pas de modif de `CheckoutRedirectOverlay` (failsafe 12s + visibilitychange OK)
- Pas de nouvelle table : on réutilise `funnel_events`

## Fichiers touchés
- `src/lib/funnelTracking.ts` (ajout 2 valeurs au type)
- `src/components/ShopifyCartDrawer.tsx` (~10 lignes dans `handleCheckout`)
- `src/pages/AdminAnalytics.tsx` (~30 lignes dans `CheckoutFunnelTab`)
