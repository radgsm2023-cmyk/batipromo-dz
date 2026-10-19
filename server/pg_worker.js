/**
 * Worker thread pour l'exécution synchrone des requêtes PostgreSQL (Supabase / Production)
 */

const { parentPort, workerData } = require('node:worker_threads');
const { Pool } = require('pg');

let poolConfig;

if (workerData.connectionString) {
  const url = workerData.connectionString;
  const supabaseMatch = url.match(/postgres:\/\/([^:]+):(.*)@db\.([a-z0-9]+)\.supabase\.co:5432\/(.*)/);
  if (supabaseMatch) {
    const [_, user, pass, projectRef, dbname] = supabaseMatch;
    poolConfig = {
      host: 'aws-0-eu-west-1.pooler.supabase.com',
      port: 5432,
      user: `${user}.${projectRef}`,
      password: pass,
      database: dbname || 'postgres',
      ssl: { rejectUnauthorized: false }
    };
  } else {
    poolConfig = {
      connectionString: url,
      ssl: url.includes('localhost') || url.includes('127.0.0.1') ? false : { rejectUnauthorized: false }
    };
  }
} else {
  poolConfig = workerData.poolConfig;
}

const pool = new Pool(poolConfig);

const sharedBuffer = workerData.sharedBuffer;
const statusArray = new Int32Array(sharedBuffer, 0, 1);
const lengthArray = new Int32Array(sharedBuffer, 4, 1);
const dataArray = new Uint8Array(sharedBuffer, 8);
const encoder = new TextEncoder();

parentPort.on('message', async ({ sql, params, isExec }) => {
  try {
    if (isExec) {
      await pool.query(sql);
      const jsonStr = JSON.stringify({ ok: true, rows: [], rowCount: 0 });
      const encoded = encoder.encode(jsonStr);
      lengthArray[0] = encoded.length;
      dataArray.set(encoded);
      Atomics.store(statusArray, 0, 1);
    } else {
      const res = await pool.query(sql, params || []);
      const jsonStr = JSON.stringify({ ok: true, rows: res.rows, rowCount: res.rowCount });
      const encoded = encoder.encode(jsonStr);
      lengthArray[0] = encoded.length;
      dataArray.set(encoded);
      Atomics.store(statusArray, 0, 1);
    }
  } catch (err) {
    const jsonStr = JSON.stringify({ ok: false, error: err.message });
    const encoded = encoder.encode(jsonStr);
    lengthArray[0] = encoded.length;
    dataArray.set(encoded);
    Atomics.store(statusArray, 0, 2);
  }
  Atomics.notify(statusArray, 0, 1);
});
