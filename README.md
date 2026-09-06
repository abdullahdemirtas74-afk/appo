# AppO — V1 web locale

Plateforme de mise en relation particuliers / professionnels.
**Votre projet. Le bon pro.**

## Lancer en local

Depuis PowerShell, à la racine du projet :

```powershell
.\start.ps1
```

Puis ouvrir [http://localhost:3000](http://localhost:3000)

Si Node n’est pas dans le PATH, le script utilise `.tools/nodejs` (installé dans le projet).

## Comptes démo

Mot de passe : `appo123`

| Rôle | Email |
| --- | --- |
| Particulier | sarah@appo.fr |
| AppO Pro (Kevin, en ligne) | kevin@appo.fr |
| Admin | admin@appo.fr |
| Pro en attente de validation | thomas@appo.fr |

## Tester AppO Now

1. Onglet 1 : connexion **Kevin** (`kevin@appo.fr`) — rester **en ligne**.
2. Onglet 2 : connexion **Sarah** → **AppO Now** → Plomberie → envoyer.
3. Kevin voit le popup **Accepter / Passer** (20 secondes).
4. Sarah suit la mission, Kevin passe En route → Arrivé → Intervention → Terminer.
5. Sarah paie (simulé) et laisse un avis.

## Stack V1

- Next.js + TypeScript + Tailwind
- API locale + base JSON (`web/data/db.json`)
- Cartes OpenStreetMap
- Paiements marketplace **simulés** (Stripe Connect à brancher ensuite)
- Matching : métier, dispo, distance, rayon, vérifié, note

Cette V1 couvre le MVP du cahier des charges (Client, Pro, Admin) en web local.
