/**
 * Script de migration automatique de SQLite (batipromo.db) vers PostgreSQL
 * Utilisation : DATABASE_URL=postgres://user:password@host:5432/dbname node server/migrate_sqlite_to_pg.js
 */

const { Pool } = require('pg');
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ ERREUR : La variable d'environnement DATABASE_URL n'est pas définie.");
  console.log("Exemple : DATABASE_URL=\"postgresql://postgres:motdepasse@localhost:5432/batipromo\" node server/migrate_sqlite_to_pg.js");
  process.exit(1);
}

const sqlitePath = path.resolve(__dirname, '..', 'batipromo.db');
if (!fs.existsSync(sqlitePath)) {
  console.error(`❌ Fichier SQLite introuvable : ${sqlitePath}`);
  process.exit(1);
}

const sqliteDb = new DatabaseSync(sqlitePath);
const pgPool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1') ? false : { rejectUnauthorized: false }
});

const TABLES_ORDER = [
  'users',
  'roles',
  'role_permissions',
  'chantiers',
  'user_chantiers',
  'caisses',
  'beneficiaires',
  'fournisseurs',
  'caisse_mouvements',
  'depenses',
  'clients',
  'ventes',
  'client_reglements',
  'employees',
  'employee_affectations',
  'employee_pointages',
  'paies',
  'materiel',
  'materiel_affectations',
  'materiel_consommations',
  'stocks_articles',
  'stocks_niveaux',
  'stocks_mouvements',
  'documents',
  'audit_logs',
  'notifications',
  'company_settings',
  'chantier_planning'
];

async function migrate() {
  const client = await pgPool.connect();
  console.log('🚀 Connexion réussie à PostgreSQL.');

  try {
    // 1. Initialiser le schéma PostgreSQL
    console.log('📦 Création des tables PostgreSQL depuis schema_postgres.sql...');
    const schemaSql = fs.readFileSync(path.resolve(__dirname, 'schema_postgres.sql'), 'utf-8');
    await client.query(schemaSql);
    console.log('✅ Schéma PostgreSQL initialisé.');

    // 2. Transférer les données table par table
    for (const table of TABLES_ORDER) {
      try {
        const rows = sqliteDb.prepare(`SELECT * FROM ${table}`).all();
        if (rows.length === 0) {
          console.log(`ℹ️  Table ${table}: 0 ligne à migrer.`);
          continue;
        }

        console.log(`⏳ Migration de la table ${table} (${rows.length} lignes)...`);

        for (const row of rows) {
          const keys = Object.keys(row);
          const values = keys.map(k => {
            const val = row[k];
            // Conversion booléens 0/1 pour colonnes booléennes PG
            if (['is_sensible', 'is_depot_central', 'is_system', 'is_read', 'exiger_validation_toutes_sorties'].includes(k)) {
              return val === 1 || val === true;
            }
            return val;
          });

          const cols = keys.map(k => `"${k}"`).join(', ');
          const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

          const query = `
            INSERT INTO "${table}" (${cols})
            VALUES (${placeholders})
            ON CONFLICT DO NOTHING
          `;
          await client.query(query, values);
        }

        // 3. Mettre à jour les séquences d'autoincrement PG
        try {
          const seqResult = await client.query(`
            SELECT pg_get_serial_sequence($1, 'id') as seq_name
          `, [table]);

          if (seqResult.rows[0]?.seq_name) {
            await client.query(`
              SELECT setval(pg_get_serial_sequence($1, 'id'), COALESCE(MAX(id), 1)) FROM "${table}"
            `, [table]);
          }
        } catch (seqErr) {
          // Si la table n'a pas de colonne ID autoincrément, ignorer
        }

        console.log(`✅ Table ${table} migrée avec succès.`);
      } catch (tableErr) {
        console.warn(`⚠️ Avertissement sur table ${table}:`, tableErr.message);
      }
    }

    console.log('\n======================================================');
    console.log('🎉 MIGRATION VERS POSTGRESQL TERMINÉE AVEC SUCCÈS !');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Erreur générale lors de la migration :', err);
  } finally {
    client.release();
    await pgPool.end();
  }
}

migrate();
