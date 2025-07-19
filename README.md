## Commandes d'installation et de lancement

```bash

npm install
docker-compose up -d
npm run build
npm run start
npx http-server -p 8080 .
http://localhost:8080/index.html
http://localhost:8080/index-user.html
http://localhost:8080/index-owner.html
```

# Côté Super Admin

## Gestion des Salles d'Entraînement :
Création, modification et suppression de salles d'entraînement. Il est aussi possible d'approuver une salle de
sport faisant une demande. L'administrateur peut définir le nom, la capacité d'accueil, les équipements
disponibles et d'autres caractéristiques de chaque salle tout comme un responsable de salle.
Attribution de salles spécifiques à des types d'exercices ou à des niveaux de difficulté.

Gestion des Types d'Exercices : ✅
Ajout, modification et suppression des types d'exercices disponibles. Chaque type d'exercice peut être défini
avec un nom, une description et des informations sur les muscles ciblés.

Création de Badges et Récompenses :
Possibilité pour l'administrateur de créer des badges et des récompenses virtuelles à attribuer aux
utilisateurs en fonction de leurs accomplissements dans les défis. Des badges devront être ajouté
dynamiquement au système depuis une interface en utilisant des règles.

Gestion des Utilisateurs : ✅
Capacité à désactiver ou supprimer des comptes d'utilisateurs ainsi que des propriétaire de salle en cas de
besoin.
---

# Côté Utilisateur - Propriétaire de Salle de Sport
Informations sur la Salle de Sport :
informations de base, telles que le nom de la salle, l'adresse, les coordonnées de contact, etc. champ pour
décrire brièvement les installations et les équipements disponibles dans la salle de sport, ainsi que les types
d'activités proposées.

Proposition de Défis Spécifiques :
Possibilité de proposer des défis d'entraînement spécifiques qui seront associés à la salle de sport une fois
intégrée dans le système.
Le responsable peut suggérer des défis basés sur les équipements disponibles dans la salle, les types
d'entraînement populaires, etc.-> permet d'augmenter son score de joueur

---

# Côté Utilisateur - Client
Création et Partage de Défis : Les utilisateurs peuvent créer et partager des défis d'entraînement physique
avec d'autres membres de la communauté. Chaque défi peut inclure des objectifs spécifiques, des exercices
recommandés, et une durée définie.

Exploration des Défis : Les membres peuvent explorer une variété de défis d'entraînement physique créés
par d'autres utilisateurs. Ils peuvent filtrer les défis en fonction de la difficulté, du type d'exercice, et de la
durée.

Suivi de l'Entraînement : Les utilisateurs peuvent suivre leur progression dans les défis enregistrant leurs
séances d'entraînement, le nombre de calories brûlées, et d'autres statistiques pertinentes.

Défis Sociaux : Les membres peuvent inviter leurs amis et leur réseau à rejoindre des défis collaboratifs. Ils
peuvent également défier d'autres utilisateurs à rejoindre et à compléter les défis ensemble.

Récompenses et Badges : Les participants qui réussissent les défis peuvent recevoir des récompenses
virtuelles et des badges pour leur accomplissement. Les classements des utilisateurs les plus actifs sont
également affichés

---


# Gestion des Salles de Sport (`GymRoom`) — Règles d’accès & Rôles

Ce module gère la création, la modification, la suppression, l’approbation et la consultation des salles de sport.  
Les droits sont définis selon le rôle de l’utilisateur connecté :

- **ADMIN** (administrateur)
- **OWNER** (propriétaire)
- **USER** (utilisateur classique)

---

## Règles d’accès selon les rôles

### Affichage de toutes les salles (`GET /gymrooms`)
- **ADMIN** : voit toutes les salles (approuvées ou non).
- **OWNER** : voit toutes les salles approuvées, seulement s’il possède au moins une salle approuvée.
- **USER** : voit toutes les salles approuvées.

### Affichage des salles d’un propriétaire (`GET /gymrooms/owners/:id`)
- **ADMIN** : voit toutes les salles (approuvées ou non) d’un propriétaire.
- **OWNER** : voit uniquement les salles approuvées d’un propriétaire, s’il possède lui-même au moins une salle approuvée.
- **USER** : voit uniquement les salles approuvées d’un propriétaire.

