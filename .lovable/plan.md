# Réparation du dashboard /admin/analytics

## Problème constaté

Les données sont bien en base (181 checkouts sur 30j, 35 aujourd'hui, paniers cohérents jusqu'à $161) mais le dashboard affiche **0 checkouts initiés**, **0% conversion**, **100% abandon**.

**Cause** : lors du dernier tour, j'ai changé la définition de "checkout" pour ne compter que les lignes avec `displayed = true`. Or le mécanisme de détection d'affichage (basé sur `visibilitychange` + setTimeout de 8s) ne se déclenche presque jamais en production :
- Sur mobile/Shopify, le navigateur décharge souvent la page d'origine avant que le code de "flush" ne s'exécute
- Aucune des 181 lignes en base n'a `displayed = true`

**Conséquence** : KPIs faux et anxiogènes alors que les ventes ont bien lieu.

## Décision

Revenir à la sémantique simple et fiable : **un checkout = un clic enregistré côté serveur**. C'est ce qui correspond à la réalité business (intent réel d'achat) et c'est ce que mesurent Shopify Analytics et Meta Pixel.

La latence reste utile mais devient une **métrique bonus** non bloquante, affichée seulement si on a des données.

## Changements

### 1. `src/pages/AdminAnalytics.tsx` — Onglet Funnel

- **Renommer** "Checkouts affichés (page Shopify chargée)" → **"Checkouts initiés"** (compte tous les events `checkout_events`, peu importe `displayed`)
- **KPI principal "CHECKOUTS INITIÉS"** dans la bannière violette : utiliser `total_checkouts` (= COUNT(*)) au lieu de `COUNT(*) WHERE displayed=true`
- **Taux de conversion** : recalculer sur tous les checkouts (pas seulement ceux affichés)
- **Abandon panier** : recalculer pareil
- **Latence p50/p95** : garder la section mais
  - Ne calculer que sur les lignes où `display_latency_ms IS NOT NULL`
  - Si 0 ligne avec latence : afficher "Données insuffisantes" au lieu d'un tiret cassé
  - Retirer la phrase culpabilisante "X clics sur Checkout n'ont pas abouti à un affichage détecté" (elle est trompeuse car c'est le tracking qui est limité, pas les utilisateurs qui abandonnent)
- **Funnel par visiteur unique** : pareil, dédoublonner sur tous les checkouts, pas seulement displayed

### 2. `src/components/ShopifyCartDrawer.tsx` — Simplifier le tracking

- **Garder** : insertion immédiate du `checkout_event` au clic (c'est ce qui marche)
- **Garder mais rendre best-effort** : la mesure de latence via `visibilitychange` (utile sur desktop quand ça marche, pas grave quand ça marche pas)
- **Retirer** : le fallback `setTimeout(8000)` qui marque artificiellement `displayed=false` (il pollue les données)
- **Logique** : `displayed` reste à `false` par défaut. Il passe à `true` UNIQUEMENT si on capture vraiment l'événement `visibilitychange → hidden`. Sinon on ne touche pas la ligne.

### 3. Note mémoire

Mettre à jour `mem://features/admin-dashboard` pour documenter :
- "Checkouts initiés" = tous les clics enregistrés (source de vérité business)
- `displayed` / `display_latency_ms` = métriques opportunistes desktop uniquement, à ne JAMAIS utiliser comme dénominateur principal

## Détails techniques

```text
Avant (cassé) :
  KPI Checkouts = COUNT(*) WHERE displayed=true   →  toujours 0
  Conversion    = displayed / cart_adds           →  toujours 0%

Après (correct) :
  KPI Checkouts = COUNT(*) sur checkout_events    →  35 aujourd'hui
  Conversion    = checkouts / cart_adds           →  ~chiffre réaliste
  Latence p50   = percentile sur display_latency_ms WHERE NOT NULL (info bonus)
```

Pas de migration SQL nécessaire — les colonnes `displayed` et `display_latency_ms` existent déjà et restent utilisables pour la latence opportuniste.

## Résultat attendu

Vous rouvrez `/admin/analytics` → onglet Funnel → vous voyez immédiatement vos **35 checkouts initiés aujourd'hui** et un taux de conversion cohérent avec la réalité de vos ventes Shopify de ce matin.
