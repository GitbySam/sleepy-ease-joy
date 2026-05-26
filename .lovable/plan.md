## Objectif

Corriger les 6 failles de sécurité signalées **sans casser** le site public ni le tracking analytics. Les visiteurs continuent de naviguer et de générer des événements (cart, funnel, etc.) exactement comme avant. Seul l'accès aux **données** analytics et au **dashboard admin** devient protégé.

## Failles à corriger

1. `/admin/analytics` accessible à tout le monde (revenus, emails clients visibles)
2. Edge function `shopify-analytics` appelable par n'importe qui avec la clé anon
3. Tables `cart_events`, `checkout_events`, `friction_events`, `funnel_events` : lecture publique de toutes les données business

## Stratégie (la plus sûre)

**Principe** : on garde tout ce qui tourne aujourd'hui (l'écriture anonyme des événements est conservée — sinon le tracking casse). On verrouille uniquement la **lecture** et le **dashboard**, derrière un compte admin Lovable Cloud.

### 1. Base de données

- Créer un type `app_role` (`admin`, `user`) + table `user_roles` (pattern officiel non-récursif)
- Créer la fonction `has_role(user_id, role)` en `SECURITY DEFINER`
- **Remplacer** les 4 policies SELECT "Anyone can read …" par "Admins can read …" utilisant `has_role(auth.uid(), 'admin')`
- **Conserver** les 4 policies INSERT "Anyone can insert …" → le tracking continue de marcher pour les visiteurs anonymes

### 2. Authentification

- Activer l'auth email/password (Lovable Cloud) — déjà disponible
- Créer une page `/admin/login` simple (email + mot de passe, pas d'inscription publique)
- Créer un composant `ProtectedAdminRoute` qui :
  - vérifie la session Supabase
  - vérifie via `has_role` que l'utilisateur est `admin`
  - sinon redirige vers `/admin/login`
- Wrapper la route `/admin/analytics` avec ce garde

### 3. Edge function `shopify-analytics`

- Lire le JWT du header `Authorization`
- Valider avec `supabase.auth.getClaims(token)` → si invalide : 401
- Vérifier le rôle admin via la fonction `has_role` → si non admin : 403
- Le front continue d'appeler la function exactement de la même manière (le SDK envoie le JWT automatiquement quand l'utilisateur est connecté)

### 4. Création du premier admin

Après application de la migration, vous créez votre compte admin via la page `/admin/login` (inscription), puis je vous fournis la requête SQL exacte pour insérer votre `user_id` dans `user_roles` avec le rôle `admin`. Une seule manipulation, 30 secondes.

## Ce qui NE change PAS (zéro risque pour le site)

- ✅ Toutes les pages publiques (Hero, Product, Cart, Checkout) : identiques
- ✅ Le tracking Meta Pixel + Supabase `cart_events`/`funnel_events`/etc. : continue d'écrire
- ✅ Le checkout Shopify : aucun changement
- ✅ L'edge function `shopify-purchase-webhook` (Meta CAPI) : aucun changement
- ✅ Tous les autres composants : aucun changement

## Fichiers touchés

- **Nouvelle migration SQL** (tables, fonction, policies)
- `src/App.tsx` — wrapper `ProtectedAdminRoute` autour de `/admin/analytics`
- `src/pages/AdminLogin.tsx` — **nouveau**, page de connexion admin
- `src/components/ProtectedAdminRoute.tsx` — **nouveau**, garde de route
- `supabase/functions/shopify-analytics/index.ts` — ajout du check JWT + admin en tête du handler
- `supabase/config.toml` — bloc `[functions.shopify-analytics]` avec `verify_jwt = false` (on valide en code pour pouvoir retourner des erreurs propres)

## Risque résiduel

Quasi nul : si quelque chose foire côté auth, le pire scénario est que **vous** ne puissiez plus accéder au dashboard pendant quelques minutes — le site public et les ventes ne sont jamais impactés.

Validez et je lance la migration puis les changements de code.