### Création d’une salle (`POST /gymrooms`)
- **ADMIN** : peut créer une salle pour n’importe quel propriétaire.
- **OWNER** : peut créer une salle pour lui-même (en attente d’approbation).
- **USER** : interdit.

### Modification d’une salle (`PUT /gymrooms/:id`)
- **ADMIN** : peut modifier n’importe quelle salle approuvée.
- **OWNER** : peut modifier ses propres salles (sauf owner/approval).
- **USER** : interdit.

### Suppression ou désapprobation d’une salle (`DELETE /gymrooms/:id`, `PATCH /gymrooms/:id/disapprove`)
- **ADMIN** : peut désapprouver (soft delete) une salle (elle devient invisible pour les users classiques).
- **OWNER** : peut supprimer physiquement **sa propre salle non approuvée**.
- **USER** : interdit.

### Consultation détaillée (`GET /gymrooms/:id`)
- **ADMIN** : accès à toutes les salles approuvées.
- **OWNER** : accès aux salles approuvées, s’il possède au moins une salle approuvée.
- **USER** : accès à toutes les salles approuvées.

### Approbation/désapprobation (`PATCH /gymrooms/:id/approve`, `PATCH /gymrooms/:id/disapprove`)
- **ADMIN** : peut approuver ou désapprouver n’importe quelle salle.
- **OWNER**/**USER** : interdit.

---

#  Gestion des Challenges (`ChallengeController`) — Règles d’accès & Rôles

Ce module gère la création, la modification, la suppression, la consultation et le filtrage des challenges d’entraînement.  
Les droits sont définis selon le rôle de l’utilisateur connecté :

- **ADMIN** (administrateur)
- **OWNER** (propriétaire de salle, avec au moins une salle approuvée)
- **USER** (utilisateur classique)

---

## Règles d’accès selon les rôles

### Affichage de tous les challenges (`GET /challenges`)
- **ADMIN** : voit tous les challenges.
- **OWNER** : voit tous les challenges, _uniquement s’il possède au moins une salle approuvée_.
- **USER** : voit tous les challenges.

### Affichage des challenges créés par les utilisateurs (`GET /challenges/users`)
- **ADMIN** : accès à tous les challenges créés par des utilisateurs classiques.
- **OWNER** : accès, _seulement si une salle approuvée_.
- **USER** : accès classique.

### Affichage des challenges par créateur (`GET /challenges/:id`)
- **ADMIN** : accès à tous les challenges de n’importe quel utilisateur.
- **OWNER** : accès à tous les challenges (si salle approuvée).
- **USER** : accès _uniquement à ses propres challenges_.

### Création d’un challenge (`POST /challenges`)
- **ADMIN** : peut créer un challenge avec tous les paramètres.
- **OWNER** : peut créer un challenge _seulement si une salle lui appartenant est approuvée_.
- **USER** :
  - Peut _seulement créer pour lui-même_ (`creatorId = user._id`).
  - _Interdiction_ d’ajouter d’autres participants (`participantIds`), des badges (`badgeRewardIds`) ou une salle (`gymRoomId`).

### Modification d’un challenge (`PUT /challenges/:id`)
- **ADMIN** : peut modifier tous les challenges.
- **USER** : peut modifier _uniquement ses propres challenges_ et _seuls certains champs_ (pas de modification des participants, badges ou salle).
- **OWNER** : n’a pas le droit de modifier les challenges autres que les siens selon la logique.

### Suppression d’un challenge (`DELETE /challenges/:id`)
- **ADMIN** : peut supprimer tous les challenges.
- **USER** : peut supprimer _ses propres challenges_.
- **OWNER** : non spécifié dans la logique, par défaut non autorisé sauf si créateur.

### Filtrage par durée (`GET /challenges/filter/duration?min=xx&max=yy`)
- **ADMIN**/**OWNER**/**USER** : tous peuvent filtrer les challenges selon leur durée.

### Filtrage par type d’exercice (`GET /challenges/filter/exercisetype/:exerciseTypeId`)
- **ADMIN**/**OWNER**/**USER** : tous peuvent filtrer les challenges selon leur type d’exercice.

---
