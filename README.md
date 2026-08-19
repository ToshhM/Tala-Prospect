# TalaProspect - Radar Commercial Talaref

TalaProspect est un outil interne développé pour **Talaref** pour détecter, centraliser, qualifier et suivre les opportunités commerciales et missions freelance pertinentes pour l'agence.

---

## 🛠️ Stack Technique

- **Frontend**: Next.js (App Router), TypeScript strict, Tailwind CSS, Lucide icons
- **Backend**: Next.js Route Handlers, Server Actions
- **Database / ORM**: PostgreSQL (Supabase), Prisma ORM (Version 7)
- **Authentification**: NextAuth.js (Credentials, extensible Google OAuth)
- **Moteur de Test**: Vitest

---

## 🚀 Installation & Démarrage

### 1. Prérequis
Assurez-vous d'avoir installé **Node.js** (v18+) et **npm** (v9+).

### 2. Cloner et Installer les Dépendances
```bash
# Installer les dépendances
npm install
```

### 3. Configurer l'Environnement
Copiez le fichier de modèle d'environnement et ajustez-le :
```bash
cp .env.example .env
```
Remplissez les clés de connexion PostgreSQL (`DATABASE_URL` et `DIRECT_URL`).

### 4. Configuration Prisma 7
Dans Prisma 7, la configuration de connexion a changé de place. Les URLs de bases de données sont désormais définies dans le fichier de configuration centralisé `prisma.config.ts` à la racine, et non plus directement dans `schema.prisma`.

```bash
# Générer le client Prisma
npx prisma generate

# Appliquer les migrations de base de données
npx prisma migrate dev --name init

# Lancer le script de seeding (crée les sources et l'utilisateur admin par défaut)
npx prisma db seed
```
*L'utilisateur par défaut créé par le seed est **`cto@talaref.com`** avec le mot de passe **`talaref2026`**.*

### 5. Lancer l'application localement
```bash
npm run dev
```
Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

---

## 🎯 Architecture des dossiers

Le projet est organisé de manière modulaire :
- `/app` : Pages et routeurs Next.js (App Router).
- `/components` : Composants UI globaux partagés.
- `/features` : Logique métier et composants découpés par fonctionnalité.
  - `/features/opportunities` : Explorer, détails et actions.
  - `/features/pipeline` : Kanban de suivi.
  - `/features/alerts` : Alertes personnalisées et moteur de correspondance.
  - `/features/sources` : Configuration et imports.
- `/services` : Services utilitaires indépendants.
  - `/services/scoring` : Moteur de notation (0-100) et catégorisation par mots-clés.
  - `/services/deduplication` : Algorithme anti-doublon.
  - `/services/france-travail` : Connecteur et normalisation API France Travail.
- `/lib` : Clients Prisma et NextAuth.

---

## 🧪 Tests Unitaires
Pour exécuter la suite de tests unitaires (Scoring, Catégorisation, Déduplication) :
```bash
npx vitest run
```
