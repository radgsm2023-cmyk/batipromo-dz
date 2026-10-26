const express = require('express');
const cors = require('cors');
const path = require('node:path');
const fs = require('node:fs');
const { initDatabase, isPostgres } = require('./db');
const { seedDatabase } = require('./seed');

const { applySecurityHeaders } = require('./middleware/security');

// Initialize database & seed
initDatabase();
seedDatabase();

const app = express();
const PORT = process.env.PORT || 5000;

// Security HTTP headers
app.use(applySecurityHeaders);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global middleware: strip query params that are the string "undefined" or "null"
// In Express 5, req.query is a getter, so delete req.query[k] has no effect.
// We redefine req.query on the request instance using Object.defineProperty.
// PostgreSQL is strict and refuses to cast "undefined" to integer — this causes 500 errors.
app.use((req, _res, next) => {
  if (req.query) {
    const sanitized = {};
    for (const [key, val] of Object.entries(req.query)) {
      if (val !== 'undefined' && val !== 'null' && val !== '') {
        sanitized[key] = val;
      }
    }
    Object.defineProperty(req, 'query', {
      value: sanitized,
      writable: true,
      enumerable: true,
      configurable: true
    });
  }
  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      if (req.body[key] === 'undefined') {
        req.body[key] = undefined;
      } else if (req.body[key] === 'null') {
        req.body[key] = null;
      }
    }
  }
  next();
});

// Static uploads directory
const uploadsDir = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/chantiers', require('./routes/chantiers'));
app.use('/api/caisses', require('./routes/caisses'));
app.use('/api/depenses', require('./routes/depenses'));
app.use('/api/fournisseurs', require('./routes/fournisseurs'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/personnel', require('./routes/personnel'));
app.use('/api/materiel', require('./routes/materiel'));
app.use('/api/stocks', require('./routes/stocks'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/planning', require('./routes/planning'));
app.use('/api/reports', require('./routes/reports'));

// Root healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    application: 'BATIPROMO DZ API',
    currency: 'DZD (DA)',
    database: isPostgres ? 'PostgreSQL (Supabase)' : 'SQLite (Local)',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend client dist if built
const clientDist = path.resolve(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      return res.sendFile(path.join(clientDist, 'index.html'));
    }
    next();
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Serveur BATIPROMO DZ démarré avec succès sur http://localhost:${PORT}`);
});
