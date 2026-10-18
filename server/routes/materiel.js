const express = require('express');
const router = express.Router();
const { db } = require('../db');

// 1. List all equipment with filter by type (INTERNE / LOCATION), status, or chantier
router.get('/', (req, res) => {
  try {
    const { type_propriete, statut, chantier_id, search } = req.query;

    let query = `
      SELECT 
        m.*,
        ch.name as chantier_actuel_name,
        ch.code as chantier_actuel_code,
        f.name as loueur_name,
        f.phone as loueur_phone,
        (SELECT COUNT(*) FROM materiel_affectations WHERE materiel_id = m.id) as total_affectations_count,
        (SELECT COALESCE(SUM(montant_total), 0) FROM materiel_consommations WHERE materiel_id = m.id) as total_depenses_carburant_maintenance,
        (SELECT op.nom || ' ' || op.prenom 
         FROM materiel_affectations a 
         JOIN employees op ON a.operateur_id = op.id 
         WHERE a.materiel_id = m.id AND a.statut = 'ACTIF' LIMIT 1) as operateur_actuel
      FROM materiel m
      LEFT JOIN chantiers ch ON m.chantier_actuel_id = ch.id
      LEFT JOIN fournisseurs f ON m.loueur_fournisseur_id = f.id
      WHERE 1=1
    `;
    const params = [];

    if (type_propriete) {
      query += ` AND m.type_propriete = ?`;
      params.push(type_propriete);
    }
    if (statut) {
      query += ` AND m.statut = ?`;
      params.push(statut);
    }
    if (chantier_id) {
      query += ` AND m.chantier_actuel_id = ?`;
      params.push(chantier_id);
    }
    if (search) {
      query += ` AND (m.nom LIKE ? OR m.code_parc LIKE ? OR m.immatriculation_serie LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY m.type_propriete DESC, m.nom ASC`;

    const materiels = db.prepare(query).all(...params);
    res.json(materiels);
  } catch (error) {
    console.error('Error fetching materiel:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single materiel with history of affectations and fuel/maintenance logs
router.get('/:id', (req, res) => {
  try {
    const id = req.params.id;
    const item = db.prepare(`
      SELECT m.*, ch.name as chantier_actuel_name, f.name as loueur_name, f.phone as loueur_phone
      FROM materiel m
      LEFT JOIN chantiers ch ON m.chantier_actuel_id = ch.id
      LEFT JOIN fournisseurs f ON m.loueur_fournisseur_id = f.id
      WHERE m.id = ?
    `).get(id);

    if (!item) return res.status(404).json({ error: 'Matériel introuvable' });

    // Affectations history
    const affectations = db.prepare(`
      SELECT 
        a.*,
        ch.name as chantier_name, ch.code as chantier_code,
        op.nom || ' ' || op.prenom as operateur_name
      FROM materiel_affectations a
      JOIN chantiers ch ON a.chantier_id = ch.id
      LEFT JOIN employees op ON a.operateur_id = op.id
      WHERE a.materiel_id = ?
      ORDER BY a.date_debut DESC
    `).all(id);

    // Consommations
    const consommations = db.prepare(`
      SELECT 
        c.*,
        ch.name as chantier_name,
        f.name as fournisseur_nom
      FROM materiel_consommations c
      JOIN chantiers ch ON c.chantier_id = ch.id
      LEFT JOIN fournisseurs f ON c.fournisseur_id = f.id
      WHERE c.materiel_id = ?
      ORDER BY c.date DESC
    `).all(id);

    res.json({ ...item, affectations, consommations });
  } catch (error) {
    console.error('Error fetching materiel details:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new equipment (Interne ou Location)
router.post('/', (req, res) => {
  try {
    const {
      nom,
      categorie,
      type_propriete, // 'INTERNE' or 'LOCATION'
      loueur_fournisseur_id,
      cout_location_jour,
      cout_location_mois,
      valeur_acquisition,
      date_debut_location,
      date_fin_location_prevue,
      chantier_actuel_id,
      compteur_heures_km,
      prochaine_maintenance,
      immatriculation_serie,
      notes
    } = req.body;

    const prefix = type_propriete === 'LOCATION' ? 'MAT-LOC' : 'MAT-INT';
    const code_parc = `${prefix}-${Math.floor(100 + Math.random() * 900)}`;

    const initialStatut = chantier_actuel_id ? 'AFFECTE_CHANTIER' : 'DISPONIBLE';

    const result = db.prepare(`
      INSERT INTO materiel (
        code_parc, nom, categorie, type_propriete, loueur_fournisseur_id,
        cout_location_jour, cout_location_mois, valeur_acquisition,
        date_debut_location, date_fin_location_prevue, statut,
        chantier_actuel_id, compteur_heures_km, prochaine_maintenance,
        immatriculation_serie, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      code_parc, nom, categorie || 'ENGIN_LOURD', type_propriete || 'INTERNE',
      loueur_fournisseur_id || null, Number(cout_location_jour) || 0,
      Number(cout_location_mois) || 0, Number(valeur_acquisition) || 0,
      date_debut_location || null, date_fin_location_prevue || null,
      initialStatut, chantier_actuel_id || null,
      Number(compteur_heures_km) || 0, prochaine_maintenance || null,
      immatriculation_serie || '', notes || ''
    );

    const matId = result.lastInsertRowid;

    // If assigned to a chantier immediately, record affectation
    if (chantier_actuel_id) {
      db.prepare(`
        INSERT INTO materiel_affectations (
          materiel_id, chantier_id, date_debut, date_fin_prevue, 
          cout_impute, statut, compteur_depart, notes
        )
        VALUES (?, ?, ?, ?, ?, 'ACTIF', ?, ?)
      `).run(
        matId, chantier_actuel_id, new Date().toISOString().slice(0, 10),
        date_fin_location_prevue || null, Number(cout_location_jour) || 0,
        Number(compteur_heures_km) || 0, notes || 'Mise en service chantier'
      );
    }

    res.status(201).json({ id: matId, code_parc, message: 'Matériel ajouté avec succès' });
  } catch (error) {
    console.error('Error creating materiel:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Affectations Matériel: List & Assign
router.get('/affectations/list', (req, res) => {
  try {
    const { chantier_id, materiel_id, statut } = req.query;

    let query = `
      SELECT 
        a.*,
        m.code_parc, m.nom as materiel_nom, m.type_propriete, m.categorie,
        ch.name as chantier_name, ch.code as chantier_code,
        op.nom || ' ' || op.prenom as operateur_name
      FROM materiel_affectations a
      JOIN materiel m ON a.materiel_id = m.id
      JOIN chantiers ch ON a.chantier_id = ch.id
      LEFT JOIN employees op ON a.operateur_id = op.id
      WHERE 1=1
    `;
    const params = [];

    if (chantier_id) {
      query += ` AND a.chantier_id = ?`;
      params.push(chantier_id);
    }
    if (materiel_id) {
      query += ` AND a.materiel_id = ?`;
      params.push(materiel_id);
    }
    if (statut) {
      query += ` AND a.statut = ?`;
      params.push(statut);
    }

    query += ` ORDER BY a.date_debut DESC`;

    const list = db.prepare(query).all(...params);
    res.json(list);
  } catch (error) {
    console.error('Error fetching materiel affectations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Assign equipment to a chantier (or transfer)
router.post('/affectations', (req, res) => {
  try {
    const { materiel_id, chantier_id, date_debut, date_fin_prevue, operateur_id, cout_impute, compteur_depart, notes } = req.body;

    // Terminate previous active affectation if any
    db.prepare(`
      UPDATE materiel_affectations 
      SET statut = 'TERMINE', date_fin_reelle = ? 
      WHERE materiel_id = ? AND statut = 'ACTIF'
    `).run(date_debut || new Date().toISOString().slice(0, 10), materiel_id);

    // Create new affectation
    const result = db.prepare(`
      INSERT INTO materiel_affectations (
        materiel_id, chantier_id, date_debut, date_fin_prevue, 
        operateur_id, cout_impute, statut, compteur_depart, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, 'ACTIF', ?, ?)
    `).run(
      materiel_id, chantier_id, date_debut || new Date().toISOString().slice(0, 10),
      date_fin_prevue || null, operateur_id || null, Number(cout_impute) || 0,
      Number(compteur_depart) || 0, notes || ''
    );

    // Update equipment status and chantier_actuel_id
    db.prepare(`
      UPDATE materiel 
      SET statut = 'AFFECTE_CHANTIER', chantier_actuel_id = ? 
      WHERE id = ?
    `).run(chantier_id, materiel_id);

    // Audit log
    const mat = db.prepare('SELECT nom FROM materiel WHERE id = ?').get(materiel_id);
    const cht = db.prepare('SELECT name FROM chantiers WHERE id = ?').get(chantier_id);
    db.prepare(`
      INSERT INTO audit_logs (action, module, details)
      VALUES ('AFFECTATION_MATERIEL', 'Matériel', ?)
    `).run(`Affectation du matériel ${mat ? mat.nom : ''} au chantier ${cht ? cht.name : ''}`);

    res.status(201).json({ id: result.lastInsertRowid, message: 'Matériel affecté au chantier avec succès' });
  } catch (error) {
    console.error('Error assigning materiel:', error);
    res.status(500).json({ error: error.message });
  }
});

// Return equipment to depot or release rental
router.post('/affectations/:id/liberer', (req, res) => {
  try {
    const id = req.params.id; // affectation id
    const { date_fin_reelle, compteur_retour, notes } = req.body;

    const aff = db.prepare('SELECT materiel_id FROM materiel_affectations WHERE id = ?').get(id);
    if (!aff) return res.status(404).json({ error: 'Affectation introuvable' });

    db.prepare(`
      UPDATE materiel_affectations
      SET statut = 'TERMINE', date_fin_reelle = ?, compteur_retour = ?, notes = notes || ?
      WHERE id = ?
    `).run(date_fin_reelle || new Date().toISOString().slice(0, 10), Number(compteur_retour) || 0, ` [Retour: ${notes || ''}]`, id);

    // Update equipment to DISPONIBLE and remove current chantier
    db.prepare(`
      UPDATE materiel 
      SET statut = 'DISPONIBLE', chantier_actuel_id = NULL, compteur_heures_km = COALESCE(?, compteur_heures_km)
      WHERE id = ?
    `).run(compteur_retour || null, aff.materiel_id);

    res.json({ message: 'Matériel libéré et replacé en parc disponible' });
  } catch (error) {
    console.error('Error returning materiel:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Consommation Carburant & Maintenance
router.get('/consommations/list', (req, res) => {
  try {
    const { materiel_id, chantier_id } = req.query;

    let query = `
      SELECT 
        c.*,
        m.nom as materiel_nom, m.code_parc, m.type_propriete,
        ch.name as chantier_name,
        f.name as fournisseur_nom
      FROM materiel_consommations c
      JOIN materiel m ON c.materiel_id = m.id
      JOIN chantiers ch ON c.chantier_id = ch.id
      LEFT JOIN fournisseurs f ON c.fournisseur_id = f.id
      WHERE 1=1
    `;
    const params = [];

    if (materiel_id) {
      query += ` AND c.materiel_id = ?`;
      params.push(materiel_id);
    }
    if (chantier_id) {
      query += ` AND c.chantier_id = ?`;
      params.push(chantier_id);
    }

    query += ` ORDER BY c.date DESC`;

    const list = db.prepare(query).all(...params);
    res.json(list);
  } catch (error) {
    console.error('Error fetching consommations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Log fuel or maintenance expense
router.post('/consommations', (req, res) => {
  try {
    const {
      materiel_id,
      chantier_id,
      date,
      type, // 'CARBURANT_GASOIL', 'VIDANGE_LUBRIFIANT', 'REPARATION', 'ENTRETIEN'
      quantite_litres,
      montant_total,
      compteur_heures_km,
      fournisseur_id,
      caisse_id, // optional caisse to debit
      notes
    } = req.body;

    const montant = Number(montant_total);

    let caisseMvtId = null;
    if (caisse_id && montant > 0) {
      const bcRef = `BC-ENG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const mvt = db.prepare(`
        INSERT INTO caisse_mouvements (
          reference, caisse_id, type, montant, date, mode_paiement, 
          motif, categorie, chantier_id, fournisseur_id, status
        )
        VALUES (?, ?, 'SORTIE', ?, ?, 'ESPECES', ?, 'CARBURANT', ?, ?, 'VALIDE')
      `).run(
        bcRef, caisse_id, montant, date || new Date().toISOString().slice(0, 10),
        `Carburant / Maintenance engin : ${notes || type}`, chantier_id, fournisseur_id || null
      );
      caisseMvtId = mvt.lastInsertRowid;

      db.prepare('UPDATE caisses SET balance = balance - ? WHERE id = ?').run(montant, caisse_id);
    }

    const result = db.prepare(`
      INSERT INTO materiel_consommations (
        materiel_id, chantier_id, date, type, quantite_litres, 
        montant_total, compteur_heures_km, fournisseur_id, caisse_mouvement_id, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      materiel_id, chantier_id, date || new Date().toISOString().slice(0, 10),
      type || 'CARBURANT_GASOIL', Number(quantite_litres) || 0, montant,
      Number(compteur_heures_km) || 0, fournisseur_id || null, caisseMvtId, notes || ''
    );

    // Update meter on materiel if provided
    if (compteur_heures_km) {
      db.prepare('UPDATE materiel SET compteur_heures_km = ? WHERE id = ?').run(compteur_heures_km, materiel_id);
    }

    res.status(201).json({ id: result.lastInsertRowid, message: 'Consommation / entretien enregistré avec succès' });
  } catch (error) {
    console.error('Error logging materiel consommation:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
