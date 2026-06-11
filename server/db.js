const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'kiroo.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db = null;
let pool = null;
let transactionDepth = 0;   // Track nested transaction depth

function normalizeSQL(sql) {
  return sql
    .replace(/\bNOW\(\)/gi, "datetime('now')")
    .replace(/\bCURDATE\(\)/gi, "date('now')")
    .replace(/DATE_SUB\(NOW\(\),\s*INTERVAL\s+(\d+)\s+SECOND\)/gi, "datetime('now', '-$1 seconds')")
    .replace(/DATE_ADD\(NOW\(\),\s*INTERVAL\s+(\d+)\s+MINUTE\)/gi, "datetime('now', '+$1 minutes')")
    .replace(/DATE\(created_at\)/gi, "date(created_at)")
    .replace(/ON DUPLICATE KEY UPDATE/gi, 'ON CONFLICT DO UPDATE SET');
}

/**
 * Save to disk — only safe outside transactions (db.export() auto-commits)
 */
function saveToDisk() {
  if (!db || transactionDepth > 0) return;
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
}

function selectQuery(sql, params = []) {
  const normalized = normalizeSQL(sql);
  const stmt = db.prepare(normalized);
  if (params.length > 0) stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function execWrite(sql, params = []) {
  const normalized = normalizeSQL(sql);
  const stmt = db.prepare(normalized);
  if (params.length > 0) stmt.bind(params);
  stmt.step();
  stmt.free();

  const idStmt = db.prepare("SELECT last_insert_rowid() AS id");
  let insertId = 0;
  if (idStmt.step()) insertId = idStmt.getAsObject().id;
  idStmt.free();

  const changes = db.getRowsModified();
  return { insertId, affectedRows: changes };
}

async function initDatabase() {
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
    console.log('[DB] Loaded existing database');
  } else {
    db = new SQL.Database();
    console.log('[DB] Creating new database...');
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    db.exec(schema);
    fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
    console.log('[DB] Schema initialized');
  }

  pool = {
    async query(sql, params) {
      const upper = sql.trim().toUpperCase();
      if (upper.startsWith('SELECT') || upper.startsWith('WITH') || upper.startsWith('PRAGMA')) {
        return [selectQuery(sql, params), []];
      }
      const result = execWrite(sql, params);
      saveToDisk(); // Only saves if not in transaction
      return [result, []];
    },

    async getConnection() {
      let inTx = false;

      const conn = {
        async query(sql, params) {
          return pool.query(sql, params);
        },
        async beginTransaction() {
          if (!inTx) {
            db.exec('BEGIN TRANSACTION');
            transactionDepth++;
            inTx = true;
          }
        },
        async commit() {
          if (!inTx) return;
          db.exec('COMMIT');
          transactionDepth--;
          inTx = false;
          // Now safe to save
          fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
        },
        async rollback() {
          if (!inTx) return;
          db.exec('ROLLBACK');
          transactionDepth--;
          inTx = false;
        },
        release() {
          if (inTx) {
            try { db.exec('ROLLBACK'); } catch (e) { /* ignore */ }
            transactionDepth--;
            inTx = false;
          }
        },
      };
      return conn;
    },
  };

  // Run schema migrations for existing databases
  try {
    db.exec('ALTER TABLE comprehensive_reports ADD COLUMN report_html TEXT');
    console.log('[DB] Migration: added report_html column');
  } catch (e) { /* column already exists */ }
  try {
    db.exec('ALTER TABLE comprehensive_reports ADD COLUMN docx_path TEXT');
    console.log('[DB] Migration: added docx_path column');
  } catch (e) { /* column already exists */ }
  saveToDisk();

  console.log('[DB] Ready');
}

function getPool() {
  if (!pool) throw new Error('DB not initialized');
  return pool;
}

module.exports = { initDatabase, getPool };
