# AppO Mobile (Capacitor)

Enveloppe native iOS / Android pour publier AppO sur les stores.

- **appId** : `com.appo.app`
- **WebView** : prod Railway (`capacitor.config.ts` → `server.url`)
- **Guide stores** : [STORE.md](./STORE.md)
- **CI iOS/Android cloud** : [codemagic.yaml](./codemagic.yaml)

## Commandes

```bash
npm install
npm run assets      # copie les icônes depuis web/public/icons
npm run sync        # sync Android + iOS
npm run sync:android
npm run open:android
npm run open:ios    # macOS + Xcode requis
```

Pour pointer vers un autre backend (ex. staging) :

```bash
APPO_MOBILE_URL=https://example.com npm run sync
```
