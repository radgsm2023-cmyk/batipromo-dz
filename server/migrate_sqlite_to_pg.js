/**
 * Script de migration automatique de SQLite (batipromo.db) vers PostgreSQL
 * Supporte les URLs directes et les poolers IPv4 Supabase
 */

const { Pool } = require('pg');
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

let rawUrl = process.env.DATABASE_URL || process.argv[2];

if (!rawUrl) {
  console.error("❌ ERREUR : La variable d'environnement DATABASE_URL ou argument n'est pas définie.");
  process.exit(1);
}

// Nettoyage et parsing sécurisé de l'URL Supabase
function createPgPool(inputUrl) {
  // Détection Supabase direct -> pooler IPv4 si nécessaire
  const supabaseMatch = inputUrl.match(/postgres:\/\/([^:]+):(.*)@db\.([a-z0-9]+)\.supabase\.co:5432\/(.*)/);
  if (supabaseMatch) {
    const [_, user, pass, projectRef, dbname] = supabaseMatch;
    console.log(`🔌 Détection d'un projet Supabase (${projectRef}), utilisation du pooler IPv4 Session (eu-west-1:5432)...`);
    return new Pool({
      host: 'aws-0-eu-west-1.pooler.supabase.com',
      port: 5432,
      user: `${user}.${projectRef}`,
      password: pass,
      database: dbname || 'postgres',
      ssl: { rejectUnauthorized: false }
    });
  }

  return new Pool({
    connectionString: inputUrl,
    ssl: inputUrl.includes('localhost') || inputUrl.includes('127.0.0.1') ? false : { rejectUnauthorized: false }
  });
}

const sqlitePath = path.resolve(__dirname, '..', 'batipromo.db');
if (!fs.existsSync(sqlitePath)) {
  console.error(`❌ Fichier SQLite introuvable : ${sqlitePath}`);
  process.exit(1);
}

const sqliteDb = new DatabaseSync(sqlitePath);
const pgPool = createPgPool(rawUrl);

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
  let client;
  try {
    client = await pgPool.connect();
    console.log('🚀 Connexion réussie à la base PostgreSQL Supabase !');
  } catch (err) {
    console.error('❌ Échec de connexion à PostgreSQL :', err.message);
    process.exit(1);
  }

  try {
    // 1. Initialiser le schéma PostgreSQL
    console.log('📦 Création des tables PostgreSQL depuis schema_postgres.sql...');
    const schemaSql = fs.readFileSync(path.resolve(__dirname, 'schema_postgres.sql'), 'utf-8');
    await client.query(schemaSql);
    console.log('✅ Schéma PostgreSQL initialisé avec succès.');

    // 2. Transférer les données table par table
    for (const table of TABLES_ORDER) {
      try {
        const rows = sqliteDb.prepare(`SELECT * FROM ${table}`).all();
        if (rows.length === 0) {
          console.log(`ℹ️  Table ${table}: 0 ligne à migrer.`);
          continue;
        }

        console.log(`⏳ Migration de la table ${table} (${rows.length} enregistrements)...`);

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
        } catch (seqErr) {}

        console.log(`✅ Table ${table} migrée avec succès.`);
      } catch (tableErr) {
        console.warn(`⚠️ Table ${table} :`, tableErr.message);
      }
    }

    // Vérification finale des comptages dans Supabase
    console.log('\n📊 Résumé des données migrées dans Supabase :');
    for (const table of ['users', 'chantiers', 'caisses', 'caisse_mouvements', 'depenses', 'ventes', 'employees', 'materiel', 'stocks_articles', 'chantier_planning', 'company_settings']) {
      try {
        const res = await client.query(`SELECT COUNT(*) as cnt FROM "${table}"`);
        console.log(` - ${table} : ${res.rows[0].cnt} enregistrements`);
      } catch (e) {}
    }

    console.log('\n======================================================');
    console.log('🎉 MIGRATION VERS SUPABASE TERMINÉE AVEC SUCCÈS !');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Erreur générale lors de la migration :', err);
  } finally {
    client.release();
    await pgPool.end();
  }
}

migrate();
