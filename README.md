# Tabib.dz — prototype fonctionnel (backend réel)

Application de prise de rendez-vous médicaux pour l'Algérie, dans l'esprit de Doctolib.
Contrairement aux versions précédentes (interface seule), celle-ci a un **vrai backend** :
les comptes, les médecins, les créneaux et les rendez-vous sont **réellement enregistrés**
dans une base de données (fichier `data/db.json`), avec une **authentification réelle**
(mots de passe hashés, sessions par cookie sécurisé).

## Installer et lancer

```bash
npm install
npm start
```

Puis ouvrir **http://localhost:3000**

## Comptes de démonstration

| Rôle | Email | Mot de passe |
|---|---|---|
| Patient | `patient@demo.dz` | `demo1234` |
| Médecin | `yacine.belkacem@tabib.dz` | `demo1234` |

Vous pouvez aussi créer de nouveaux comptes (patient ou médecin) depuis `/register.html`.

## Ce qui est réellement fonctionnel

- **Authentification** : inscription, connexion, session persistante (JWT en cookie httpOnly), mots de passe hashés avec bcrypt.
- **Recherche de médecins** : filtrage réel par spécialité et wilaya côté serveur.
- **Réservation** : un rendez-vous pris bloque réellement le créneau (il n'est plus proposé à un autre patient).
- **Espace patient** : liste des rendez-vous à venir/passés, annulation (le créneau redevient disponible).
- **Espace médecin** : agenda cliquable (ouvrir/fermer un créneau), liste des rendez-vous du jour, liste des patients, statistiques.
- **Persistance réelle** : tout est écrit dans `data/db.json`. Si vous arrêtez et relancez le serveur, les données restent.

## Ce qu'il reste à construire pour un vrai lancement

Ce prototype pose des fondations réelles (backend + auth + base de données), mais il manque encore, dans l'ordre où je vous recommande de vous y attaquer :

1. **Vraie base de données** : remplacer `data/db.json` par PostgreSQL ou MySQL (le code est structuré pour que ce soit une migration simple, toute la logique passe par `src/db.js`).
2. **Vérification de l'identité des médecins** : upload du diplôme / numéro à l'Ordre national des médecins, avec validation manuelle avant publication du profil.
3. **Notifications réelles** : SMS de rappel (ex. via un fournisseur local ou Twilio) et notifications WhatsApp.
4. **Paiement / tiers payant** : intégration CIB/Edahabia si vous voulez du paiement en ligne.
5. **Hébergement** : déployer sur un serveur (ex. VPS OVH/Digital Ocean, ou hébergement local en Algérie selon les contraintes réglementaires).
6. **Nom de domaine + certificat HTTPS**, obligatoires avant toute mise en production réelle.
7. **RGPD / protection des données de santé** : les données médicales sont sensibles ; il faut un chiffrement au repos et une politique de confidentialité conforme à la réglementation algérienne.

## Structure du projet

```
tabib-app/
  server.js              → point d'entrée du serveur
  src/
    db.js                → couche base de données (fichier JSON, à migrer vers SQL)
    auth.js               → hashing, JWT, middlewares d'authentification
    routes/
      auth.js              → inscription / connexion / session
      doctors.js           → recherche et fiches médecins (public)
      appointments.js      → réservation côté patient
      pro.js                → agenda et rendez-vous côté médecin
  public/                → frontend (HTML/CSS/JS, aucun framework, appelle l'API réelle)
  data/db.json           → la "base de données" (créée automatiquement au premier lancement)
```
