# Echoppe Togo — version finale du site

Cette version conserve le frontend public existant et le professionnalise avec un logo local, deux formulaires en ligne, un espace administrateur séparé et une API Express pour recevoir les demandes.

## Architecture

Le site public est disponible à `/`. L’espace privé est disponible à `/admin` et affiche une page de connexion avant toute consultation des dossiers. Le frontend est développé avec React et Vite. Le backend utilise Express, Multer et un stockage JSON local prévu pour le prototype.

Le logo officiel est stocké dans `src/echoppe-togo-logo-blue-70-white-20-gray-10.png`. Les liens sociaux sont regroupés dans `src/components/SocialLinks.jsx`. Les règles ajoutées pour les modales et l’administration se trouvent dans `src/refactor.css`.

## Fonctionnalités finales

Le bouton « Demander un crédit en ligne » ouvre une modale fermable contenant les informations client, le montant, l’objet du financement, un message libre, une pièce d’identité obligatoire et des documents complémentaires. Les formats acceptés sont PDF, JPG et PNG, avec une limite de 10 Mo par fichier et six fichiers maximum.

Le bouton « Créer un compte » ouvre une seconde modale. La demande est enregistrée dans `data/account-requests.json`.

Les demandes de crédit sont enregistrées dans `data/credit-requests.json` et les fichiers sont conservés dans `data/uploads/`. Ces données peuvent contenir des informations personnelles : elles doivent rester hors du dépôt Git et être protégées sur un serveur réel.

## Installation et lancement

```bash
npm install
cp .env.example .env
npm run dev
```

Le frontend est accessible à `http://localhost:5173/`, l’administration à `http://localhost:5173/admin` et l’API à `http://localhost:3001`.

Pour lancer séparément les deux services :

```bash
npm run dev:web
npm run dev:api
```

Si le port 3001 est occupé, utilisez un port différent :

```bash
API_PORT=3011 node server/index.mjs
```

Puis créez un fichier `.env.local` pour Vite :

```env
VITE_API_URL=http://localhost:3011/api
```

## Compte administrateur local

Les paramètres sont définis dans `.env`. Par défaut, le modèle utilise `admin` et `change-me-now`. Changez impérativement ces valeurs avant toute utilisation réelle.

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=un-mot-de-passe-long-et-unique
```

L’API crée une session administrateur dans un cookie HttpOnly après connexion. Les routes `/api/admin/me` et `/api/admin/credit-requests` nécessitent cette session. La déconnexion invalide la session côté serveur.

Pour une production réelle, utilisez plutôt `ADMIN_PASSWORD_HASH` au format `salt:hash_hex`, avec un hash scrypt généré hors du dépôt. L’API actuelle conserve les sessions en mémoire : un déploiement multi-instance devra utiliser Redis ou un mécanisme de session partagé.

## Routes API

| Méthode | Route | Accès | Fonction |
|---|---|---|---|
| GET | `/api/health` | Public | Vérifier que l’API répond. |
| POST | `/api/credit-requests` | Public | Recevoir une demande de crédit multipart/form-data. |
| POST | `/api/account-requests` | Public | Recevoir une demande de création de compte JSON. |
| POST | `/api/admin/login` | Public contrôlé | Ouvrir une session administrateur. |
| POST | `/api/admin/logout` | Session admin | Fermer la session. |
| GET | `/api/admin/me` | Session admin | Vérifier la session courante. |
| GET | `/api/admin/credit-requests` | Session admin | Lire les demandes reçues. |

## Vérification

```bash
npm run build
node --check server/index.mjs
```

## Passage en production

Le stockage JSON et local reste adapté à une démonstration ou à un prototype. Avant de recevoir de vraies pièces d’identité, remplacez-le par PostgreSQL, placez les documents dans un bucket S3/R2 privé avec des URLs temporaires, activez HTTPS, ajoutez une authentification administrateur centralisée, journalisez les accès, mettez en place une sauvegarde chiffrée et ajoutez un antivirus ou une analyse de fichiers. Il faudra également désactiver les identifiants par défaut, utiliser `ADMIN_PASSWORD_HASH`, définir précisément `ALLOWED_ORIGINS` et ne jamais exposer directement le dossier `data/uploads`.

## Configuration production préparée

Le backend détecte automatiquement `DATABASE_URL`. Lorsqu’elle est définie, les demandes sont écrites dans PostgreSQL et les sessions administrateur utilisent `connect-pg-simple` dans la table `user_sessions`, ce qui permet à plusieurs instances de partager les sessions. Le schéma de référence est disponible dans `database/schema.sql`; le serveur initialise également les tables applicatives au démarrage.

Pour générer le hash du mot de passe administrateur :

```bash
node scripts/generate-admin-hash.mjs 'remplacer-par-un-mot-de-passe-de-12-caracteres-minimum'
```

Copiez ensuite la valeur produite dans `ADMIN_PASSWORD_HASH`. En production, configurez aussi `SESSION_SECRET` et ne définissez pas le mot de passe de démonstration `change-me-now`.

Lorsque `S3_BUCKET`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID` et `S3_SECRET_ACCESS_KEY` sont définis, les pièces jointes sont envoyées dans le bucket privé via l’API S3 compatible. Le serveur ne publie aucune URL publique des documents. Cloudflare R2 peut être utilisé en fournissant son endpoint R2 et `S3_REGION=auto`.

Exemple de variables de production :

```env
NODE_ENV=production
ALLOWED_ORIGINS=https://www.echoppe.tg,https://echoppe.tg
DATABASE_URL=postgresql://echoppe_user:mot_de_passe@db.example.com:5432/echoppe_togo
DATABASE_SSL=true
SESSION_SECRET=valeur-aleatoire-tres-longue
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=salt:hash_hex
S3_BUCKET=echoppe-togo-private
S3_ENDPOINT=https://account-id.r2.cloudflarestorage.com
S3_REGION=auto
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_SERVER_SIDE_ENCRYPTION=AES256
```

HTTPS doit être terminé par le reverse proxy ou la plateforme d’hébergement, avec redirection HTTP vers HTTPS et certificats TLS renouvelés automatiquement. Le backend active alors les cookies `Secure` et `trust proxy` lorsque `NODE_ENV=production`.

Les modèles de déploiement sont disponibles dans `deploy/`. `docker-compose.postgres.yml` fournit un PostgreSQL local de développement avec le schéma initial. `nginx.echoppe-togo.conf` fournit un reverse proxy HTTPS avec redirection HTTP, certificats Let's Encrypt, en-têtes TLS et transmission vers Vite et l’API. Il faut remplacer les domaines, installer les certificats et adapter le mode de lancement à l’hébergeur choisi avant activation.

Pour démarrer PostgreSQL localement :

```bash
docker compose -f deploy/docker-compose.postgres.yml up -d
```

Puis configurez `DATABASE_URL=postgresql://echoppe_user:change-this-database-password@localhost:5432/echoppe_togo` dans l’environnement de l’API. La présence de `DATABASE_URL` active aussi le stockage PostgreSQL des sessions, ce qui évite de dépendre de la mémoire d’un seul processus.
