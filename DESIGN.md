# Fictio - Document de Spécifications Produit (PRD)

## 1. Vision du Produit
**Fictio** est un jeu de société numérique multijoueur centré sur le bluff, la créativité et la déduction. Inspiré des jeux de salon classiques comme le "dictionnaire", il permet à des amis de se réunir en ligne pour inventer des définitions crédibles à des mots obscurs et démasquer la vérité parmi les mensonges de leurs adversaires.

## 2. Public Cible
- Jeunes adultes (18-35 ans) amateurs de jeux de société.
- Groupes d'amis cherchant une activité interactive à distance.
- Utilisateurs occasionnels privilégiant une expérience "pick up and play" sans installation lourde.

## 3. Parcours Utilisateur & Fonctionnalités Clés

### A. Accueil & Accessibilité
- **Création de salle** : L'hôte génère un code unique pour inviter des joueurs.
- **Système de code** : Rejoindre rapidement via un code à 4-6 lettres.
- **Identité** : Choix d'un pseudonyme et attribution automatique d'un avatar "Pop".

### B. Lobby (Salon d'attente)
- Affichage en temps réel des joueurs connectés.
- Statut de l'hôte (gestion du lancement de la partie).
- Nombre de joueurs requis : 3 à 8 joueurs.

### C. Boucle de Jeu (Round)
1. **Phase de Bluff** : Un mot rare ou une question compliqué est affiché. Chaque joueur doit soumettre une fausse définition ou une fausse réponse la plus convaincante possible.
2. **Phase de Vote** : Toutes les propositions (fausses + vraie) sont mélangées. Les joueurs votent pour celle qu'ils pensent être la bonne.
3. **Résultats du tour** : Révélation de la vraie réponse. Attribution des points :
   - Points pour avoir trouvé la vraie réponse.
   - Points pour chaque adversaire ayant voté pour votre bluff.

### D. Fin de Partie
- Leaderboard final récapitulatif.
- Podium animé mettant en avant les meilleurs bluffeurs.
- Option "Rejouer" ou "Retour au menu".

## 4. Identité Visuelle (Design System : Electric Pop)
- **Style** : Flat Design moderne, néo-brutalisme léger.
- **Palette** : Fond clair (blanc cassé/gris très léger) avec accents Bleu Électrique (#0052ff), Rose Néon et Jaune Vif.
- **Typographie** : Bricolage Grotesque (Grasse, arrondie, lisible).
- **Composants** : Gros boutons avec ombres portées noires (hard shadows), coins très arrondis (Round Full), et bordures épaisses pour un aspect tactile et ludique.

## 5. Spécifications Techniques
- **Plateforme** : Web application responsive (Mobile First).
- **Frontend** : HTML5 / Tailwind CSS / JavaScript.
- **Interactions** : Animations CSS pour les transitions de phase et les effets de confetti en fin de partie.
