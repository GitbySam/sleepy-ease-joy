# Plan — Identifier la cause de l'abandon checkout

## Constat de départ

L'edge function `shopify-analytics` récupère déjà :
- Les commandes payées (`paidOrders`)
- Les **abandoned checkouts** depuis l'API Admin Shopify (visiteurs qui ont atteint la page checkout, parfois rempli leur email, mais n'ont pas payé)
- Pour chaque abandon : email présent ou non, montant, line items, date

Donc on n'a PAS besoin de créer une table `shopify_orders` ni un sync job. La donnée existe déjà.

**Le vrai trou** : on ne sait pas répondre à la question "parmi les X clics sur 'checkout' depuis le site, combien ont :
1. Atteint la page Shopify (= abandoned_checkout créé) ?
2. Rempli leur email (= intention forte) ?
3. Payé (= conversion) ?
4. Disparu sans laisser de trace (= bounce immédiat sur Shopify) ?"

C'est cette segmentation qui dit où est vraiment la fuite.

## Ce qu'on va construire

Un nouvel onglet **"Funnel Checkout"** dans `AdminAnalytics.tsx` qui croise les 3 sources de données déjà disponibles :

```text
                    funnel_events                shopify-analytics
                    (notre site)                 (Shopify Admin API)
                         │                              │
                         ▼                              ▼
                 click_checkout              abandoned_checkouts + paid_orders
                         │                              │
                         └──────────┬───────────────────┘
                                    ▼
                       Tableau de segmentation
```

### Segmentation visée

Pour la période choisie (7 / 30 / 90 jours) :

| Étape | Source | Question répondue |
|-------|--------|-------------------|
| A. Clic checkout | `funnel_events.step = 'click_checkout'` | Combien d'intentions ? |
| B. Page Shopify atteinte | `abandonedCount + paidOrders` | Combien ont vraiment ouvert le checkout ? |
| C. Email saisi | `abandonedWithEmail + paidOrders` | Combien ont commencé à remplir ? |
| D. Paiement | `paidOrders` | Combien ont converti ? |

**Trois taux de drop-off s'affichent** :
- A → B : "Bounce avant Shopify" (problème réseau, redirect cassé, fermeture immédiate)
- B → C : "Bounce sur la landing du checkout" (frais de port shock, devise, méfiance)
- C → D : "Abandon en cours de paiement" (carte refusée, hésitation, comparaison de prix)

Le ratio le plus élevé indique la cause dominante de l'abandon.

## Détails techniques

### 1. Edge function `shopify-analytics` — petit ajout

Ajouter dans la réponse :
```ts
summary: {
  ...existing,
  // Nouveau : count des click_checkout côté funnel_events sur la même période
  // (calculé côté front car on a déjà l'accès à supabase, plus simple que de faire un appel SQL ici)
}
```
En réalité, **aucune modif de l'edge function n'est nécessaire**. On va juste lire `funnel_events` directement depuis l'admin.

### 2. `AdminAnalytics.tsx` — nouvel onglet "Funnel Checkout"

Ajouter un `TabsTrigger` "Funnel Checkout" à côté des onglets existants. Dans le `TabsContent` :

**A. Fetch additionnel** (parallèle au fetch shopify-analytics existant) :
```ts
const { data: clickEvents } = await supabase
  .from('funnel_events')
  .select('id', { count: 'exact', head: true })
  .eq('step', 'click_checkout')
  .gte('created_at', sinceISO);
```

**B. Calculs** (4 nombres + 3 ratios) :
```ts
const clicks = clickEvents.count;
const reached = abandonedCount + paidOrders;
const filledEmail = abandonedWithEmail + paidOrders;
const paid = paidOrders;

const dropBeforeShopify = clicks > 0 ? (clicks - reached) / clicks : 0;
const dropOnLanding   = reached > 0 ? (reached - filledEmail) / reached : 0;
const dropDuringPay   = filledEmail > 0 ? (filledEmail - paid) / filledEmail : 0;
```

**C. UI** :
- 4 KPI cards en ligne (clic → page → email → paiement) avec le nombre et le % du précédent
- 3 cards de drop-off colorées (rouge si > 50 %, ambre si 30-50 %, vert si < 30 %)
- Un verdict en bas : "Cause dominante de l'abandon : [bounce avant Shopify / landing checkout / paiement]"
- Liste des 10 abandons les plus récents avec email (déjà disponible dans `data.abandonedCheckouts`)

**D. Note explicative** sur chaque drop pour le lecteur non-technique :
- "Bounce avant Shopify" → "Le client clique mais n'arrive jamais sur la page de paiement. Causes typiques : popup bloquante, problème réseau, fermeture immédiate."
- "Bounce sur landing checkout" → "Arrivé sur la page Shopify, il repart sans remplir son email. Cause #1 : choc des frais de port, devise inattendue."
- "Abandon en cours de paiement" → "A rempli son email mais n'a pas payé. Cause #1 : carte refusée, hésitation, comparaison de prix."

### 3. Aucune migration de base de données nécessaire

On utilise uniquement les tables existantes (`funnel_events`) et l'edge function existante (`shopify-analytics`).

## Ce que ce plan ne fait PAS (volontairement)

- ❌ Pas de sync des commandes dans une table dédiée → inutile, l'API Shopify répond en temps réel
- ❌ Pas d'attribution visitor_id ↔ commande Shopify → trop fragile (window de 2h, anonyme), pas le bon ROI
- ❌ Pas de tracking de la page checkout Shopify → impossible (boîte noire, comme tu l'as dit)

## Résultat attendu

Après déploiement, tu vas voir un seul onglet qui te dit en 3 chiffres **où est exactement la fuite** :
- Si `dropBeforeShopify` est élevé → problème dans le code de redirection (à régler)
- Si `dropOnLanding` est élevé → problème de positionnement prix / frais de port (à régler côté landing)
- Si `dropDuringPay` est élevé → problème côté Shopify, hors de portée (et tu peux arrêter de t'en faire)

C'est exactement ce qu'il faut pour décider si l'effort suivant doit aller sur le checkout ou sur la landing (84 % bounce).

## Estimation

~1 fichier modifié (`AdminAnalytics.tsx`), ~150 lignes ajoutées, aucune migration, aucune nouvelle table.
