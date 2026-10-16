# Fastlane (optionnel)

Si tu préfères Fastlane à Codemagic en local :

```bash
# Android
cd mobile/android && bundle exec fastlane supply --aab app/build/outputs/bundle/release/app-release.aab

# iOS (Mac)
cd mobile/ios && bundle exec fastlane beta
```

Les lanes ne sont pas générées ici : utilise Codemagic ([`codemagic.yaml`](../codemagic.yaml)) ou Xcode / Android Studio pour la v1.
