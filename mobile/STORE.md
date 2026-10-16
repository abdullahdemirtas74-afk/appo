# AppO — Publication Google Play & App Store

Shell natif **Capacitor** (`com.appo.app`) qui charge la prod :

**https://appo-production-10fb.up.railway.app**

Périmètre v1 : **app client** (particuliers / entreprises). Les pros restent sur le web / PWA.

---

## Prérequis (comptes)

| Store | Compte | Coût approx. |
| --- | --- | --- |
| Google Play | [Play Console](https://play.google.com/console) | ~25 € une fois |
| Apple | [Apple Developer Program](https://developer.apple.com/programs/) | ~99 € / an |
| iOS builds | Mac **ou** [Codemagic](https://codemagic.io) | — |

Autres éléments demandés par les stores :

- Politique de confidentialité : `https://appo-production-10fb.up.railway.app/confidentialite`
- CGU : `https://appo-production-10fb.up.railway.app/cgu`
- Remboursements : `https://appo-production-10fb.up.railway.app/remboursement`
- Mentions légales : `https://appo-production-10fb.up.railway.app/mentions-legales`
- E-mail support éditeur
- Icône **1024×1024** PNG (départ : `mobile/resources/icon.png` — à remplacer par une version HD)
- Captures d’écran téléphone (5,5" / 6,7" iPhone + téléphone Android)
- Description FR, catégorie (Lifestyle / Business), classification d’âge

---

## Setup local (une fois)

```bash
cd mobile
npm install
npm run assets
npm run sync
```

### Keystore Android (Play)

```bash
chmod +x scripts/create-keystore.sh
./scripts/create-keystore.sh
# Puis :
cp android/key.properties.example android/key.properties
# Éditer storePassword / keyPassword
```

**Ne jamais committer** `signing/`, `android/key.properties`, ni les certificats Apple (`.p8`, `.p12`, `.mobileprovision`).

---

## Google Play (Android)

### Build AAB local (Android Studio / SDK)

1. Installer [Android Studio](https://developer.android.com/studio) + SDK 35.
2. Depuis `mobile/` :

```bash
npm run sync:android
cd android
./gradlew bundleRelease
```

3. Artefact :

`android/app/build/outputs/bundle/release/app-release.aab`

### Play Console

1. Créer l’app **AppO** (appId `com.appo.app`).
2. Remplir la fiche (listing FR) :
   - Titre : AppO
   - Courte : *Le bon pro, sans attendre*
   - Longue : mise en relation avec pros vérifiés, AppO Now, devis, suivi mission, paiement sécurisé.
3. **Politique de confidentialité** : URL ci-dessus.
4. **Data safety** : localisation, photos, compte (e-mail) — collectés pour le service ; pas de vente de données.
5. Track **Tests internes** → uploader l’AAB → tester → Production.

### Review notes (Android)

Marketplace de services locaux (plomberie, etc.). Paiements = missions de services physiques (hors Google Play Billing pour le contenu digital).

---

## App Store (iOS)

Les sources Xcode sont dans `mobile/ios/`. Un **Mac** ou **Codemagic** est requis pour compiler / signer.

### Sur Mac

```bash
cd mobile
npm install
npm run sync:ios
npx cap open ios
```

Dans Xcode :

1. Team Apple Developer + bundle id `com.appo.app`
2. Signing automatique (ou provisioning manuel)
3. Archive → Distribute → App Store Connect / TestFlight

### Via Codemagic (sans Mac)

1. Connecter le repo GitHub à Codemagic.
2. Utiliser [`codemagic.yaml`](codemagic.yaml) à la racine de `mobile/`.
3. Ajouter les secrets : certificats iOS, App Store Connect API key, keystore Android (optionnel même pipeline).

### App Store Connect

1. Créer l’app **AppO**, bundle `com.appo.app`.
2. Privacy Nutrition Labels (localisation, contact, photos).
3. Captures + description FR.
4. **Review notes** (important) :

> AppO est une marketplace de services à domicile (plomberie, électricité…).  
> Les paiements concernent des prestations physiques réalisées par des professionnels.  
> Compte démo : sarah@appo.fr / appo123  
> URL : https://appo-production-10fb.up.railway.app

5. TestFlight → soumission review.

---

## Checklist soumission

- [ ] Compte Play Console actif
- [ ] Compte Apple Developer actif
- [ ] Keystore Android créé + sauvegardé hors git
- [ ] Certificats / profils iOS (ou Codemagic)
- [ ] Icône 1024×1024 + captures
- [ ] Privacy policy en ligne
- [ ] AAB uploadé (tests internes OK)
- [ ] IPA / TestFlight OK
- [ ] Notes de review marketplace (services physiques)

---

## Versions

| Champ | Valeur initiale |
| --- | --- |
| `versionName` / marketing | `1.0.0` |
| `versionCode` / build | `1` |
| Bundle / applicationId | `com.appo.app` |

Incrémenter `versionCode` à **chaque** upload Play, et le build number iOS à chaque archive.
