# Attribution publicitaire Meta — Capture + Dashboard

## Objectif

Savoir précisément quelle **campagne / ad set / créatif Meta** a amené chaque visiteur, et croiser ça avec les **ajouts au panier** et **checkouts** pour mesurer ce qui convertit vraiment.

---

## Phase 1 — Capture & stockage

### 1.1 Nouveau module `src/lib/attribution.ts`
Au tout premier landing du visiteur :
- Parser `window.location.search` pour extraire :
  - `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
  - `fbclid` (Meta), `gclid` (Google bonus), `ttclid` (TikTok bonus)
- Détecter la source si UTM absents : parser `document.referrer` (facebook.com, instagram.com, l.facebook.com, lm.facebook.com → `utm_source=facebook`)
- Stocker dans `localStorage` sous la clé `sleepzy-attribution` avec un timestamp + expiration 30 jours (fenêtre d'attribution standard Meta)
- **First-touch wins** : ne pas écraser une attribution existante non expirée (le 1er clic publicitaire reste celui qui a "amené" le visiteur)
- Exposer `getAttribution()` qui retourne l'objet courant ou `null`

### 1.2 Migration base de données
Ajouter aux 3 tables `funnel_events`, `cart_events`, `checkout_events` les colonnes :
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` (text)
- `fbclid` (text) — l'ID de clic Meta, utile pour relier à CAPI plus tard
- `landing_page` (text) — page d'entrée de la session (utile pour A/B landing)

Index sur `utm_campaign` et `utm_source` pour performance du dashboard.

### 1.3 Injection dans le tracking existant
- `src/lib/funnelTracking.ts` → `getCommonContext()` lit `getAttribution()` et ajoute les champs à chaque insert dans `funnel_events`
- `src/stores/cartStore.ts` (et tout endroit qui insère dans `cart_events`) → ajoute les mêmes champs
- Idem pour l'insert dans `checkout_events`
- Le `endpoint sendBeacon` (checkout) doit aussi inclure ces champs

### 1.4 Bootstrap dans `src/main.tsx`
Appeler `captureAttribution()` **avant** tout autre tracking, dès le chargement.

### 1.5 Recommandation côté Meta Ads Manager
Documenter (dans le chat, pas dans le code) le template d'URL à mettre dans le champ **"URL Parameters"** de chaque ad Meta :
```
utm_source=facebook&utm_medium=paid&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}
```
Comme ça les noms réels des campagnes/ad sets/créatifs remonteront automatiquement.

---

## Phase 2 — Dashboard `/admin/analytics`

Nouvel onglet ou nouvelle section **"Attribution"** dans `src/pages/AdminAnalytics.tsx` :

### 2.1 KPIs en haut
- Total sessions par source (Direct / Facebook / Instagram / Google / Autre)
- % de sessions venant de pubs payantes (utm_medium = paid)

### 2.2 Tableau "Performance par campagne"
Colonnes : `utm_campaign` · Sessions · Ajouts panier · Checkouts · Taux conv. ajout · Taux conv. checkout
Tri par défaut : checkouts décroissants. Filtre période (7j / 30j / custom).

### 2.3 Tableau "Performance par créatif" (drill-down)
Quand on clique sur une campagne → vue par `utm_content` (= nom du créatif) avec mêmes colonnes.

### 2.4 Graphique tendance
Courbe ajouts panier / checkouts par source sur 30 jours (Recharts, cohérent avec le dashboard existant).

### 2.5 Vue "Visiteurs sans attribution"
Petit encart listant le volume de sessions sans UTM ni fbclid → utile pour mesurer le trafic organique / direct.

---

## Détails techniques

**Format `localStorage`** :
```json
{
  "utm_source": "facebook",
  "utm_campaign": "spring_sale",
  "utm_content": "video_v3",
  "fbclid": "IwAR0...",
  "landing_page": "/",
  "captured_at": 1748000000000,
  "expires_at": 1750592000000
}
```

**Requêtes SQL types** (côté dashboard, via `supabase.from(...).select(...)`):
- Agrégation par `utm_campaign` avec count distinct sur `visitor_id`
- JOIN logique entre `funnel_events` (sessions) et `cart_events` / `checkout_events` via `visitor_id`

**Fichiers touchés** :
- ➕ `src/lib/attribution.ts` (nouveau)
- ✏️ `src/main.tsx` (bootstrap)
- ✏️ `src/lib/funnelTracking.ts` (inclure attribution)
- ✏️ `src/stores/cartStore.ts` (inclure attribution dans cart_events)
- ✏️ Insert checkout (vérifier où il est fait — probablement `CtaBridge.tsx` ou `CheckoutRedirectOverlay.tsx`)
- ✏️ `src/pages/AdminAnalytics.tsx` (nouvelle section Attribution)
- 🗄️ Migration : 3 ALTER TABLE + 2 index

---

## Ce qui sera livré

1. Toute nouvelle visite venant d'une pub Meta (avec UTM correctement configurés côté Ads Manager **ou** simplement avec `fbclid`) sera taggée et le tag suivra le visiteur jusqu'au checkout.
2. Tu pourras répondre dans `/admin/analytics` à : *"quelle pub Meta a généré le plus d'ajouts au panier cette semaine ?"* et *"quel créatif convertit le mieux ?"*
3. Les données existantes (avant la migration) resteront `NULL` sur ces nouvelles colonnes — l'attribution commence à la mise en prod.

## Hors scope (pour plus tard si tu veux)

- Meta CAPI (Conversions API) côté serveur via Edge Function — bypasse les ad-blockers et améliore la précision de Meta Ads Manager. Demande un Access Token Meta long-lived.
- Vue ROI réelle (revenu / dépense ad) — nécessiterait d'importer les coûts depuis Meta Ads API.
