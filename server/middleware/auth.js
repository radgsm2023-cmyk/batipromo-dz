// ─────────────────────────────────────────────────────────────────────────────
// BATIPROMO DZ - Authentification JWT & Contrôle d'Accès RBAC
// ─────────────────────────────────────────────────────────────────────────────

const jwt = require('jsonwebtoken');
const { db } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'batipromo-dz-secure-secret-key-2026-promotion-immobiliere-alger';
const TOKEN_EXPIRY = '24h';

/**
 * Génère un JWT signé pour un utilisateur
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      role_id: user.role_id
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

/**
 * Middleware de vérification du Token JWT (Header Authorization ou Paramètre URL)
 */
function verifyToken(req, res, next) {
  let token = null;

  // 1. Check Authorization: Bearer <token>
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.query && req.query.token) {
    // 2. Fallback to query param (e.g. for direct file download links like /backup?token=...)
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      error: 'Accès non autorisé. Jeton d\'authentification requis.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Votre session a expiré. Veuillez vous reconnecter.',
        expired: true
      });
    }
    return res.status(401).json({
      error: 'Jeton de session invalide ou corrompu.'
    });
  }
}

/**
 * Middleware d'authentification optionnelle (ne bloque pas si pas de token)
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch {
      // Ignored for optional auth
    }
  }
  next();
}

/**
 * Middleware exigeant un ou plusieurs rôles spécifiques
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentification requise.' });
    }

    // ADMIN always has full access
    if (req.user.role === 'ADMIN') {
      return next();
    }

    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      error: `Accès refusé. Cette action nécessite le rôle ${allowedRoles.join(' ou ')}.`
    });
  };
}

/**
 * Middleware exigeant une permission spécifique
 */
function requirePermission(permissionKey) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentification requise.' });
    }

    if (req.user.role === 'ADMIN') {
      return next();
    }

    if (req.user.role_id) {
      const hasPerm = db.prepare(`
        SELECT 1 FROM role_permissions
        WHERE role_id = ? AND permission_key = ?
      `).get(req.user.role_id, permissionKey);

      if (hasPerm) {
        return next();
      }
    }

    return res.status(403).json({
      error: `Accès refusé. Vous ne possédez pas la permission requise (${permissionKey}).`
    });
  };
}

module.exports = {
  JWT_SECRET,
  generateToken,
  verifyToken,
  optionalAuth,
  requireRole,
  requirePermission
};
