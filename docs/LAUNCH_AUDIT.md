# AppO — Audit de lancement (16 oct. 2026)

**Cibles testées :** `https://www.appo-ad.com` · fallback `https://appo-production-10fb.up.railway.app`  
**Verdict UI / parcours démo :** prêt pour un **lancement soft / bêta**  
**Verdict « prod commerciale 100 % » :** **non** — blockers listés ci-dessous

---

## Résumé chiffré

| Suite | Résultat |
|-------|----------|
| Pages publiques + légales | 12/12 PASS |
| Health / auth / APIs rôles | 36 PASS · 0 FAIL (audit API) |
| UI client / pro / admin | PASS (smoke navigateur) |
| Création mission Now (API) | PASS après fix volume |
| Secret session | PASS (`secretMode=env`) après set `APPO_SECRET` |
| Volume `/data` | PASS (writable) après fix permissions |

---

## Ce qui est OK

- Domaine custom Railway : `appo-ad.com` + `www` (certificats validés)
- Landing, login/register, PWA manifest + SW
- Pages légales : `/legal`, `/cgu`, `/confidentialite`, `/remboursement`, `/mentions-legales`
- Auth démo : sarah / kevin / admin (`appo123`)
- Espaces client, pro, admin (navigation + dashboards)
- AppO Now formulaire UI
- Admin live overview
- APIs : categories, missions, invoices, growth, support, pros, admin
- Persistance volume Railway `/data` + secret HMAC en env

---

## Blockers / pas encore 100 % « lancement sérieux »

1. **Paiements simulés** — pas de Stripe / Stripe Connect → pas d’encaissement réel  
2. **E-mails / SMS / push** — non activés (Resend, etc.)  
3. **Mentions légales** — SIRET encore « En cours d’immatriculation »  
4. **Stores** — shell Capacitor prêt, **pas soumis** Play / App Store  
5. **Postgres** — runtime encore JSON snapshot (OK démo, fragile à l’échelle)  
6. **Apex `appo-ad.com`** — parfois résolution IPv6-only selon DNS local ; **www** est fiable. Preférer rediriger apex→www ou vérifier les records A Cloudflare  
7. **CGU / contrats pro** — pages présentes, pas de revue juridique externe  
8. **Monitoring** — Sentry non branché  
9. **E2E automatisés** — smoke API + UI manuelle seulement  

---

## Correctifs faits pendant l’audit

- `APPO_SECRET` positionné (sessions sécurisées)
- Volume Railway `/data` créé + `DATA_DIR=/data`
- Entrypoint Docker : droits volume (évite `EACCES`)

---

## Checklist avant annonce publique large

- [ ] Remplir SIRET / adresse exacte dans `web/src/lib/legal.ts`
- [ ] Vérifier `https://appo-ad.com` depuis mobile 4G + Wi‑Fi (apex)
- [ ] Brancher Stripe (ou communiquer clairement « paiements démo »)
- [ ] Activer e-mails transactionnels
- [ ] Soumettre Play (AAB) puis TestFlight
- [ ] Backup / export admin testé sur volume
- [ ] Relancer : `BASE=https://www.appo-ad.com node scripts/launch-audit.mjs`

---

## Captures UI

Dossier agent : `/opt/cursor/artifacts/screenshots/launch-audit/`  
(landing, client, Now, pro, admin, hub légal)
