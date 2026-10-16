# AppO — Bilan projet

**Dernière mise à jour :** 16 octobre 2026  
**Stack :** Next.js + TypeScript + Tailwind · DB fichier JSON (+ fondation Postgres) · GitHub · Railway · PWA · Capacitor (stores)  
**Repo :** https://github.com/abdullahdemirtas74-afk/appo  
**App :** https://appo-production-10fb.up.railway.app  

**Avancement estimé :** MVP produit ~94–95 % · Prod « sérieuse » ~50–55 % · Stores (shell) ~70 % (soumission manuelle restante)

---

## 1. Ce qui a été fait (depuis le début)

### Fondations
- [x] MVP web AppO (clients / pros / admin)
- [x] Déploiement local + Railway (Dockerfile Node, build prod)
- [x] Config Railway
- [x] Comptes démo (`appo123`)
- [x] UI responsive (mobile / tablette / desktop)
- [x] Landing « Le bon pro, sans attendre »
- [x] PWA installable (manifest + service worker + icônes)
- [x] Multi-villes Haute-Savoie (sélecteur + distances)
- [x] CI GitHub Actions (typecheck / build / smoke)

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
- [x] Recherche de pros (filtre ville)
- [x] Messages mission
- [x] AppO+ (abo + négociation de prix)
- [x] Contacts masqués jusqu’à acceptation
- [x] Facture électronique post-mission (HT/TVA, commission masquée côté client/pro)
- [x] Aide & litiges (tickets + litiges mission)
- [x] Langues (ISO) via réglages

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
- [x] Healthcheck `/api/health` (+ statut Postgres si `DATABASE_URL`)
- [x] Chiffrement téléphone / adresses au repos
- [x] Consentement + page confidentialité
- [x] Export / suppression compte

### Infra récente
- [x] Upload disque (photos + docs PDF/images)
- [x] GPS live pro + ETA recalculée + carte OSM
- [x] `DATA_DIR` + volume Docker pour persistance
- [x] Scaffolding mail Resend (désactivé)
- [x] Monitoring stdout + prêt pour Sentry (`SENTRY_DSN`)
- [x] Fondation Postgres (`sql/001_schema.sql`, client `pg`, activé si `DATABASE_URL`)

---

## 2. Ce qu’il reste à faire

### A. Ops immédiat (prod démo stable)
- [ ] Monter un volume Railway sur `/data` + `DATA_DIR=/data`
- [ ] Vérifier / fixer `APPO_SECRET` en prod
- [ ] (Optionnel) migrer `railway.toml` → Infrastructure as Code Railway
- [ ] (Optionnel) brancher Sentry : `SENTRY_DSN` + `npm i @sentry/nextjs`

### B. Pour clôturer la MVP produit
- [ ] Paiements réels (Stripe + Stripe Connect pros)
- [ ] Activer e-mails (Resend + `APPO_MAIL_*`)
- [ ] SMS / push (offres Now, litiges, codes)
- [x] CGU / confidentialité / remboursements / mentions légales (pages publiques + liens inscription/compte)
- [ ] Compléter raison sociale / SIRET dans mentions légales (éditeur)
- [x] Parcours onboarding guidé (1er client / 1er pro)

### C. Qualité & robustesse
- [ ] Nettoyer ESLint (erreurs historiques `any` / purity)
- [x] Smoke geo + CI typecheck/build
- [ ] Tests automatisés (API + parcours critiques)
- [ ] Uptime / alertes prod
- [ ] Anti-fraude basique (multi-comptes, abus matching)

### D. Prod « sérieuse » (hors JSON)
- [ ] Migration complète JSON → Postgres (adapter runtime)
- [ ] Stockage fichiers cloud (S3/R2) au lieu du disque local
- [ ] KYC pro avancé (OCR, contrôles auto)
- [ ] Routing / trafic réel (Maps API)
- [ ] Rôles admin fins + audit trail complet
- [ ] Facturation légale PDF (numérotation complète)

### E. Croissance produit (après MVP)
- [x] Shell natif Capacitor iOS / Android (`mobile/`, appId `com.appo.app`)
- [x] Ajustements web WebView (safe-area, liens externes, pas de SW PWA en natif)
- [x] Projet Android + signature release + guide AAB / Play (`mobile/STORE.md`)
- [x] Projet iOS + Info.plist + Codemagic TestFlight (`mobile/codemagic.yaml`)
- [ ] Comptes Play / Apple + assets 1024 + soumission review (hors code)
- [ ] Programme parrainage (déjà wallet — à pousser)
- [ ] Chat support live
- [ ] Analytics produit (funnels conversion)
- [ ] Marketplace B2B élargie

---

## 3. Synthèse

**Fait :** marketplace locale complète (Now + RFQ + abos + admin + RGPD + uploads + GPS + factures e-invoices + multi-villes + PWA) + shell Capacitor stores (Android AAB buildable, iOS sources + CI Codemagic).  
**Reste :** paiements réels, notifs hors app, volume Railway, soumission stores (comptes + captures), bascule Postgres runtime.

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
