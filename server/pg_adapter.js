/**
 * Adaptateur PostgreSQL synchrone émulant l'API SQLite DatabaseSync
 * Permet d'interroger directement Supabase PostgreSQL sans changer les 243 requêtes de l'application.
 */

const { Worker } = require('node:worker_threads');
const path = require('node:path');

function createPgDatabase(connectionString) {
  const BUFFER_SIZE = 16 * 1024 * 1024; // 16MB buffer
  const sharedBuffer = new SharedArrayBuffer(BUFFER_SIZE);
  const statusArray = new Int32Array(sharedBuffer, 0, 1);
  const lengthArray = new Int32Array(sharedBuffer, 4, 1);
  const dataArray = new Uint8Array(sharedBuffer, 8);
  const decoder = new TextDecoder();

  const worker = new Worker(path.resolve(__dirname, 'pg_worker.js'), {
    workerData: { sharedBuffer, connectionString }
  });

  // Éviter que le worker empêche le processus de s'arrêter proprement
  worker.unref();

  function executeQuery(sql, params, isExec = false) {
    Atomics.store(statusArray, 0, 0);
    worker.postMessage({ sql, params, isExec });
    const waitRes = Atomics.wait(statusArray, 0, 0, 15000);
    if (waitRes === 'timed-out') {
      throw new Error('Délai d\'attente de requête PostgreSQL dépassé (timeout 15s)');
    }
    const len = lengthArray[0];
    const jsonStr = decoder.decode(dataArray.subarray(0, len));
    const result = JSON.parse(jsonStr);
    if (!result.ok) {
      throw new Error(`Erreur PostgreSQL : ${result.error} (dans la requête : ${sql})`);
    }
    return result;
  }

  function translateSql(originalSql) {
    let sql = originalSql.trim();

    // 1. Conversion des strftime SQLite vers TO_CHAR PostgreSQL
    // strftime('%Y-%m', date) -> TO_CHAR(date, 'YYYY-MM')
    sql = sql.replace(/strftime\s*\(\s*'%Y-%m'\s*,\s*([^)]+)\)/gi, "TO_CHAR($1, 'YYYY-MM')");
    sql = sql.replace(/strftime\s*\(\s*'%Y'\s*,\s*([^)]+)\)/gi, "TO_CHAR($1, 'YYYY')");

    // 2. Conversion INSERT OR IGNORE -> INSERT INTO ... ON CONFLICT DO NOTHING
    sql = sql.replace(/INSERT\s+OR\s+IGNORE\s+INTO/gi, 'INSERT INTO');
    if (originalSql.match(/INSERT\s+OR\s+IGNORE\s+INTO/i) && !sql.match(/ON\s+CONFLICT/i)) {
      sql += ' ON CONFLICT DO NOTHING';
    }

    // 3. Conversion des placeholders ? en $1, $2, ...
    let paramIndex = 0;
    sql = sql.replace(/\?/g, () => `$${++paramIndex}`);

    return sql;
  }

  function formatParams(args) {
    if (args.length === 1 && Array.isArray(args[0])) {
      return args[0];
    }
    return args;
  }

  return {
    isPostgres: true,
    prepare(rawSql) {
      const translatedSql = translateSql(rawSql);

      return {
        all(...args) {
          const params = formatParams(args);
          const res = executeQuery(translatedSql, params, false);
          return res.rows;
        },
        get(...args) {
          const params = formatParams(args);
          const res = executeQuery(translatedSql, params, false);
          return res.rows[0];
        },
        run(...args) {
          const params = formatParams(args);
          let sqlToRun = translatedSql;
          const isInsert = /^\s*INSERT\s+INTO/i.test(sqlToRun);
          if (isInsert && !/RETURNING/i.test(sqlToRun)) {
            sqlToRun += ' RETURNING id';
          }
          const res = executeQuery(sqlToRun, params, false);
          return {
            changes: res.rowCount || 0,
            lastInsertRowid: res.rows[0]?.id || 0
          };
        }
      };
    },
    exec(sql) {
      executeQuery(sql, [], true);
    }
  };
}

module.exports = { createPgDatabase };
