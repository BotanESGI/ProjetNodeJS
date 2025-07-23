## Commandes d'installation et de lancement

```bash

npm install
docker-compose up -d
npm run build
npm run start
http://localhost:8080/index.html
http://localhost:8080/index-user.html
http://localhost:8080/index-owner.html
```

# Côté Super Admin

## Gestion des Salles d'Entraînement :
Création, modification et suppression de salles d'entraînement. Il est aussi possible d'approuver une salle de
sport faisant une demande. L'administrateur peut définir le nom, la capacité d'accueil, les équipements
disponibles et d'autres caractéristiques de chaque salle tout comme un responsable de salle. ✅
Attribution de salles spécifiques à des types d'exercices ou à des niveaux de difficulté. 

Gestion des Types d'Exercices : ✅
Ajout, modification et suppression des types d'exercices disponibles. Chaque type d'exercice peut être défini
avec un nom, une description et des informations sur les muscles ciblés.

Création de Badges et Récompenses : ✅
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
d'activités proposées. ✅

Proposition de Défis Spécifiques :
Possibilité de proposer des défis d'entraînement spécifiques qui seront associés à la salle de sport une fois
intégrée dans le système.
Le responsable peut suggérer des défis basés sur les équipements disponibles dans la salle, les types
d'entraînement populaires, etc.-> permet d'augmenter son score de joueur

---

# Côté Utilisateur - Client
Création et Partage de Défis : Les utilisateurs peuvent créer et partager des défis d'entraînement physique
avec d'autres membres de la communauté. Chaque défi peut inclure des objectifs spécifiques, des exercices
recommandés, et une durée définie. ✅

Exploration des Défis : Les membres peuvent explorer une variété de défis d'entraînement physique créés
par d'autres utilisateurs. Ils peuvent filtrer les défis en fonction de la difficulté, du type d'exercice, et de la
durée. ✅

Suivi de l'Entraînement : Les utilisateurs peuvent suivre leur progression dans les défis enregistrant leurs
séances d'entraînement, le nombre de calories brûlées, et d'autres statistiques pertinentes. ✅

Défis Sociaux : Les membres peuvent inviter leurs amis et leur réseau à rejoindre des défis collaboratifs. Ils
peuvent également défier d'autres utilisateurs à rejoindre et à compléter les défis ensemble. ✅

Récompenses et Badges : Les participants qui réussissent les défis peuvent recevoir des récompenses
virtuelles et des badges pour leur accomplissement. Les classements des utilisateurs les plus actifs sont
également affichés

---

# 🏋️ GymRoomController – Routes & Logique Métier

Ce contrôleur gère la gestion des **salles de sport (Gym Rooms)** : création, modification, suppression, approbation et filtrage. Les accès sont contrôlés selon le **rôle** de l'utilisateur : `ADMIN`, `OWNER`, `USER`.

---

## 🔀 Routes disponibles

### 1. `GET /`
- **Description** : Récupère toutes les salles disponibles
- **ADMIN** : Récupère toutes les salles
- **OWNER** : Nécessite d’avoir **au moins une salle approuvée**
- **USER** : Accès uniquement aux salles **approuvées**

---

### 2. `GET /filter?exerciseId=...&difficultyLevel=...`
- **Description** : Filtrer les salles par type d’exercice ou niveau de difficulté
- **Paramètres** : 
  - `exerciseId` (optionnel)
  - `difficultyLevel` (optionnel)
- **Conditions** : au moins un paramètre requis
- **Résultat** : Salles **approuvées** correspondant aux critères

---

### 3. `GET /owners/:id`
- **Description** : Récupère les salles approuvées d’un propriétaire
- **Accès** :
  - **OWNER** : doit avoir une salle approuvée
  - **USER** : accès uniquement aux salles approuvées
  - **ADMIN** : accès à **toutes** les salles du propriétaire

---

### 4. `GET /:id`
- **Description** : Récupère une salle par son ID
- **ADMIN** : uniquement si elle est approuvée
- **OWNER** : accès seulement à ses propres salles **approuvées**
- **USER** : accès libre

---

### 5. `POST /`
- **Description** : Crée une nouvelle salle
- **OWNER** :
  - Ajoute la salle avec `approved: false` par défaut
- **ADMIN** :
  - Peut créer directement avec `approved: true` et assigner un `ownerId`
- **USER** : **interdit**

---

### 6. `PUT /:id`
- **Description** : Modifier une salle
- **OWNER** :
  - Ne peut pas modifier `approved` ni `ownerId`
  - Peut modifier **uniquement ses propres salles**
- **ADMIN** :
  - Peut modifier **toute salle approuvée**

---

### 7. `PATCH /:id/approve`
- **Description** : Approuve une salle
- **Accès** : **ADMIN uniquement**

---

### 8. `PATCH /:id/disapprove`
- **Description** : Désapprouve une salle
- **Accès** : **ADMIN uniquement**

---

### 9. `DELETE /:id`
- **Description** : Supprime une salle
- **ADMIN** :
  - Si approuvée → la désapprouve d’abord
  - Sinon, supprime réellement
- **OWNER** :
  - Ne peut pas supprimer une salle **approuvée**
  - Ne peut supprimer que **ses propres salles**

---


# 📘 ChallengeController – Routes & Logique Métier

Ce contrôleur gère toute la logique liée aux **challenges** dans l'application. Il intègre des vérifications de rôle (USER, OWNER, ADMIN), des validations conditionnelles et des actions sur les entités Challenge, User, Badge, Reward.

---

## 🔀 Routes disponibles

### 1. `GET /`
- **Description** : Récupère tous les challenges
- **Accès OWNER** : Doit posséder **une salle approuvée**
- **Accès autres rôles** : Pas de restriction

---

### 2. `GET /users`
- **Description** : Récupère tous les challenges créés par des utilisateurs ayant le rôle `"user"`
- **Accès OWNER** : Nécessite une salle approuvée

---

### 3. `GET /filter/duration?min=...&max=...`
- **Description** : Filtrer les challenges par **durée (min, max)**
- **Champ MongoDB** : `duration` avec opérateurs `$gte` et `$lte`

---

### 4. `GET /filter/difficulty?difficulty=...`
- **Description** : Filtrer les challenges selon la **difficulté**

---

### 5. `GET /filter/exercisetype/:exerciseTypeId`
- **Description** : Filtrer selon le **type d'exercice**
- **Champ** : `exerciseTypeIds` (tableau)

---

### 6. `PATCH /invite/:id`
- **Description** : Invite des participants à un challenge
- **Règles** :
  - Seul le **créateur** ou un **admin** peut inviter
  - Évite les doublons d’invitation
  - Ajoute une entrée `invitations[]` pour chaque participant

---

### 8-7. `GET /:id`
- **Description** : Récupère tous les challenges créés par **un utilisateur spécifique**
- **Paramètre** : `:id` → `creatorId`

---

### 9. `POST /`
- **Description** : Créer un challenge
- **Règles par rôle** :
  - **USER** : ne peut **assigner ni badge, ni participants, ni salle**
  - **OWNER** : doit avoir une **salle approuvée**
  - **ADMIN** : tous droits

---

### 10. `PUT /:id`
- **Description** : Modifier un challenge
- **Règles** :
  - **USER** : ne peut modifier que **son challenge**, sans toucher à `participants`, `badges`, `salle`
  - **ADMIN** : tout modifier
  - Si le challenge passe à `completed`, déclenche l'attribution de badges/récompenses

---

### 11. `DELETE /:id`
- **Description** : Supprime un challenge
- **Accès** :
  - Seulement le **créateur** ou un **admin**

---

