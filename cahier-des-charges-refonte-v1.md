# Cahier des charges — Évolution du site Echoppe Togo

## 1. Objet du document

Ce document décrit l’état réel de l’archive `echoppe-togo-credit-form-final.zip` reçue et les évolutions demandées avant toute nouvelle modification du code. Il sert de référence de validation. **Aucun changement de code n’est inclus dans ce document.**

## 2. État existant après analyse

L’archive contient un frontend React/Vite et une petite API Express locale. Le projet est encore principalement une **one page** : toutes les sections du site sont rendues dans `src/EchoppeTogo.jsx` et les liens de navigation utilisent des ancres comme `#services`, `#contact` et `#demande-credit`.

| Élément existant | État constaté |
|---|---|
| Technologie frontend | React 18 + Vite 5 |
| Point d’entrée | `src/main.jsx` |
| Composant principal | `src/EchoppeTogo.jsx` |
| Styles du formulaire | `src/credit-form.css` |
| Backend | Express dans `server/index.mjs` |
| Persistance | Fichier JSON local `data/credit-requests.json` créé au démarrage |
| Téléversement | Multer, stockage local dans `data/uploads/` |
| Base PostgreSQL | Absente de cette archive |
| Page admin | Absente de cette archive reçue |
| Routes React | Pas de routeur multi-pages ; navigation par ancres |
| Logo demandé | Le fichier `src/echoppe-togo-logo-blue-70-white-20-gray-10.png` n’est pas présent dans l’inventaire de cette archive et devra être ajouté |
| Réseaux sociaux | Le composant réutilisable demandé n’existe pas encore dans un fichier séparé |

## 3. Fonctionnalités déjà présentes

### Site public

Le site contient déjà les sections institutionnelles, la navigation, les services, les partenaires, l’impact, la galerie, les témoignages, les informations complémentaires, le contact et le pied de page. Le frontend d’origine doit être conservé autant que possible.

### Formulaire de demande de crédit

Une section `CreditRequestSection` existe déjà dans le composant principal. Elle recueille le nom complet, le téléphone, l’adresse e-mail, la ville, le type de crédit, le montant, l’objet du financement, un message libre, une pièce d’identité obligatoire et des documents complémentaires facultatifs.

Le formulaire utilise `FormData` et envoie les données vers :

```text
POST /api/credit-requests
```

Après réception, le frontend affiche un message de succès. L’API enregistre les données dans un fichier JSON et les fichiers dans un dossier local.

### API existante

Le serveur expose actuellement :

```text
GET  /api/health
POST /api/credit-requests
```

Cette API est adaptée au prototype local. Elle n’est pas une solution de production, car elle n’utilise ni PostgreSQL, ni authentification administrateur, ni stockage privé des documents.

## 4. Modifications demandées

### 4.1 Unifier le logo

Le fichier suivant devra devenir l’unique logo utilisé dans le site :

```text
src/echoppe-togo-logo-blue-70-white-20-gray-10.png
```

Il devra remplacer les autres références de logo éventuelles dans :

- la navigation ;
- le pied de page ;
- les écrans de formulaire ;
- l’administration ;
- les balises `favicon` et `apple-touch-icon` si une version adaptée est disponible.

Avant l’intégration, il faudra vérifier que le fichier existe réellement dans `src/`. S’il manque, il faudra le copier dans ce dossier sans modifier son contenu.

### 4.2 Séparer le site public et l’administration par URL

Le site public devra rester accessible à :

```text
http://localhost:5173/
```

L’administration devra être accessible séparément à :

```text
http://localhost:5173/admin
```

Sur `/`, le visiteur ne devra voir ni le tableau de bord, ni les données privées, ni un bouton admin flottant inutile. Sur `/admin`, l’application devra afficher uniquement la connexion administrateur ou le tableau de bord après authentification.

La première version peut conserver un seul projet frontend avec une séparation par route. Une séparation en deux projets ou deux déploiements pourra être réalisée plus tard si nécessaire. Le backend et la base de données resteront communs.

### 4.3 Ajouter deux boutons d’action

Deux boutons principaux devront être visibles dans une zone claire du site public :

| Bouton | Comportement |
|---|---|
| `Demander un crédit en ligne` | Ouvre le formulaire de demande de crédit |
| `Créer un compte` | Ouvre le formulaire de création de compte |

Les formulaires ne devront pas être affichés en permanence au bas de la one page. Ils devront s’ouvrir après clic, sous forme de panneau modal ou de section contrôlée, avec :

- un bouton de fermeture ;
- un arrière-plan permettant de fermer le panneau ;
- une navigation clavier correcte ;
- un affichage responsive ;
- un message de succès après soumission ;
- un message d’erreur compréhensible en cas d’échec.

Le formulaire de crédit devra conserver ses champs actuels. Le formulaire de création de compte devra reprendre les champs déjà prévus ou être défini précisément avant son branchement backend.

### 4.4 Intégrer les liens sociaux

Le code fourni devra être intégré dans un composant séparé :

```text
src/components/SocialLinks.jsx
```

