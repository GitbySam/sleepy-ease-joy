## Diagnostic — pourquoi la commande 1076 est "direct"

Le cart envoie à Shopify (`note_attributes`) :
- `_sleepzy_utm_source`, `_sleepzy_utm_campaign`, `_sleepzy_fbclid` (depuis `localStorage` — `captureAttribution`)
- `_sleepzy_fbp`, `_sleepzy_fbc` (depuis les cookies `_fbp` / `_fbc` posés automatiquement par le Pixel Meta)

Le dashboard `/admin/analytics` (ligne 515 de `AdminAnalytics.tsx`) calcule la source ainsi :
```
const source = o.utm_source || (o.fbclid ? "facebook" : "(direct)");
```
→ Si `utm_source` ET `fbclid` sont absents, c'est "direct" — **même quand `_fbc` est présent**.

Or `_fbc` ("Facebook Click ID", format `fb.1.<timestamp>.<fbclid>`) est posé par le Pixel uniquement quand l'utilisateur arrive via un clic d'annonce Meta. C'est **le signal d'attribution Meta le plus fiable**.

Pour la commande 1076, l'utilisateur a cliqué une pub Meta (cookie `_fbc` posé), mais `captureAttribution` n'a pas re-stocké le `fbclid` (probablement parce qu'une attribution antérieure existait déjà ou que la capture s'est faite sur une nav SPA sans re-lecture des params). Résultat : le webhook reçoit bien `_sleepzy_fbc` mais pas `_sleepzy_fbclid` ni `_sleepzy_utm_source` → le dashboard tombe sur "direct".

## Correctifs

### 1. Edge function `shopify-analytics` — exposer fbp/fbc et extraire fbclid depuis fbc

Dans le `attributedOrders.map`, ajouter :
- `fbp: get('fbp')`
- `fbc: get('fbc')`
- Si `fbclid` est null mais `fbc` existe, parser `fb.1.<ts>.<fbclid>` pour récupérer le `fbclid` original.

### 2. `AdminAnalytics.tsx` — logique de source enrichie

Mettre à jour le type `AttributedOrder` (ajout `fbp`, `fbc`) puis remplacer partout :
```ts
const source = o.utm_source || (o.fbclid ? "facebook" : "(direct)");
```
par un helper :
```ts
const resolveSource = (o) => {
  if (o.utm_source) return o.utm_source;
  if (o.fbclid || o.fbc) return "facebook"; // fbc = clic d'annonce Meta
  if (o.fbp) return "facebook (organic/retargeting)"; // visite sans clic ad
  return "(direct)";
};
```

Et dans le filtre "Meta only" (lignes 534/537), inclure aussi `!!o.fbc` :
```ts
(o.utm_source || "").toLowerCase() === "facebook" || !!o.fbclid || !!o.fbc
```

Garder une distinction visuelle dans le tableau "Ventes récentes" :
- Badge "Meta Ad" si `utm_source=facebook` ou `fbclid` ou `fbc`
- Badge "Meta (pixel only)" si uniquement `fbp` sans `fbc`
- Sinon "Direct"

### 3. Mention dans le guide du dashboard

Ajouter une ligne expliquant que les ventes avec `_fbc` mais sans `utm_*` sont attribuées à Meta (clic publicitaire détecté via le cookie Pixel), même si le `fbclid` n'a pas survécu dans `localStorage`.

## Fichiers touchés
- `supabase/functions/shopify-analytics/index.ts` (ajout fbp/fbc + fallback fbclid)
- `src/pages/AdminAnalytics.tsx` (type, helper resolveSource, filtre Meta, légende)

Aucune modification du flux d'achat, du webhook, ou de la capture côté client — uniquement la lecture/affichage admin.