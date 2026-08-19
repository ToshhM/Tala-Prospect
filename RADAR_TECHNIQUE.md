# 🛰️ TalaProspect — Radar Technique

> Documentation interne sur le fonctionnement du radar commercial Talaref.
> Mise à jour : août 2026

---

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Sources actives et leur méthode](#sources-actives-et-leur-méthode)
3. [Pipeline de traitement](#pipeline-de-traitement)
4. [Moteur de scoring](#moteur-de-scoring)
5. [Moteur de catégorisation](#moteur-de-catégorisation)
6. [Déduplication](#déduplication)
7. [Cadence de synchronisation (6h)](#cadence-de-synchronisation-6h)
8. [État réel vs simulé](#état-réel-vs-simulé)

---

## Vue d'ensemble

TalaProspect est un radar commercial qui **agrège automatiquement des opportunités** (missions, offres, appels d'offres) depuis plusieurs plateformes, les **analyse**, leur attribue un **score de pertinence Talaref**, et les affiche dans un tableau de bord CRM pour l'équipe commerciale.

```
Plateforme externe
      │
      ▼
 Scraping / API          ← Récupération des offres brutes
      │
      ▼
 Normalisation           ← Mise au format standard interne
      │
      ▼
 Catégorisation          ← PHOTO / VIDEO / EVENT / WEB / ...
      │
      ▼
 Scoring (0-100)         ← Score de pertinence Talaref
      │
      ▼
 Déduplication           ← Évite les doublons cross-sources
      │
      ▼
 Base de données         ← Stockage Postgres via Prisma
      │
      ▼
 Dashboard TalaProspect  ← Affiché à l'équipe
```

---

## Sources actives et leur méthode

### 1. 🇫🇷 France Travail API
**Statut :** ✅ API officielle intégrée  
**Fichier :** `services/france-travail/france-travail.ts`

**Comment ça marche :**
- Authentification **OAuth2** `client_credentials` avec les clés `FRANCE_TRAVAIL_CLIENT_ID` / `CLIENT_SECRET`
- Token renégocié automatiquement à l'expiration (cache en mémoire)
- Requêtes sur l'endpoint : `https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search`
- Plage de résultats : 150 offres max par requête (`range=0-149`)
- Gestion du **rate limiting HTTP 429** avec retry automatique après 2 secondes

**Mots-clés recherchés :**
```
photographe, videaste, evenementiel,
developpeur web, nextjs,
community manager, content manager
```

**Données extraites :**
- Titre, entreprise, description, localisation
- Type de contrat (Freelance, CDI, Stage...)
- Salaire min/max (parse depuis `salaire.libelle` si non structuré)
- Contact direct (nom, email, téléphone)
- URL de l'offre d'origine
- Date de publication / expiration

**Fallback :** Si pas de clés API configurées → données mock haute qualité pour dev local

---

### 2. 💼 HelloWork
**Statut :** ⚠️ Scraper HTML (fragile — anti-bot possible)  
**Fichier :** `services/hellowork/hellowork.ts`

**Comment ça marche :**
- Requête HTTP GET sur `https://www.hellowork.com/fr-fr/emploi.html?k={keyword}&l={location}`
- Headers user-agent browser simulés pour contourner les blocages basiques
- Parse du HTML retourné avec **regex** sur les éléments `<li class="offre">` :
  - Titre via `<h2><a href="...">Titre</a></h2>`
  - Entreprise via `<span class="company">`
  - Localisation via `<span class="location">` ou `data-location`
  - Type de contrat via `<span class="contract">`
  - Description via `<p class="description">`
- Résultats limités à **15 offres par requête**
- Cache Next.js 1h (`next: { revalidate: 3600 }`)

**Fallback :** Si 0 résultat parsé (Cloudflare, changement de HTML) → 6 offres mock réalistes générées

---

### 3. 🔵 LinkedIn
**Statut :** ⚡ Simulé (données mock réalistes)  
**Fichier :** `services/linkedin/linkedin.ts`

**Pourquoi simulé :**  
LinkedIn bloque **agressivement** le scraping non authentifié (Cloudflare, rate limiting, login wall). L'API officielle LinkedIn ne donne pas accès aux offres publiques sans partenariat.

**Comment ça marche actuellement :**
- Pool de **6 offres mock** avec entreprises réelles (Brut., Konbini, L'Oréal, Publicis Live, SMCP, Agence Locomotive)
- URLs LinkedIn réelles au format `linkedin.com/jobs/view/{id}`
- Filtre par mots-clés sur titre + description
- Contacts simulés au format LinkedIn URL

**Évolution prévue :**  
→ Intégration d'un service tiers de scraping LinkedIn (Apify, ProxyCurl, ScrapingBee)

---

### 4. 🟠 Welcome to the Jungle (WTTJ)
**Statut :** ⚡ Simulé via `syncMockSourceOpportunities`  
**Fichier :** `services/hellowork/hellowork.ts` (fonction générique)

- 2 offres mock génériques injectées à chaque sync
- Déduplication via `externalId` → pas de duplication si déjà présent

---

### 5. 🔴 Indeed, Facebook Jobs, Glassdoor
**Statut :** ⚡ Simulé via `syncMockSourceOpportunities`

- Même logique que WTTJ
- Sources référencées en BDD mais non scrapées réellement

---

### 6. ✍️ Import Manuel
**Statut :** ✅ Opérationnel  
**Fichier :** `features/sources/actions.ts` → `createManualOpportunity()`

- L'équipe saisit directement une opportunité via le formulaire dans Sources
- Catégorisation + scoring calculés automatiquement
- Statut par défaut : `TO_QUALIFY`
- Traçabilité : action loguée avec `userId`

---

## Pipeline de traitement

Pour **chaque offre** récupérée, le pipeline est le suivant :

```
1. Normalisation
   └─ Mise au format standard (title, companyName, location, contractType, etc.)

2. Catégorisation
   └─ Analyse texte (titre + description) → catégorie + sous-catégorie + keywords

3. Scoring
   └─ Calcul d'un score 0-100 selon 10 critères (voir section Scoring)

4. Filtrage
   └─ Si catégorie = OTHER → offre ignorée (sauf si "communication" dans le titre)

5. Déduplication
   └─ Vérif exacte (source + externalId) puis similarité floue (titre + entreprise + date)

6. Persistance
   └─ INSERT (nouveau) ou UPDATE score (existant) dans Postgres via Prisma

7. SyncJob Log
   └─ Enregistrement : itemsFetched, itemsCreated, itemsUpdated, itemsSkipped
```

---

## Moteur de scoring

**Fichier :** `services/scoring/scoring.ts`

Score entre **0 et 100**. Calculé selon 10 critères cumulatifs :

| # | Critère | Points |
|---|---------|--------|
| 1 | Budget ≥ 2 000 € | +30 |
| 2 | Localisé Paris / Île-de-France | +20 |
| 3 | Catégorie cœur Talaref (PHOTO, VIDEO, EVENT) | +20 |
| 4 | Contact direct disponible | +15 |
| 5 | Publiée il y a moins de 48h | +10 |
| 6 | Client direct | +10 |
| 7 | Urgence détectée | +10 |
| 8 | Contrat Freelance / Mission | +10 |
| 9 | Catégorie compatible agence (non-cœur) | +10 |
| 10 | Budget < 500 € | -20 |
| 11 | CDI classique | -20 |
| 12 | Stage / Alternance | -20 |
| 13 | Catégorie OTHER | -20 |
| 14 | Publication > 15 jours | -30 |

**Niveaux de priorité :**

| Score | Priorité |
|-------|----------|
| ≥ 85 (ou ≥ 75 + urgent) | 🔴 CRITIQUE |
| ≥ 70 | 🟠 HAUTE |
| ≥ 40 | 🟡 MOYENNE |
| < 40 | ⚪ FAIBLE |

---

## Moteur de catégorisation

**Fichier :** `services/scoring/categorization.ts`

Analyse le texte (titre × 5 pts, description × 1 pt par mot-clé) :

| Catégorie | Mots-clés déclencheurs |
|-----------|------------------------|
| **PHOTO** | photographe, shooting, photo, portrait, packshot, studio photo... |
| **VIDEO** | vidéaste, vidéo, captation, aftermovie, monteur, cadreur, réalisateur... |
| **EVENT** | événement, salon, festival, conférence, séminaire, soirée... |
| **SOCIAL_MEDIA** | instagram, tiktok, community manager, réseaux sociaux... |
| **DESIGN** | graphiste, designer, logo, branding, UI/UX... |
| **WEB** | développeur, react, next.js, wordpress, frontend, backend... |
| **PODCAST** | podcast, audio, voix off, studio son... |
| **FORMATION** | formateur, workshop, atelier... |
| **COMMERCIAL** | commercial, sales, bizdev, prospection... |
| **MARKETING** | seo, ads, newsletter, growth... |
| **COMMUNICATION** | relations presse, rédacteur, presse... |
| **INFLUENCE** | influenceur, créateur de contenu... |
| **OTHER** | (aucun match) → offre filtrée |

**Sous-catégories** détectées pour VIDEO et PHOTO :
- VIDEO : tournage, montage, realisation, aftermovie, captation, interview, publicite
- PHOTO : shooting, corporate, evenementiel, immobilier, mode, produit

---

## Déduplication

**Fichier :** `services/deduplication/deduplication.ts`

**2 niveaux de vérification :**

1. **Match exact** : `source` + `externalId` → lookup direct en BDD
2. **Match flou** : même entreprise + même titre normalisé + date de publication ±3 jours  
   (utile pour les offres cross-publiées sur plusieurs plateformes)

Si doublon détecté → mise à jour du score uniquement, **statut CRM préservé**.

---

## Cadence de synchronisation (6h)

**Fréquence :** toutes les 6 heures — 4 syncs par jour  
**Horaires :** 06:00, 12:00, 18:00, 00:00 (UTC)

**Configuration via Vercel Cron** (`vercel.json`) :

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-all",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

**Route cron :** `app/api/cron/sync-all/route.ts`  
Synchronise dans l'ordre :
1. France Travail (API officielle)
2. HelloWork (scraper HTML)
3. LinkedIn (mock / futur scraper tiers)
4. WTTJ, Indeed, Facebook, Glassdoor (mock)

**Sécurité :** La route valide le header `Authorization: Bearer {CRON_SECRET}` pour éviter les appels non autorisés.

---

## État réel vs simulé

| Source | Données réelles ? | Méthode |
|--------|------------------|---------|
| France Travail | ✅ Oui (si clés API configurées) | API OAuth2 officielle |
| HelloWork | ⚠️ Partiel | Scraper HTML (peut être bloqué) |
| LinkedIn | ❌ Non | Mock réaliste |
| WTTJ | ❌ Non | Mock générique |
| Indeed | ❌ Non | Mock générique |
| Facebook Jobs | ❌ Non | Mock générique |
| Glassdoor | ❌ Non | Mock générique |
| Import Manuel | ✅ Oui | Saisie directe équipe |

> **Priorité technique** : Intégrer un vrai scraper LinkedIn (ex: ProxyCurl API ~$0.001/profil) et activer les vraies API HelloWork / WTTJ pour avoir un radar 100% réel.

---

*Document généré automatiquement depuis l'analyse du code source TalaProspect.*
