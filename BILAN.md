# AppO — Bilan projet

**Dernière mise à jour :** 9 septembre 2026  
**Stack :** Next.js + TypeScript + Tailwind · DB fichier JSON · GitHub · Railway  
**Repo :** https://github.com/abdullahdemirtas74-afk/appo  
**App :** https://appo-production-10fb.up.railway.app  

**Avancement estimé :** MVP produit ~90–92 % · Prod « sérieuse » ~35–40 %

---

## 1. Ce qui a été fait (depuis le début)

### Fondations
- [x] MVP web AppO (clients / pros / admin)
- [x] Déploiement local + Railway (Dockerfile Node, build prod)
- [x] Config Railway
- [x] Comptes démo (`appo123`)
- [x] UI responsive (mobile / tablette / desktop)
- [x] Landing « Le bon pro, sans attendre »

### Moteurs métier
- [x] AppO Now (matching immédiat)
- [x] Urgence (priorité, tarif/commission majorés)
- [x] RFQ (demande → offres pros → choix client)
- [x] Matching par catégorie, rayon, score, disponibilité
- [x] Planification / créneaux
- [x] Gros travaux / devis recommandé

### Pros
- [x] Inscription + documents
- [x] Planning, absences, disponibilités
- [x] Tiers Pro / Prime / Elite + Boost
- [x] Offres Now prioritaires
- [x] Business / équipe
- [x] Devis → signature client
- [x] Revenus / stats
- [x] Vérification documentaire (checklist, validation admin doc par doc)

### Clients
- [x] Particulier / entreprise / syndicat (à l’inscription)
- [x] Compte : profil, adresses, favoris, factures
- [x] Recherche de pros
- [x] Messages mission
- [x] AppO+ (abo + négociation de prix)
- [x] Contacts masqués jusqu’à acceptation
- [x] Facture post-mission + pourboires (simulés)
- [x] Aide & litiges (tickets + litiges mission)

### Admin
- [x] Validation / refus / suspension pros
- [x] Clients (PII masquée + révélation auditée)
- [x] Missions, paiements, catégories, litiges/support
- [x] Export backup / reset démo
- [x] E-mails Pros (quota 100/j — prêt, non activé)
- [x] Vue d’ensemble / commissions

### Sécurité & RGPD
- [x] Secret sessions (`APPO_SECRET`)
- [x] Cookies sécurisés, rate-limit login
- [x] Écritures DB atomiques + backups rotatifs
- [x] Healthcheck `/api/health`
- [x] Chiffrement téléphone / adresses au repos
- [x] Consentement + page confidentialité
- [x] Export / suppression compte

### Infra récente
- [x] Upload disque (photos + docs PDF/images)
- [x] GPS live pro + ETA recalculée
- [x] `DATA_DIR` + volume Docker pour persistance
- [x] Scaffolding mail Resend (désactivé)

---

## 2. Ce qu’il reste à faire

### A. Ops immédiat (prod démo stable)
- [ ] Monter un volume Railway sur `/data` + `DATA_DIR=/data`
- [ ] Vérifier / fixer `APPO_SECRET` en prod
- [ ] (Optionnel) migrer `railway.toml` → Infrastructure as Code Railway

### B. Pour clôturer la MVP produit
- [ ] Paiements réels (Stripe + Stripe Connect pros)
- [ ] Activer e-mails (Resend + `APPO_MAIL_*`)
- [ ] SMS / push (offres Now, litiges, codes)
- [ ] CGU / mentions légales / contrat pro plus formels
- [ ] PWA / installation mobile
- [ ] Parcours onboarding guidé (1er client / 1er pro)

### C. Qualité & robustesse
- [ ] Tests automatisés (API + parcours critiques)
- [ ] CI GitHub (lint / build / tests)
- [ ] Monitoring (Sentry, uptime, alertes)
- [ ] Logs structurés + rétention
- [ ] Anti-fraude basique (multi-comptes, abus matching)

### D. Prod « sérieuse » (hors JSON)
- [ ] Postgres (ou DB managée) à la place de `db.json`
- [ ] Stockage fichiers cloud (S3/R2) au lieu du disque local
- [ ] KYC pro avancé (OCR, contrôles auto)
- [ ] Routing / trafic réel (Maps API)
- [ ] Multi-ville / multi-région
- [ ] Rôles admin fins + audit trail complet
- [ ] Facturation légale (numérotation, TVA, PDF)

### E. Croissance produit (après MVP)
- [ ] App native iOS / Android
- [ ] Programme parrainage
- [ ] Chat support live
- [ ] Analytics produit (funnels conversion)
- [ ] Marketplace B2B élargie

---

## 3. Synthèse

**Fait :** marketplace locale complète (Now + RFQ + abos + admin + RGPD + uploads + GPS), déployée et jouable en démo.  
**Reste :** paiements réels, notifs hors app, volume Railway, puis base/prod « vraie » (Postgres, cloud, KYC, monitoring).

### Comptes démo
Mot de passe : `appo123`

| Rôle | E-mail |
|------|--------|
| Client AppO+ | sarah@appo.fr |
| Entreprise | marc@appo.fr |
| Syndicat | claire@appo.fr |
| Pro | kevin@appo.fr |
| Admin | admin@appo.fr |
| Pro en attente | thomas@appo.fr |
