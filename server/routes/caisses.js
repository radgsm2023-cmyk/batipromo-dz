const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { optionalAuth } = require('../middleware/auth');

// List all caisses with alert status and statistics
router.get('/', (req, res) => {
  try {
    const caisses = db.prepare(`
      SELECT 
        c.*,
        ch.name as chantier_name,
        ch.code as chantier_code,
        u.name as responsable_name,
        (SELECT COUNT(*) FROM caisse_mouvements WHERE caisse_id = c.id) as mouvements_count,
        (SELECT COUNT(*) FROM caisse_mouvements WHERE caisse_id = c.id AND status = 'EN_ATTENTE_VALIDATION') as pending_validations_count,
        (SELECT COALESCE(SUM(montant), 0) FROM caisse_mouvements WHERE caisse_id = c.id AND type = 'ENTREE' AND status = 'VALIDE') as total_entrees,
        (SELECT COALESCE(SUM(montant), 0) FROM caisse_mouvements WHERE caisse_id = c.id AND type = 'SORTIE' AND status = 'VALIDE') as total_sorties,
        CASE WHEN c.balance <= c.seuil_alerte THEN 1 ELSE 0 END as is_alerte_seuil
      FROM caisses c
      LEFT JOIN chantiers ch ON c.chantier_id = ch.id
      LEFT JOIN users u ON c.responsable_id = u.id
      ORDER BY c.type ASC, c.balance DESC
    `).all();

    res.json(caisses);
  } catch (error) {
    console.error('Error fetching caisses:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single caisse with movements
router.get('/:id', (req, res) => {
  try {
    const id = req.params.id;
    const caisse = db.prepare(`
      SELECT c.*, ch.name as chantier_name, u.name as responsable_name
      FROM caisses c
      LEFT JOIN chantiers ch ON c.chantier_id = ch.id
      LEFT JOIN users u ON c.responsable_id = u.id
      WHERE c.id = ?
    `).get(id);

    if (!caisse) {
      return res.status(404).json({ error: 'Caisse introuvable' });
    }

    const mouvements = db.prepare(`
      SELECT 
        m.*, 
        b.name as beneficiaire_name,
        f.name as fournisseur_name,
        u.name as auteur_name,
        val.name as validator_name
      FROM caisse_mouvements m
      LEFT JOIN beneficiaires b ON m.beneficiaire_id = b.id
      LEFT JOIN fournisseurs f ON m.fournisseur_id = f.id
      LEFT JOIN users u ON m.created_by = u.id
      LEFT JOIN users val ON m.validated_by = val.id
      WHERE m.caisse_id = ?
      ORDER BY m.date DESC, m.id DESC
    `).all(id);

    res.json({ ...caisse, mouvements });
  } catch (error) {
    console.error('Error fetching caisse:', error);
    res.status(500).json({ error: error.message });
  }
});

// List all mouvements across all caisses (with query filters)
router.get('/mouvements/all', (req, res) => {
  try {
    // qp() filters out 'undefined'/'null' strings sent by the frontend when no filter is selected
    const qp = (v) => (v && v !== 'undefined' && v !== 'null') ? v : undefined;
    const caisse_id   = qp(req.query.caisse_id);
    const chantier_id = qp(req.query.chantier_id);
    const type        = qp(req.query.type);
    const status      = qp(req.query.status);
    const date_debut  = qp(req.query.date_debut);
    const date_fin    = qp(req.query.date_fin);
    const search      = qp(req.query.search);

    let query = `
      SELECT 
        m.*,
        c.name as caisse_name,
        c.type as caisse_type,
        ch.name as chantier_name,
        ch.code as chantier_code,
        b.name as beneficiaire_name,
        f.name as fournisseur_name,
        u.name as auteur_name,
        val.name as validator_name
      FROM caisse_mouvements m
      JOIN caisses c ON m.caisse_id = c.id
      LEFT JOIN chantiers ch ON m.chantier_id = ch.id
      LEFT JOIN beneficiaires b ON m.beneficiaire_id = b.id
      LEFT JOIN fournisseurs f ON m.fournisseur_id = f.id
      LEFT JOIN users u ON m.created_by = u.id
      LEFT JOIN users val ON m.validated_by = val.id
      WHERE 1=1
    `;
    const params = [];

    if (caisse_id) {
      query += ` AND m.caisse_id = ?`;
      params.push(caisse_id);
    }
    if (chantier_id) {
      query += ` AND m.chantier_id = ?`;
      params.push(chantier_id);
    }
    if (type) {
      query += ` AND m.type = ?`;
      params.push(type);
    }
    if (status) {
      query += ` AND m.status = ?`;
      params.push(status);
    }
    if (date_debut) {
      query += ` AND m.date >= ?`;
      params.push(date_debut);
    }
    if (date_fin) {
      query += ` AND m.date <= ?`;
      params.push(date_fin);
    }
    if (search) {
      query += ` AND (m.reference LIKE ? OR m.motif LIKE ? OR b.name LIKE ? OR f.name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY m.date DESC, m.id DESC LIMIT 200`;

    const mouvements = db.prepare(query).all(...params);
    res.json(mouvements);
  } catch (error) {
    console.error('Error fetching all mouvements:', error);
    res.status(500).json({ error: error.message });
  }
});

// List pending movements requiring Admin validation
router.get('/mouvements/pending', (req, res) => {
  try {
    const pendings = db.prepare(`
      SELECT 
        m.*,
        c.name as caisse_name,
        c.balance as caisse_balance,
        ch.name as chantier_name,
        ch.code as chantier_code,
        b.name as beneficiaire_name,
        f.name as fournisseur_name,
        u.name as auteur_name,
        u.role as auteur_role
      FROM caisse_mouvements m
      JOIN caisses c ON m.caisse_id = c.id
      LEFT JOIN chantiers ch ON m.chantier_id = ch.id
      LEFT JOIN beneficiaires b ON m.beneficiaire_id = b.id
      LEFT JOIN fournisseurs f ON m.fournisseur_id = f.id
      LEFT JOIN users u ON m.created_by = u.id
      WHERE m.status = 'EN_ATTENTE_VALIDATION'
      ORDER BY m.date DESC, m.id DESC
    `).all();

    res.json(pendings);
  } catch (error) {
    console.error('Error fetching pending movements:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper: Check if a user is an admin or has validation permission
function canValidateCaisse(userId) {
  if (!userId) return false;
  const user = db.prepare('SELECT role, role_id FROM users WHERE id = ?').get(userId);
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  if (user.role_id) {
    const hasPerm = db.prepare(`
      SELECT 1 FROM role_permissions 
      WHERE role_id = ? AND permission_key IN ('caisses:validate', 'roles:manage')
    `).get(user.role_id);
    if (hasPerm) return true;
  }
  return false;
}

// Create new mouvement (SORTIE, ENTREE, ALIMENTATION, TRANSFERT)
router.post('/mouvements', (req, res) => {
  try {
    const {
      caisse_id,
      type, // 'SORTIE', 'ENTREE', 'ALIMENTATION', 'TRANSFERT'
      source_caisse_id, // For ALIMENTATION / TRANSFERT
      target_caisse_id,
      montant,
      date,
      mode_paiement,
      piece_justificative,
      motif,
      categorie,
      chantier_id,
      beneficiaire_id,
      fournisseur_id,
      created_by,
      force_validate // boolean: if true and user has permission, validates immediately
    } = req.body;

    const numAmount = Number(montant);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ error: 'Montant invalide en Dinars Algériens (DA)' });
    }

    const refNumber = Math.floor(1000 + Math.random() * 9000);
    const prefix = type === 'SORTIE' ? 'BC' : (type === 'ENTREE' ? 'BE' : 'ALIM');
    const reference = `${prefix}-${new Date().getFullYear()}-${refNumber}`;

    // Get caisse
    const caisse = db.prepare('SELECT id, balance, name, code FROM caisses WHERE id = ?').get(caisse_id);
    if (!caisse) return res.status(404).json({ error: 'Caisse introuvable' });

    // Check author permissions
    const isUserAdmin = canValidateCaisse(created_by);
    const creatorUser = created_by ? db.prepare('SELECT name, role FROM users WHERE id = ?').get(created_by) : null;
    const creatorName = creatorUser?.name || 'Utilisateur';

    // ────────────────────────────────────────────────────────────────────────
    // SORTIE / DÉCAISSEMENT
    // ────────────────────────────────────────────────────────────────────────
    if (type === 'SORTIE') {
      // Rule requested by user:
      // "pour la gestion du caisse je veux que admin c est lui qui valider les operations sensible de caisse exemple les sortie"
      // If creator is NOT Admin (or force_validate not set with admin rights):
      // The movement is marked EN_ATTENTE_VALIDATION, and balance is NOT deducted until Admin validates.
      const shouldAutoValidate = isUserAdmin && force_validate !== false;
      const initialStatus = shouldAutoValidate ? 'VALIDE' : 'EN_ATTENTE_VALIDATION';
      const isSensible = 1;

      const result = db.prepare(`
        INSERT INTO caisse_mouvements (
          reference, caisse_id, type, montant, date, mode_paiement, 
          piece_justificative, motif, categorie, chantier_id, 
          beneficiaire_id, fournisseur_id, created_by, status,
          is_sensible, validated_by, validation_date
        )
        VALUES (?, ?, 'SORTIE', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        reference, 
        caisse_id, 
        numAmount, 
        date || new Date().toISOString().slice(0, 10),
        mode_paiement || 'ESPECES', 
        piece_justificative || '', 
        motif,
        categorie || 'DIVERS', 
        chantier_id || null, 
        beneficiaire_id || null,
        fournisseur_id || null, 
        created_by || null, 
        initialStatus,
        isSensible,
        shouldAutoValidate ? created_by : null,
        shouldAutoValidate ? new Date().toISOString() : null
      );

      const mvtId = result.lastInsertRowid;

      if (shouldAutoValidate) {
        // Immediate deduction
        db.prepare('UPDATE caisses SET balance = balance - ? WHERE id = ?').run(numAmount, caisse_id);

        // Audit log
        db.prepare(`
          INSERT INTO audit_logs (user_id, action, module, details)
          VALUES (?, 'SORTIE_CAISSE_DIRECTE', 'Caisses', ?)
        `).run(created_by || null, `Décaissement immédiat validé de ${numAmount.toLocaleString('fr-FR')} DA depuis ${caisse.name} (${reference})`);

        return res.status(201).json({ 
          id: mvtId, 
          reference, 
          status: 'VALIDE', 
          message: 'Sortie de caisse enregistrée et validée avec succès' 
        });
      } else {
        // Create notification for Admin(s)
        const benefObj = beneficiaire_id ? db.prepare('SELECT name FROM beneficiaires WHERE id = ?').get(beneficiaire_id) : null;
        const tiersLabel = benefObj ? ` pour ${benefObj.name}` : (fournisseur_id ? ' pour Fournisseur' : '');

        db.prepare(`
          INSERT INTO notifications (user_id, type, titre, message, montant, lien, reference)
          VALUES (NULL, 'VALIDATION_CAISSE_REQUISE', ?, ?, ?, 'caisses', ?)
        `).run(
          `Demande de Sortie de Caisse (${reference})`,
          `Demande de décaissement de ${numAmount.toLocaleString('fr-FR')} DA par ${creatorName} sur ${caisse.name}${tiersLabel} (Motif: ${motif}). Validation requise.`,
          numAmount,
          reference
        );

        // Audit log of submission
        db.prepare(`
          INSERT INTO audit_logs (user_id, action, module, details)
          VALUES (?, 'DEMANDE_SORTIE_CAISSE', 'Caisses', ?)
        `).run(created_by || null, `Demande de décaissement soumise pour validation: ${numAmount.toLocaleString('fr-FR')} DA sur ${caisse.name} (${reference})`);

        return res.status(201).json({ 
          id: mvtId, 
          reference, 
          status: 'EN_ATTENTE_VALIDATION', 
          message: 'Opération sensible : demande de décaissement enregistrée et soumise à la validation de la Direction Générale (Admin)' 
        });
      }
    }

    // ────────────────────────────────────────────────────────────────────────
    // ENTREE / ENCAISSEMENT / VERSEMENT BÉNÉFICIAIRE
    // ────────────────────────────────────────────────────────────────────────
    if (type === 'ENTREE') {
      const result = db.prepare(`
        INSERT INTO caisse_mouvements (
          reference, caisse_id, type, montant, date, mode_paiement, 
          piece_justificative, motif, categorie, chantier_id, 
          beneficiaire_id, fournisseur_id, created_by, status,
          is_sensible, validated_by, validation_date
        )
        VALUES (?, ?, 'ENTREE', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'VALIDE', 0, ?, ?)
      `).run(
        reference, 
        caisse_id, 
        numAmount, 
        date || new Date().toISOString().slice(0, 10),
        mode_paiement || 'ESPECES', 
        piece_justificative || '', 
        motif,
        categorie || 'VERSEMENT_BENEFICIAIRE', 
        chantier_id || null, 
        beneficiaire_id || null,
        fournisseur_id || null, 
        created_by || null,
        created_by || null,
        new Date().toISOString()
      );

      // Increment balance
      db.prepare('UPDATE caisses SET balance = balance + ? WHERE id = ?').run(numAmount, caisse_id);

      // Notification requested by user:
      // "et je veux aussi quand il y a des verssement des beneficiaires le systeme lui donne une notification"
      let benefName = 'Bénéficiaire';
      if (beneficiaire_id) {
        const benef = db.prepare('SELECT name, type FROM beneficiaires WHERE id = ?').get(beneficiaire_id);
        if (benef) benefName = benef.name;
      }

      // Record notification for Admin / DG
      db.prepare(`
        INSERT INTO notifications (user_id, type, titre, message, montant, lien, reference)
        VALUES (NULL, 'VERSEMENT_BENEFICIAIRE', ?, ?, ?, 'caisses', ?)
      `).run(
        `Nouveau Versement Bénéficiaire (${reference})`,
        `Versement de ${numAmount.toLocaleString('fr-FR')} DA encaissé avec succès de ${benefName} sur la caisse "${caisse.name}". Motif: ${motif}`,
        numAmount,
        reference
      );

      // Audit log
      db.prepare(`
        INSERT INTO audit_logs (user_id, action, module, details)
        VALUES (?, 'VERSEMENT_CAISSE', 'Caisses', ?)
      `).run(created_by || null, `Versement de ${numAmount.toLocaleString('fr-FR')} DA reçu de ${benefName} sur ${caisse.name} (${reference})`);

      return res.status(201).json({ 
        id: result.lastInsertRowid, 
        reference, 
        status: 'VALIDE', 
        message: 'Entrée / versement en caisse enregistré avec notification envoyée à l\'administrateur' 
      });
    }

    // ────────────────────────────────────────────────────────────────────────
    // ALIMENTATION / TRANSFERT
    // ────────────────────────────────────────────────────────────────────────
    if (type === 'ALIMENTATION' || type === 'TRANSFERT') {
      const srcId = source_caisse_id || caisse_id;
      const tgtId = target_caisse_id;

      if (!srcId || !tgtId) {
        return res.status(400).json({ error: 'Veuillez spécifier la caisse source et la caisse destination' });
      }

      const srcCaisse = db.prepare('SELECT balance, name FROM caisses WHERE id = ?').get(srcId);
      const tgtCaisse = db.prepare('SELECT balance, name FROM caisses WHERE id = ?').get(tgtId);

      if (!srcCaisse || !tgtCaisse) {
        return res.status(404).json({ error: 'Une des caisses sélectionnées est introuvable' });
      }

      // Record alimentation on the target caisse
      const result = db.prepare(`
        INSERT INTO caisse_mouvements (
          reference, caisse_id, type, source_caisse_id, target_caisse_id, 
          montant, date, mode_paiement, piece_justificative, motif, 
          categorie, chantier_id, created_by, status,
          is_sensible, validated_by, validation_date
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'APPROVISIONNEMENT', ?, ?, 'VALIDE', 0, ?, ?)
      `).run(
        reference, tgtId, type, srcId, tgtId, numAmount,
        date || new Date().toISOString().slice(0, 10),
        mode_paiement || 'VIREMENT', piece_justificative || '',
        motif || `Alimentation de fond de roulement depuis ${srcCaisse.name}`,
        chantier_id || null, created_by || null,
        created_by || null, new Date().toISOString()
      );

      // Deduct from source caisse, add to target caisse
      db.prepare('UPDATE caisses SET balance = balance - ? WHERE id = ?').run(numAmount, srcId);
      db.prepare('UPDATE caisses SET balance = balance + ? WHERE id = ?').run(numAmount, tgtId);

      // Notification
      db.prepare(`
        INSERT INTO notifications (user_id, type, titre, message, montant, lien, reference)
        VALUES (NULL, 'OPERATION_VALIDEE', ?, ?, ?, 'caisses', ?)
      `).run(
        `Alimentation Fond de Roulement (${reference})`,
        `Transfert de ${numAmount.toLocaleString('fr-FR')} DA effectué de "${srcCaisse.name}" vers "${tgtCaisse.name}".`,
        numAmount,
        reference
      );

      // Audit log
      db.prepare(`
        INSERT INTO audit_logs (user_id, action, module, details)
        VALUES (?, 'ALIMENTATION_CAISSE', 'Caisses', ?)
      `).run(created_by || null, `Alimentation de ${numAmount.toLocaleString('fr-FR')} DA de ${srcCaisse.name} vers ${tgtCaisse.name}`);

      return res.status(201).json({ id: result.lastInsertRowid, reference, message: 'Alimentation de caisse effectuée avec succès' });
    }

    res.status(400).json({ error: 'Type de mouvement invalide' });
  } catch (error) {
    console.error('Error creating caisse mouvement:', error);
    res.status(500).json({ error: error.message });
  }
});

// ────────────────────────────────────────────────────────────────────────
// VALIDATE SENSITIVE CAISSE OPERATION (ADMIN ONLY)
// ────────────────────────────────────────────────────────────────────────
router.put('/mouvements/:id/validate', optionalAuth, (req, res) => {
  try {
    const mvtId = req.params.id;
    const { user_id, notes } = req.body;
    const actingUserId = req.user ? req.user.id : user_id;

    const mvt = db.prepare(`
      SELECT m.*, c.name as caisse_name, c.balance as caisse_balance, u.name as auteur_name
      FROM caisse_mouvements m
      JOIN caisses c ON m.caisse_id = c.id
      LEFT JOIN users u ON m.created_by = u.id
      WHERE m.id = ?
    `).get(mvtId);

    if (!mvt) {
      return res.status(404).json({ error: 'Mouvement de caisse introuvable' });
    }

    if (mvt.status === 'VALIDE') {
      return res.status(400).json({ error: 'Cette opération a déjà été validée' });
    }

    if (mvt.status === 'REJETE') {
      return res.status(400).json({ error: 'Impossible de valider une opération déjà rejetée' });
    }

    // Verify validator permissions using verified acting user ID
    const isUserAdmin = canValidateCaisse(actingUserId);
    if (!isUserAdmin) {
      return res.status(403).json({ error: 'Seul l\'Administrateur / Direction Générale a l\'autorité pour valider cette sortie de caisse sensible.' });
    }

    // Now execute actual debit from the caisse balance
    if (mvt.type === 'SORTIE') {
      db.prepare('UPDATE caisses SET balance = balance - ? WHERE id = ?').run(mvt.montant, mvt.caisse_id);
    }

    // Update status to VALIDE
    const nowIso = new Date().toISOString();
    db.prepare(`
      UPDATE caisse_mouvements 
      SET status = 'VALIDE', validated_by = ?, validation_date = ?
      WHERE id = ?
    `).run(user_id || null, nowIso, mvtId);

    const validatorUser = user_id ? db.prepare('SELECT name FROM users WHERE id = ?').get(user_id) : null;
    const validatorName = validatorUser?.name || 'Direction Générale';

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, module, details)
      VALUES (?, 'VALIDATION_SORTIE_CAISSE', 'Caisses', ?)
    `).run(user_id || null, `Validation par ${validatorName} du bon de sortie ${mvt.reference} (${mvt.montant.toLocaleString('fr-FR')} DA sur ${mvt.caisse_name})`);

    // Notify author if exists
    if (mvt.created_by) {
      db.prepare(`
        INSERT INTO notifications (user_id, type, titre, message, montant, lien, reference)
        VALUES (?, 'OPERATION_VALIDEE', ?, ?, ?, 'caisses', ?)
      `).run(
        mvt.created_by,
        `Bon de Caisse Validé (${mvt.reference})`,
        `Votre demande de décaissement de ${mvt.montant.toLocaleString('fr-FR')} DA sur ${mvt.caisse_name} a été officiellement approuvée par ${validatorName}. Le bon peut être décaissé.`,
        mvt.montant,
        mvt.reference
      );
    }

    res.json({
      success: true,
      message: `Opération ${mvt.reference} de ${mvt.montant.toLocaleString('fr-FR')} DA validée avec succès par ${validatorName}. Le solde de la caisse a été débité.`,
      status: 'VALIDE'
    });
  } catch (error) {
    console.error('Error validating movement:', error);
    res.status(500).json({ error: error.message });
  }
});

// ────────────────────────────────────────────────────────────────────────
// REJECT SENSITIVE CAISSE OPERATION (ADMIN ONLY)
// ────────────────────────────────────────────────────────────────────────
router.put('/mouvements/:id/reject', optionalAuth, (req, res) => {
  try {
    const mvtId = req.params.id;
    const { user_id, rejection_reason } = req.body;
    const actingUserId = req.user ? req.user.id : user_id;

    const mvt = db.prepare(`
      SELECT m.*, c.name as caisse_name, u.name as auteur_name
      FROM caisse_mouvements m
      JOIN caisses c ON m.caisse_id = c.id
      LEFT JOIN users u ON m.created_by = u.id
      WHERE m.id = ?
    `).get(mvtId);

    if (!mvt) {
      return res.status(404).json({ error: 'Mouvement introuvable' });
    }

    if (mvt.status === 'VALIDE') {
      return res.status(400).json({ error: 'Cette opération a déjà été validée et décaissée' });
    }

    const isUserAdmin = canValidateCaisse(actingUserId);
    if (!isUserAdmin) {
      return res.status(403).json({ error: 'Seul l\'Administrateur a l\'autorité pour rejeter une demande de caisse.' });
    }

    const reason = rejection_reason || 'Opération refusée par la Direction Générale';

    db.prepare(`
      UPDATE caisse_mouvements 
      SET status = 'REJETE', rejection_reason = ?, validated_by = ?, validation_date = ?
      WHERE id = ?
    `).run(reason, user_id || null, new Date().toISOString(), mvtId);

    const validatorUser = user_id ? db.prepare('SELECT name FROM users WHERE id = ?').get(user_id) : null;
    const validatorName = validatorUser?.name || 'Direction Générale';

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, module, details)
      VALUES (?, 'REJET_SORTIE_CAISSE', 'Caisses', ?)
    `).run(user_id || null, `Rejet de la demande ${mvt.reference} (${mvt.montant.toLocaleString('fr-FR')} DA) par ${validatorName}. Motif: ${reason}`);

    // Notify author
    if (mvt.created_by) {
      db.prepare(`
        INSERT INTO notifications (user_id, type, titre, message, montant, lien, reference)
        VALUES (?, 'OPERATION_REJETEE', ?, ?, ?, 'caisses', ?)
      `).run(
        mvt.created_by,
        `Demande de Caisse Rejetée (${mvt.reference})`,
        `Votre demande de sortie de ${mvt.montant.toLocaleString('fr-FR')} DA sur ${mvt.caisse_name} a été rejetée. Motif: ${reason}`,
        mvt.montant,
        mvt.reference
      );
    }

    res.json({
      success: true,
      message: `Demande ${mvt.reference} rejetée avec succès.`,
      status: 'REJETE'
    });
  } catch (error) {
    console.error('Error rejecting movement:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new caisse
router.post('/', (req, res) => {
  try {
    const { code, name, type, chantier_id, bank_name, rib, balance, seuil_alerte, responsable_id } = req.body;

    const result = db.prepare(`
      INSERT INTO caisses (code, name, type, chantier_id, bank_name, rib, balance, seuil_alerte, responsable_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
    `).run(
      code, name, type, chantier_id || null, bank_name || null, rib || null,
      balance || 0, seuil_alerte || 50000, responsable_id || null
    );

    res.status(201).json({ id: result.lastInsertRowid, message: 'Caisse créée avec succès' });
  } catch (error) {
    console.error('Error creating caisse:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
