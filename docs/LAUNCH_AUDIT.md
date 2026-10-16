# AppO — Audit de lancement officiel (16 oct. 2026)

**Cibles :** `https://www.appo-ad.com` · `https://appo-ad.com` · fallback Railway  
**Mode :** **officiel** (démo UI désactivée en prod)  
**Verdict web / API :** prêt au lancement public  
**Reste bloquant hors code :** soumission **Google Play** + **App Store** (+ SIRET légal à compléter)

---

## Résumé

| Domaine | Statut |
|---------|--------|
| Domaine + HTTPS (www / apex) | OK |
| Health prod + volume `/data` | OK |
| Auth + sessions (`APPO_SECRET`) | OK |
| Stripe **live** Checkout + webhook | OK |
| Stripe Connect Express (versements pros) | OK code + deploy — questionnaire platform Stripe à finaliser si Express bloqué |
| E-mails Gmail SMTP `contact@appo-ad.com` | OK (test iCloud reçu) |
| Pages légales | OK |
| Mode démo / paiements simulés UI | **Retiré en prod** |
| Shell Capacitor `com.appo.app` | OK code |
| Soumission Play / App Store | **À faire (manuel)** |

---

## Ce qui est OFF en prod (lancement)

- Comptes démo sur landing / login
- Préremplissage `appo123`
- Bouton « Paiement simulé (secours) »
- Bouton admin « Reset démo » (+ API `reset` refusée hors démo)
- Textes « Stripe à brancher / paiements simulés » dans CGU & admin

Réactiver uniquement avec `NEXT_PUBLIC_APPO_DEMO_UI=true` (dev / staging).

---

## Pas 100 % « société » (mais web lançable)

1. **SIRET / capital** encore « en cours » dans `legal.ts` — à mettre à jour dès immatriculation  
2. **Stores** — build / AAB / TestFlight + review Google/Apple  
3. **SMS / push** — non branchés (e-mail OK)  
4. **Postgres runtime** — encore JSON sur volume (OK soft-launch, pas scale)  
5. **Sentry** — optionnel  
6. **Connect platform profile** Stripe — à valider dans le Dashboard si onboarding Express échoue  

---

## Checklist stores (seul vrai reste « produit »)

- [ ] Google Play : AAB signé + fiche + privacy URL `https://appo-ad.com/confidentialite`
- [ ] App Store : archive / TestFlight + listing
- [ ] Captures + icône 1024
- [ ] Comptes développeur validés (Play déjà en cours côté Abdullah)

---

## Relancer un audit API

```bash
BASE=https://www.appo-ad.com node web/scripts/launch-audit.mjs
```
