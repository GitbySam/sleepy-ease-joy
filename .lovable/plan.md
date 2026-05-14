## Problème

Au clic sur "Secure Checkout", certains visiteurs voient une erreur "DNS prohibited" ou "domaine injoignable" pour `checkout.sleepenzy.com`. Le résolveur DNS du client n'a pas encore l'enregistrement en cache au moment du clic, ce qui déclenche un échec côté FAI/résolveur.

## Solution

Ajouter dans le `<head>` de `index.html` des hints navigateur pour que **DNS + TCP + TLS** vers `checkout.sleepenzy.com` soient effectués en arrière-plan dès l'arrivée du visiteur sur le site. Quand il clique sur Checkout, seule la requête HTTP reste à faire — instantanée.

## Changements

**Fichier : `index.html`** (dans le `<head>`, à côté des autres `preconnect` Shopify déjà présents)

Ajouter :

```html
<!-- Préchauffage du sous-domaine de checkout Shopify -->
<link rel="dns-prefetch" href="https://checkout.sleepenzy.com" />
<link rel="preconnect" href="https://checkout.sleepenzy.com" crossorigin />
```

### Pourquoi les deux balises

- `dns-prefetch` : fallback léger pour les navigateurs/contextes où `preconnect` est ignoré (ex: Safari ancien, mode économie de données).
- `preconnect` : fait DNS + TCP + handshake TLS — c'est ce qui économise réellement les ~300-800 ms au moment du clic.
- `crossorigin` : nécessaire car le checkout est sur une origine différente (sinon la connexion TLS préchauffée n'est pas réutilisée).

### Emplacement exact

Juste après les lignes existantes :
```html
<link rel="preconnect" href="https://kdpwn5-0h.myshopify.com" crossorigin />
<link rel="preconnect" href="https://cdn.shopify.com" crossorigin />
```

## Hors scope (à noter mais non inclus dans ce changement)

Ces hints **réduisent** la fréquence du problème mais ne le **suppriment pas à 100 %** si la cause racine est ailleurs :
- DNSSEC mal configuré sur `sleepenzy.com` → certains résolveurs (Quad9, Cloudflare 1.1.1.1) renvoient `SERVFAIL` / "DNS prohibited". À vérifier avec `dig +dnssec checkout.sleepenzy.com` côté DNS.
- CNAME mal pointé sur Shopify → vérifier dans l'admin Shopify que le domaine custom de checkout est bien activé.

Si après déploiement de ces hints le problème persiste pour certains utilisateurs, il faudra investiguer ces deux pistes côté DNS/Shopify (pas côté code).
