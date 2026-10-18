const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db, ALL_PERMISSIONS } = require('../db');
const { generateToken, verifyToken, optionalAuth, requireRole } = require('../middleware/auth');
const { loginRateLimiter } = require('../middleware/security');

// Helper to get full user profile with permissions and chantiers
function getFullUserProfile(userId) {
  const user = db.prepare(`
    SELECT u.id, u.name, u.email, u.role, u.role_id, u.phone, u.status, u.created_at,
           r.name as role_name, r.description as role_desc, r.is_system as role_is_system
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.id = ?
  `).get(userId);

  if (!user) return null;

  // Get permissions for user's role
  const permissions = db.prepare(`
    SELECT permission_key FROM role_permissions WHERE role_id = ?
  `).all(user.role_id).map(p => p.permission_key);

  // Get allowed chantiers
  const chantiers = db.prepare(`
    SELECT c.id, c.code, c.name, c.wilaya
    FROM user_chantiers uc
    JOIN chantiers c ON uc.chantier_id = c.id
    WHERE uc.user_id = ?
  `).all(userId);

  return {
    ...user,
    permissions,
    allowedChantiers: chantiers,
    isGlobalScope: user.role === 'ADMIN' || chantiers.length === 0
  };
}

// Login authentication with Rate Limiting and proper bcrypt check
router.post('/login', loginRateLimiter, (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Veuillez saisir votre email et votre mot de passe.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Identifiants invalides (email ou mot de passe incorrect).' });
    }

    if (user.status === 'BLOQUE') {
      return res.status(403).json({ error: 'Ce compte est actuellement suspendu. Veuillez contacter votre administrateur.' });
    }

    // Secure bcrypt check without hardcoded backdoors
    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Identifiants invalides (email ou mot de passe incorrect).' });
    }

    const fullProfile = getFullUserProfile(user.id);
    const token = generateToken(user);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (user_id, user_name, action, module, details)
      VALUES (?, ?, 'CONNEXION_UTILISATEUR', 'Sécurité', ?)
    `).run(user.id, user.name, `Connexion réussie au système de ${user.name} (${user.email})`);

    res.json({
      token,
      user: fullProfile
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: error.message });
  }
});

// 1. List users with their roles, permissions and assigned chantiers
router.get('/users', (req, res) => {
  try {
    const users = db.prepare(`
      SELECT u.id, u.name, u.email, u.role, u.role_id, u.phone, u.status, u.created_at,
             r.name as role_name, r.code as role_code, r.is_system as role_is_system
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.id ASC
    `).all();

    const result = users.map(u => {
      const perms = db.prepare('SELECT permission_key FROM role_permissions WHERE role_id = ?').all(u.role_id).map(p => p.permission_key);
      const chantiers = db.prepare(`
        SELECT c.id, c.code, c.name, c.wilaya
        FROM user_chantiers uc
        JOIN chantiers c ON uc.chantier_id = c.id
        WHERE uc.user_id = ?
      `).all(u.id);

      return {
        ...u,
        permissionsCount: perms.length,
        permissions: perms,
        assignedChantiers: chantiers
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Create new user
router.post('/users', (req, res) => {
  try {
    const { name, email, password, role_id, phone, assigned_chantiers } = req.body;

    if (!name || !email || !password || !role_id) {
      return res.status(400).json({ error: 'Nom, email, mot de passe et rôle requis.' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ error: 'Un utilisateur avec cette adresse email existe déjà.' });
    }

    const role = db.prepare('SELECT * FROM roles WHERE id = ?').get(role_id);
    if (!role) {
      return res.status(400).json({ error: 'Rôle sélectionné invalide.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);

    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, role_id, phone, status)
      VALUES (?, ?, ?, ?, ?, ?, 'ACTIF')
    `).run(name, email, passwordHash, role.code, role.id, phone || '');

    const newUserId = result.lastInsertRowid;

    // Insert chantiers scope if specified
    if (Array.isArray(assigned_chantiers)) {
      const insertScope = db.prepare('INSERT OR IGNORE INTO user_chantiers (user_id, chantier_id) VALUES (?, ?)');
      for (const chtId of assigned_chantiers) {
        insertScope.run(newUserId, chtId);
      }
    }

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (action, module, details)
      VALUES ('CREATION_UTILISATEUR', 'Administration', ?)
    `).run(`Création de l'utilisateur ${name} (${email}) avec le rôle ${role.name}`);

    res.status(201).json({ id: newUserId, message: 'Utilisateur créé avec succès.' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Update user
router.put('/users/:id', (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, role_id, phone, status, assigned_chantiers } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    let roleCode = user.role;
    if (role_id) {
      const role = db.prepare('SELECT code FROM roles WHERE id = ?').get(role_id);
      if (role) roleCode = role.code;
    }

    db.prepare(`
      UPDATE users 
      SET name = ?, email = ?, role = ?, role_id = ?, phone = ?, status = ?
      WHERE id = ?
    `).run(
      name || user.name,
      email || user.email,
      roleCode,
      role_id || user.role_id,
      phone !== undefined ? phone : user.phone,
      status || user.status,
      userId
    );

    // Update assigned chantiers
    if (Array.isArray(assigned_chantiers)) {
      db.prepare('DELETE FROM user_chantiers WHERE user_id = ?').run(userId);
      const insertScope = db.prepare('INSERT OR IGNORE INTO user_chantiers (user_id, chantier_id) VALUES (?, ?)');
      for (const chtId of assigned_chantiers) {
        insertScope.run(userId, chtId);
      }
    }

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (action, module, details)
      VALUES ('MODIFICATION_UTILISATEUR', 'Administration', ?)
    `).run(`Modification des informations / rôle de l'utilisateur ${name || user.name}`);

    res.json({ message: 'Utilisateur mis à jour avec succès.' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Reset user password
router.put('/users/:id/password', (req, res) => {
  try {
    const userId = req.params.id;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, userId);

    res.json({ message: 'Mot de passe réinitialisé avec succès.' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. Delete user
router.delete('/users/:id', (req, res) => {
  try {
    const userId = req.params.id;

    // Safety: prevent deleting the last admin
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId);
    if (user && user.role === 'ADMIN') {
      const adminCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = "ADMIN"').get();
      if (adminCount.count <= 1) {
        return res.status(400).json({ error: 'Impossible de supprimer le dernier Administrateur du système.' });
      }
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    res.json({ message: 'Utilisateur supprimé.' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: error.message });
  }
});

// 6. List all Roles with their permissions
router.get('/roles', (req, res) => {
  try {
    const roles = db.prepare(`
      SELECT r.*,
             (SELECT COUNT(*) FROM users WHERE role_id = r.id) as users_count
      FROM roles r
      ORDER BY r.is_system DESC, r.name ASC
    `).all();

    const result = roles.map(role => {
      const perms = db.prepare(`
        SELECT permission_key FROM role_permissions WHERE role_id = ?
      `).all(role.id).map(p => p.permission_key);

      return {
        ...role,
        permissions: perms
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: error.message });
  }
});

// 7. Create new Custom Role
router.post('/roles', (req, res) => {
  try {
    const { code, name, description, permissions } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Code et Nom du rôle requis.' });
    }

    const cleanCode = code.toUpperCase().replace(/\s+/g, '_');
    const existing = db.prepare('SELECT id FROM roles WHERE code = ?').get(cleanCode);
    if (existing) {
      return res.status(400).json({ error: 'Un rôle avec ce code existe déjà.' });
    }

    const result = db.prepare(`
      INSERT INTO roles (code, name, description, is_system)
      VALUES (?, ?, ?, 0)
    `).run(cleanCode, name, description || '');

    const roleId = result.lastInsertRowid;

    if (Array.isArray(permissions)) {
      const insertPerm = db.prepare('INSERT OR IGNORE INTO role_permissions (role_id, permission_key) VALUES (?, ?)');
      for (const pKey of permissions) {
        insertPerm.run(roleId, pKey);
      }
    }

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (action, module, details)
      VALUES ('CREATION_ROLE', 'Administration', ?)
    `).run(`Création du rôle personnalisé ${name} (${cleanCode})`);

    res.status(201).json({ id: roleId, message: 'Rôle créé avec succès.' });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ error: error.message });
  }
});

// 8. Update Role Permissions
router.put('/roles/:id/permissions', (req, res) => {
  try {
    const roleId = req.params.id;
    const { permissions, name, description } = req.body;

    if (name || description) {
      db.prepare('UPDATE roles SET name = COALESCE(?, name), description = COALESCE(?, description) WHERE id = ?')
        .run(name || null, description || null, roleId);
    }

    if (Array.isArray(permissions)) {
      db.prepare('DELETE FROM role_permissions WHERE role_id = ?').run(roleId);
      const insertPerm = db.prepare('INSERT OR IGNORE INTO role_permissions (role_id, permission_key) VALUES (?, ?)');
      for (const pKey of permissions) {
        insertPerm.run(roleId, pKey);
      }
    }

    const role = db.prepare('SELECT name FROM roles WHERE id = ?').get(roleId);
    db.prepare(`
      INSERT INTO audit_logs (action, module, details)
      VALUES ('MODIFICATION_ROLE_PERMISSIONS', 'Administration', ?)
    `).run(`Mise à jour des permissions du rôle ${role ? role.name : roleId}`);

    res.json({ message: 'Permissions du rôle mises à jour avec succès.' });
  } catch (error) {
    console.error('Error updating role permissions:', error);
    res.status(500).json({ error: error.message });
  }
});

// 9. Delete custom role
router.delete('/roles/:id', (req, res) => {
  try {
    const roleId = req.params.id;
    const role = db.prepare('SELECT * FROM roles WHERE id = ?').get(roleId);

    if (!role) return res.status(404).json({ error: 'Rôle introuvable.' });
    if (role.is_system === 1) {
      return res.status(400).json({ error: 'Impossible de supprimer un rôle système standard.' });
    }

    const usersCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE role_id = ?').get(roleId);
    if (usersCount.count > 0) {
      return res.status(400).json({ error: 'Ce rôle est attribué à des utilisateurs. Veuillez d\'abord réaffecter ces utilisateurs.' });
    }

    db.prepare('DELETE FROM roles WHERE id = ?').run(roleId);
    res.json({ message: 'Rôle supprimé avec succès.' });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ error: error.message });
  }
});

// 10. List all permissions catalog grouped by module
router.get('/permissions', (req, res) => {
  try {
    // Group permissions by module
    const grouped = {};
    for (const p of ALL_PERMISSIONS) {
      if (!grouped[p.module]) grouped[p.module] = [];
      grouped[p.module].push(p);
    }
    res.json({
      all: ALL_PERMISSIONS,
      grouped
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ error: error.message });
  }
});

// 11. Quick switch user for presentation / demo purposes with full profile and permissions
router.post('/switch-user', (req, res) => {
  try {
    const { userId } = req.body;
    const fullProfile = getFullUserProfile(userId);

    if (!fullProfile) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    const token = generateToken(fullProfile);

    res.json({
      token,
      user: fullProfile
    });
  } catch (error) {
    console.error('Error switching user:', error);
    res.status(500).json({ error: error.message });
  }
});

// 12. Current authenticated user profile
router.get('/me', optionalAuth, (req, res) => {
  try {
    const targetId = req.user ? req.user.id : null;
    if (targetId) {
      const profile = getFullUserProfile(targetId);
      if (profile) return res.json(profile);
    }

    // Fallback if no valid token
    const firstUser = db.prepare('SELECT id FROM users ORDER BY id ASC LIMIT 1').get();
    if (!firstUser) return res.status(404).json({ error: 'Aucun utilisateur.' });

    const fullProfile = getFullUserProfile(firstUser.id);
    res.json(fullProfile);
  } catch (error) {
    console.error('Error fetching me:', error);
    res.status(500).json({ error: error.message });
  }
});

// Audit logs
router.get('/audit', (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT 
        l.*,
        u.name as auteur_name,
        u.role as auteur_role
      FROM audit_logs l
      LEFT JOIN users u ON l.user_id = u.id
      ORDER BY l.created_at DESC
      LIMIT 100
    `).all();
    res.json(logs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
