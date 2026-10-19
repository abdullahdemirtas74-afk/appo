# Domaine AppO — appo-ad.com (Cloudflare → Railway)

Domaine principal : **https://appo-ad.com**  
WWW : **https://www.appo-ad.com**  
Fallback Railway : https://appo-production-10fb.up.railway.app

## DNS Cloudflare (à créer)

Dans **Cloudflare → DNS → Records**, ajoute :

### 1) Racine `appo-ad.com`

| Type | Nom | Contenu | Proxy |
|------|-----|---------|-------|
| CNAME | `@` | `k7pofo8z.up.railway.app` | **DNS only** (nuage gris) au début |
| TXT | `_railway-verify` | `railway-verify=0502d281c991b1b382d79ba6aab291f1d1bc60fc23e02c17402260c5f176a52b` | DNS only |

Cloudflare gère le CNAME à l’apex (CNAME flattening).

### 2) `www.appo-ad.com`

| Type | Nom | Contenu | Proxy |
|------|-----|---------|-------|
| CNAME | `www` | `vfq02zjo.up.railway.app` | **DNS only** au début |
| TXT | `_railway-verify.www` | `railway-verify=412728c5846738ae667fab2275c386fff0a0affffb209059228343d8f67cf476` | DNS only |

## Après propagation

1. Attendre 2–15 min (parfois plus)
2. Tester : `https://appo-ad.com` et `https://www.appo-ad.com`
3. Optionnel : repasser le proxy Cloudflare en orange (SSL mode **Full**) une fois le certificat Railway OK

## Variables Railway

- `APPO_PUBLIC_URL=https://appo-ad.com` (déjà positionnée)

## Stores / légal

Les liens privacy / CGU / remboursements pointent vers `https://appo-ad.com/...`.
