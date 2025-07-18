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

Gestion des Types d'Exercices :
Ajout, modification et suppression des types d'exercices disponibles. Chaque type d'exercice peut être défini
avec un nom, une description et des informations sur les muscles ciblés.

Création de Badges et Récompenses :
Possibilité pour l'administrateur de créer des badges et des récompenses virtuelles à attribuer aux
utilisateurs en fonction de leurs accomplissements dans les défis. Des badges devront être ajouté
dynamiquement au système depuis une interface en utilisant des règles.

Gestion des Utilisateurs :
Capacité à désactiver ou supprimer des comptes d'utilisateurs ainsi que des propriétaire de salle en cas de
besoin.✅
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
