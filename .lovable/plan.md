
# Refonte `/admin/analytics`

Page unique, focus **"est-ce que mon produit se vend bien ?"**. On rase les 5 onglets actuels (Funnel, Funnel Checkout, Shopify, Cart Events, Other) et l'ancien layout.

## Structure de la page

```text
┌─────────────────────────────────────────────────────────┐
│  Sleep&zy — Performance produit          [↻ Actualiser] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Carte 1] REVENU 7 DERNIERS JOURS                      │
│   $X XXX CAD     XX commandes payées     AOV $XX        │
│   ▲ +12% vs moyenne 30j                                 │
│                                                         │
│  [Carte 2] CONVERSION 7 DERNIERS JOURS                  │
│   X.XX %     (XX achats / XXXX visiteurs)               │
│   ▲ +0.4 pts vs moyenne 30j                             │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  TABLEAU COMPARATIF — moyennes journalières             │
│                                                         │
│  KPI                  | 7j     | moy 14j | moy 30j | moy 90j │
│  ─────────────────────┼────────┼─────────┼─────────┼─────────│
│  Revenu / jour        | $XXX   | $XXX    | $XXX    | $XXX    │
│  Commandes / jour     | X.X    | X.X     | X.X     | X.X     │
│  AOV                  | $XX    | $XX     | $XX     | $XX     │
│  Visiteurs / jour     | XXX    | XXX     | XXX     | XXX     │
│  Conversion %         | X.XX%  | X.XX%   | X.XX%   | X.XX%   │
│                                                         │
│  Chaque cellule "7j" affiche un badge ▲/▼ vs la moy 30j │
├─────────────────────────────────────────────────────────┤
│  FUNNEL — 7 derniers jours                              │
│                                                         │
│   Visiteurs       XXXX   ████████████████████  100%     │
│   Vue produit     XXXX   ███████████████        78%     │
│   Add to cart      XXX   ██████                 22%     │
│   Checkout         XX    ███                    8%      │
│   Achat payé       XX    █                      2.1%    │
│                                                         │
│   Sous chaque étape : drop-off % vs étape précédente    │
│   + même ligne en gris pour la moyenne 30j (comparaison)│
├─────────────────────────────────────────────────────────┤
│  TENDANCE 90 JOURS — Recharts                           │
│   Line chart : revenu/jour (barres) + conversion (ligne)│
└─────────────────────────────────────────────────────────┘
```

## Données & sources

Tout vient de ce qui est **déjà branché** — pas de nouvelle clé API à demander.

| Donnée | Source |
|---|---|
| Revenu payé, commandes, AOV | Edge function `shopify-analytics` (déjà existante) |
| Visiteurs uniques | `funnel_events` (Supabase) — `step = 'page_view'`, distinct `visitor_id` |
| Vue produit | `funnel_events` — `step = 'view_content'` |
| Add to cart | `cart_events` |
| Checkout initié | `checkout_events` |
| Achat payé | `shopify-analytics` (orders `financial_status = paid`) |

## Logique de calcul

- **Période 7j** = 7 jours calendaires précédents (J-7 → J-1 minuit local Canada).
- **Moyennes 14j / 30j / 90j** = total sur la fenêtre ÷ nombre de jours → valeur moyenne par jour, comparable aux "par jour" de la colonne 7j.
- **Variation %** affichée sur la colonne 7j uniquement, calculée contre la moy 30j (vert si > +3%, rouge si < -3%, gris sinon).

## Implémentation technique

1. **Étendre `shopify-analytics`** pour accepter `?days=90` et renvoyer les orders bruts (déjà le cas), puis côté client je bucket par jour pour reconstruire 7/14/30/90.
2. **Nouveau hook** `useProductPerformance()` dans `src/pages/AdminAnalytics.tsx` :
   - Fetch parallèle : `shopify-analytics?days=90`, `funnel_events` (90j), `cart_events` (90j), `checkout_events` (90j).
   - Agrège en mémoire par jour → calcule 7j / moy 14j / moy 30j / moy 90j pour chaque KPI.
3. **Réécriture complète de `src/pages/AdminAnalytics.tsx`** :
   - Suppression de `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` et de tous les onglets actuels.
   - 4 sections : 2 cartes KPI hero, tableau comparatif, funnel visuel, chart 90j.
   - Composants : `Card` shadcn, `Table` shadcn, `Recharts` (`BarChart` + `Line`).
4. **Pas de migration DB** — tout existe déjà (`cart_events`, `checkout_events`, `funnel_events`, `user_roles`).
5. **Pas de nouvelle edge function**. La seule éventuelle modif côté serveur : si la requête 90j fait timeout, je rajouterai un index sur `funnel_events(created_at, step)` via migration.

## Hors scope (explicitement)

- Meta Ads, ROAS, CPA, CTR — pas connecté, et tu n'as pas demandé à brancher.
- Microsoft Clarity — pas d'API exploitable, juste un lien dans le header vers le dashboard Clarity.
- Détail par produit / par variant — un seul produit hero (le travel pillow), donc inutile.
- Liste des commandes récentes / debug raw — supprimé (tu as dit "rase tout").

## Fichiers touchés

- `src/pages/AdminAnalytics.tsx` — réécriture complète (~400 lignes → ~350 lignes).
- `supabase/functions/shopify-analytics/index.ts` — petite modif pour accepter `days=90` proprement (déjà supporté en fait, à vérifier).

Pas d'autre fichier modifié. Pas de nouvelle dépendance.