Le composant devra être réutilisé dans le pied de page et, si nécessaire, dans une section de contact. Les liens d’exemple devront être remplacés par les vraies adresses des comptes Echoppe Togo.

La version installée de `lucide-react` devra être vérifiée avant l’intégration. Les icônes de marques comme `Instagram`, `Facebook`, `Youtube` ou `Tiktok` ne sont pas forcément exportées par toutes les versions de Lucide. Si une icône n’existe pas, elle devra être remplacée par une icône compatible, sans provoquer d’erreur de build.

### 4.5 Nettoyer et professionnaliser le code

L’analyse devra rechercher :

- les composants déclarés plusieurs fois ;
- les imports inutilisés ;
- les styles en ligne qui peuvent être centralisés ;
- les mêmes textes ou liens répétés ;
- les formulaires dupliqués ;
- les références de logo différentes ;
- les constantes qui doivent être regroupées ;
- les fonctions trop longues dans `EchoppeTogo.jsx`.

Les éléments communs devront être déplacés vers des composants ou fichiers dédiés, par exemple :

```text
src/components/SocialLinks.jsx
src/components/FormModal.jsx
src/components/Logo.jsx
src/config/site.js
src/styles/refactor.css
```

Le nettoyage ne devra pas changer inutilement le design ni supprimer une fonctionnalité existante.

## 5. Administration prévue

La page `/admin` devra prévoir une séparation claire avec le site public. Dans cette étape, elle pourra contenir :

- une page de connexion ;
- un résumé des demandes ;
- une liste des demandes de crédit ;
- l’affichage du statut ;
- la possibilité de modifier le statut si l’API le permet ;
- la déconnexion.

Les données privées ne devront être accessibles qu’après authentification. Le lien direct `/admin` ne doit pas être considéré comme une sécurité suffisante : la protection doit être faite côté backend.

## 6. Backend et données dans cette étape

La présente demande porte principalement sur l’organisation du frontend et des interactions. L’API JSON existante pourra rester utilisée pour les tests locaux, mais elle devra être clairement identifiée comme prototype.

Pour la production, une étape séparée devra remplacer :

```text
data/credit-requests.json
 data/uploads/
```

par :

```text
PostgreSQL pour les données
S3 ou Cloudflare R2 privé pour les documents
```

Les fichiers `.env`, les demandes de test, les documents téléversés et `node_modules` ne devront jamais être inclus dans une archive finale ni envoyés sur GitHub.

## 7. Critères d’acceptation

La réalisation sera considérée comme conforme lorsque :

1. `http://localhost:5173/` affiche uniquement le site public.
2. `http://localhost:5173/admin` affiche uniquement l’espace d’administration.
3. Le logo utilisé partout provient de `src/echoppe-togo-logo-blue-70-white-20-gray-10.png`.
4. Le bouton de crédit ouvre uniquement le formulaire de crédit.
5. Le bouton de création de compte ouvre uniquement le formulaire de compte.
6. Les deux formulaires peuvent être fermés sans recharger la page.
7. Le formulaire de crédit conserve le téléversement de fichiers.
8. Les liens sociaux sont regroupés dans un composant réutilisable.
9. Les doublons et imports inutilisés identifiés sont nettoyés.
10. `npm run build` réussit sans erreur bloquante.
11. Aucun secret, fichier `.env`, document personnel ou base locale n’est présent dans l’archive finale.
12. Le site fonctionne sur mobile et ordinateur.

## 8. Hors périmètre immédiat

Les éléments suivants ne seront pas développés sans validation supplémentaire :

- migration réelle vers PostgreSQL ;
- déploiement sur un hébergeur ;
- stockage S3/R2 ;
- authentification OAuth/OIDC avec MFA ;
- notifications SMS, WhatsApp ou e-mail ;
- décision automatique d’octroi de crédit ;
- espace client complet ;
- traitement bancaire ou paiement en ligne.

## 9. Méthode de réalisation proposée

La réalisation se fera en cinq étapes contrôlées. D’abord, le code sera nettoyé et le logo sera unifié. Ensuite, le routage public/admin sera stabilisé. Puis les deux boutons et les panneaux de formulaire seront ajoutés. Les liens sociaux seront extraits dans un composant réutilisable et les erreurs de compilation seront corrigées. Enfin, les routes `/`, `/admin`, les formulaires, le build et l’absence de secrets dans l’archive seront vérifiés.

## 10. Validation demandée

Avant de commencer, il faut valider les décisions suivantes :

| Décision | Proposition |
|---|---|
| Design public | Le conserver sans refonte |
| URL publique | `/` |
| URL admin | `/admin` |
| Ouverture des formulaires | Panneaux modaux après clic |
| Logo | Uniquement `src/echoppe-togo-logo-blue-70-white-20-gray-10.png` |
| Réseaux sociaux | Composant séparé réutilisable |
| API locale | Conservée pour les tests uniquement |
| Production | PostgreSQL + stockage privé à traiter dans une étape dédiée |

**Aucune modification du code ne sera effectuée tant que ce cahier des charges n’est pas validé.**
