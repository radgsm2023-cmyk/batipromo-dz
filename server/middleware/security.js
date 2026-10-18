// ─────────────────────────────────────────────────────────────────────────────
// BATIPROMO DZ - Middleware de Sécurité & En-têtes HTTP
// ─────────────────────────────────────────────────────────────────────────────

// In-memory store for login rate limiting
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Nettoyage périodique des tentatives expirées (toutes les 10 minutes)
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of loginAttempts.entries()) {
    if (now - data.firstAttempt > LOCKOUT_WINDOW_MS) {
      loginAttempts.delete(key);
    }
  }
}, 10 * 60 * 1000);

/**
 * Middleware de limitation du débit (Rate Limiting) sur les connexions
 */
function loginRateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const email = (req.body.email || '').toLowerCase().trim();
  const key = `${ip}:${email}`;
  const now = Date.now();

  const record = loginAttempts.get(key);

  if (record) {
    if (now - record.firstAttempt > LOCKOUT_WINDOW_MS) {
      // Window expired, reset
      loginAttempts.delete(key);
    } else if (record.count >= MAX_ATTEMPTS) {
      const remainingSeconds = Math.ceil((LOCKOUT_WINDOW_MS - (now - record.firstAttempt)) / 1000);
      return res.status(429).json({
        error: `Trop de tentatives de connexion infructueuses. Par mesure de sécurité, ce compte/IP est temporairement bloqué pendant encore ${Math.ceil(remainingSeconds / 60)} minute(s).`
      });
    }
  }

  // Hook into response to track success / failure
  res.on('finish', () => {
    if (res.statusCode === 401 || res.statusCode === 400) {
      // Failed login attempt
      const current = loginAttempts.get(key) || { count: 0, firstAttempt: now };
      current.count += 1;
      loginAttempts.set(key, current);
    } else if (res.statusCode === 200) {
      // Successful login, clear attempts
      loginAttempts.delete(key);
    }
  });

  next();
}

/**
 * Middleware pour appliquer des en-têtes HTTP sécurisés (équivalent Helmet allégé natif)
 */
function applySecurityHeaders(req, res, next) {
  // Prevent MIME-type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Clickjacking protection
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Cross-Site Scripting protection for legacy browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Remove fingerprinting header
  res.removeHeader('X-Powered-By');

  next();
}

module.exports = {
  loginRateLimiter,
  applySecurityHeaders
};
