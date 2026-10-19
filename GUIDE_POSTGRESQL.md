# 🐘 Guide de Mise en Route PostgreSQL - BATIPROMO DZ

Ce guide explique comment faire fonctionner votre application **BATIPROMO DZ** avec **PostgreSQL** pour une utilisation multi-utilisateurs haute performance en production.

---

## 1. ☁️ Obtenir une Base PostgreSQL Gratuite en 2 Minutes

Vous avez plusieurs options simples et sans frais :

### Option A : Cloud Managé Gratuit (Recommandé - Neon.tech ou Supabase)
1. Rendez-vous sur **[Neon.tech](https://neon.tech)** ou **[Supabase.com](https://supabase.com)**.
2. Créez un compte gratuit et cliquez sur **« Create Project »**.
3. Vous obtenez immédiatement votre lien de connexion `DATABASE_URL` sécurisé en HTTPS/SSL, par exemple :
   ```text
   postgresql://alex:motdepasse@ep-unique-id.eu-central-1.aws.neon.tech/batipromo_db?sslmode=require
   ```

### Option B : Avec Docker (Sur votre PC ou Serveur Linux)
Si vous avez Docker installé, lancez simplement :
```bash
docker compose up -d db
```
Votre PostgreSQL est accessible sur `localhost:5432` avec les identifiants configurés dans `docker-compose.yml`.

---

## 2. 🔄 Migration Automatique de vos Données SQLite vers PostgreSQL

Toutes vos données déjà saisies dans `batipromo.db` (chantiers, caisses, plannings, employés, factures) peuvent être transférées en **une seule commande** :

Dans votre terminal PowerShell :
```powershell
$env:DATABASE_URL="postgresql://utilisateur:motdepasse@hote:5432/nom_base?sslmode=require"
node server/migrate_sqlite_to_pg.js
```

Le script va :
* Créer l'ensemble des 27 tables et index optimisés PostgreSQL.
* Copier toutes les données existantes sans perte.
* Ajuster automatiquement les séquences d'identifiants auto-incrémentés.

---

## 3. 🚀 Démarrer l'Application avec PostgreSQL

Il vous suffit de définir la variable `DATABASE_URL` avant de lancer le serveur :

### Sous Windows (PowerShell) :
```powershell
$env:DATABASE_URL="postgresql://utilisateur:motdepasse@hote:5432/nom_base?sslmode=require"
npm start
```

### Avec Docker Compose (Stack Complète Web + PostgreSQL) :
```bash
docker compose up -d --build
```
L'application et la base de données PostgreSQL tournent ensemble de façon autonome.

---

## 4. 🛡️ Sauvegardes de Sécurité (Backups PostgreSQL)

Pour sauvegarder votre base de données PostgreSQL :
```bash
pg_dump "VOTRE_DATABASE_URL" > sauvegarde_batipromo.sql
```
Pour restaurer une sauvegarde :
```bash
psql "VOTRE_DATABASE_URL" < sauvegarde_batipromo.sql
```
*(Sur Neon/Supabase, les sauvegardes sont gérées automatiquement chaque jour).*
