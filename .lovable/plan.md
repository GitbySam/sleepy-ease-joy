# Réparation /admin/analytics : tracking checkout & visibilité des ventes

## Problème

La commande **#1069** (28/05 16h40, payée 34.95 CAD) est bien remontée par l'API Shopify et **comptée** dans :
- Onglet "Ventes Shopify" → total 62 commandes payées / $3036.71 (inclut #1069)
- Onglet "Ventes attribuées" → ligne visible (source = google/organic)

Mais elle **n'apparaît pas dans le funnel** parce que pour ce visiteur, deux events de tracking n'ont jamais été insérés en base :
- `funnel_events.step = 'click_checkout'`
- `checkout_events` (0 ligne pour ce visitor_id)

Le visiteur a pourtant : `add_to_cart` ✅ → puis directement `return_from_checkout` ✅ → puis Shopify a enregistré la vente ✅. Le clic checkout lui-même n'a pas été tracké.

Et dans l'onglet "Ventes Shopify", il n'y a aucune **liste des dernières commandes** — juste des agrégats — donc l'utilisateur ne peut pas confirmer visuellement qu'une vente précise a bien été captée.

## Plan en 3 parties

### 1. Trouver pourquoi `click_checkout` / `checkout_events` ne sont pas loggés

Inspecter le composant qui ouvre le checkout Shopify (probablement `ShopifyCartDrawer.tsx` ou `CheckoutRedirectOverlay.tsx`) pour vérifier :
- Que `trackFunnelStep('click_checkout', …)` est bien appelé **avant** `window.open` / redirection
- Que l'insertion `checkout_events` n'est pas conditionnée à un `displayed=true` côté desktop uniquement (la latency stats laisse penser que c'est opportuniste — peut-être que sur certains parcours rapides, le visiteur quitte avant que le insert async se termine)
- Que l'insert utilise `fetch(..., { keepalive: true })` ou `navigator.sendBeacon` pour survivre à la navigation (sans ça, un `window.location.href = shopifyUrl` tue la requête en vol)
- Que l'event est aussi loggé si checkout s'ouvre dans un **même onglet** (cas mobile / popup bloqué)

Fix attendu : passer les inserts cart_events / checkout_events / funnel_events `click_checkout` en `fetch keepalive: true` ou `sendBeacon` pour garantir qu'ils partent même si la page change immédiatement après.

### 2. Ajouter une "Liste des dernières commandes" dans l'onglet 💰 Ventes Shopify

Dans `SalesTab` (`src/pages/AdminAnalytics.tsx` L1940), ajouter sous la card "Revenus réels" une nouvelle Card "Dernières commandes" :
- 10 commandes les plus récentes (tri par `created_at` desc)
- Colonnes : Date/Heure, N° commande (lien Shopify Admin), Email, Total, Statut, Source (si attribuée)
- Source = `data.attributedOrders` (déjà retourné par l'edge function — pas de nouvel appel)
- Badge vert "✅ Tracké" si on trouve un `checkout_events` correspondant pour ce `visitor_id`, badge ambre "⚠️ Non tracké" sinon — permet de voir d'un coup d'œil les ventes invisibles dans le funnel

### 3. Afficher un compteur de couverture tracking

Sous la liste, une ligne KPI :
- `X / 62 ventes ont un checkout_event correspondant` → ex : "47/62 (76%) ventes trackées correctement"
- Si < 90 %, alerte ambre expliquant que le funnel est sous-évalué

## Détails techniques

- L'edge function `shopify-analytics` retourne déjà tout (orders, ordersByDay, attributedOrders) — aucun changement backend nécessaire pour la partie 2 et 3
- Pour la couverture tracking : un seul `SELECT visitor_id FROM checkout_events WHERE created_at >= since` côté SalesTab, puis intersection en mémoire avec `attributedOrders.map(o => o.visitor_id)`
- Partie 1 : inspection ciblée des call-sites de tracking dans le flow ATC → Checkout

## Ce qui n'est pas inclus

- Pas de modif du schéma DB
- Pas de modif de l'edge function `shopify-analytics`
- Pas de modif des autres onglets (Funnel, Funnel Checkout, Attribution) — ils continueront d'afficher leurs chiffres basés sur les events Supabase

## Résultat

Après ces 3 changements :
- Tu verras la commande #1069 (et toutes les suivantes) explicitement listée dans l'onglet "Ventes Shopify"
- Tu sauras immédiatement quelles ventes ne sont pas trackées côté Supabase (badge ambre)
- Les futures ventes seront trackées correctement dans le funnel (fix sendBeacon/keepalive)
