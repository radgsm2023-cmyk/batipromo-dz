const express = require('express');
const router = express.Router();
const { db } = require('../db');

// 1. List employees with current chantier and attendance stats
router.get('/employees', (req, res) => {
  try {
    const { chantier_id, statut, search } = req.query;

    let query = `
      SELECT 
        e.*,
        ch.name as chantier_actuel_name,
        ch.code as chantier_actuel_code,
        (SELECT COUNT(*) FROM employee_pointages WHERE employee_id = e.id AND date >= CURRENT_DATE - INTERVAL '30 days' AND statut = 'PRESENT') as jours_travailles_ce_mois,
        (SELECT COALESCE(SUM(montant), 0) FROM caisse_mouvements WHERE beneficiaire_id = e.id AND categorie = 'AVANCE_SALAIRE' AND date >= DATE_TRUNC('month', CURRENT_DATE)) as total_avances_mois
      FROM employees e
      LEFT JOIN chantiers ch ON e.chantier_actuel_id = ch.id
      WHERE 1=1
    `;
    const params = [];

    if (chantier_id) {
      query += ` AND e.chantier_actuel_id = ?`;
      params.push(chantier_id);
    }
    if (statut) {
      query += ` AND e.statut = ?`;
      params.push(statut);
    }
    if (search) {
      query += ` AND (e.nom LIKE ? OR e.prenom LIKE ? OR e.matricule LIKE ? OR e.poste LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY e.poste ASC, e.nom ASC`;

    const employees = db.prepare(query).all(...params);
    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create employee
router.post('/employees', (req, res) => {
  try {
    const {
      nom,
      prenom,
      poste,
      type_contrat,
      salaire_base,
      taux_journalier,
      telephone,
      cin_nin,
      numero_cnas,
      chantier_actuel_id,
      date_embauche
    } = req.body;

    const matricule = `EMP-${Math.floor(100 + Math.random() * 900)}`;

    const result = db.prepare(`
      INSERT INTO employees (
        matricule, nom, prenom, poste, type_contrat, salaire_base, 
        taux_journalier, telephone, cin_nin, numero_cnas, chantier_actuel_id, 
        date_embauche, statut
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIF')
    `).run(
      matricule, nom, prenom, poste, type_contrat || 'PERMANENT_MENSUEL',
      Number(salaire_base) || 0, Number(taux_journalier) || 0, telephone || '',
      cin_nin || '', numero_cnas || '', chantier_actuel_id || null,
      date_embauche || new Date().toISOString().slice(0, 10)
    );

    const empId = result.lastInsertRowid;

    // If an initial chantier is assigned, create initial affectation
    if (chantier_actuel_id) {
      db.prepare(`
        INSERT INTO employee_affectations (employee_id, chantier_id, role_sur_chantier, date_debut, statut)
        VALUES (?, ?, ?, ?, 'EN_COURS')
      `).run(empId, chantier_actuel_id, poste, date_embauche || new Date().toISOString().slice(0, 10));
    }

    res.status(201).json({ id: empId, matricule, message: 'Employé ajouté avec succès' });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Affectations: List & Assign
router.get('/affectations', (req, res) => {
  try {
    const { chantier_id, employee_id, statut } = req.query;

    let query = `
      SELECT 
        a.*,
        e.matricule, e.nom, e.prenom, e.poste, e.type_contrat, e.telephone,
        ch.name as chantier_name, ch.code as chantier_code, ch.wilaya
      FROM employee_affectations a
      JOIN employees e ON a.employee_id = e.id
      JOIN chantiers ch ON a.chantier_id = ch.id
      WHERE 1=1
    `;
    const params = [];

    if (chantier_id) {
      query += ` AND a.chantier_id = ?`;
      params.push(chantier_id);
    }
    if (employee_id) {
      query += ` AND a.employee_id = ?`;
      params.push(employee_id);
    }
    if (statut) {
      query += ` AND a.statut = ?`;
      params.push(statut);
    }

    query += ` ORDER BY a.date_debut DESC`;

    const affectations = db.prepare(query).all(...params);
    res.json(affectations);
  } catch (error) {
    console.error('Error fetching affectations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create/Change affectation
router.post('/affectations', (req, res) => {
  try {
    const { employee_id, chantier_id, role_sur_chantier, date_debut, notes } = req.body;

    // Close previous active affectation for this employee if any
    db.prepare(`
      UPDATE employee_affectations 
      SET statut = 'TERMINE', date_fin = ? 
      WHERE employee_id = ? AND statut = 'EN_COURS'
    `).run(date_debut || new Date().toISOString().slice(0, 10), employee_id);

    // Create new affectation
    const result = db.prepare(`
      INSERT INTO employee_affectations (employee_id, chantier_id, role_sur_chantier, date_debut, statut, notes)
      VALUES (?, ?, ?, ?, 'EN_COURS', ?)
    `).run(
      employee_id, chantier_id, role_sur_chantier || 'Affectation Chantier',
      date_debut || new Date().toISOString().slice(0, 10), notes || ''
    );

    // Update current chantier on employee record
    db.prepare('UPDATE employees SET chantier_actuel_id = ? WHERE id = ?').run(chantier_id, employee_id);

    // Audit log
    const emp = db.prepare('SELECT nom, prenom FROM employees WHERE id = ?').get(employee_id);
    const cht = db.prepare('SELECT name FROM chantiers WHERE id = ?').get(chantier_id);
    db.prepare(`
      INSERT INTO audit_logs (action, module, details)
      VALUES ('AFFECTATION_PERSONNEL', 'Personnel', ?)
    `).run(`Affectation de ${emp ? emp.prenom + ' ' + emp.nom : 'l\'employé'} au chantier ${cht ? cht.name : ''}`);

    res.status(201).json({ id: result.lastInsertRowid, message: 'Affectation enregistrée avec succès' });
  } catch (error) {
    console.error('Error creating affectation:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Pointages (Attendance)
router.get('/pointages', (req, res) => {
  try {
    const { chantier_id, date, date_debut, date_fin } = req.query;

    let query = `
      SELECT 
        p.*,
        e.matricule, e.nom, e.prenom, e.poste, e.type_contrat, e.taux_journalier, e.salaire_base,
        ch.name as chantier_name
      FROM employee_pointages p
      JOIN employees e ON p.employee_id = e.id
      JOIN chantiers ch ON p.chantier_id = ch.id
      WHERE 1=1
    `;
    const params = [];

    if (chantier_id) {
      query += ` AND p.chantier_id = ?`;
      params.push(chantier_id);
    }
    if (date) {
      query += ` AND p.date = ?`;
      params.push(date);
    }
    if (date_debut) {
      query += ` AND p.date >= ?`;
      params.push(date_debut);
    }
    if (date_fin) {
      query += ` AND p.date <= ?`;
      params.push(date_fin);
    }

    query += ` ORDER BY p.date DESC, e.nom ASC`;

    const pointages = db.prepare(query).all(...params);
    res.json(pointages);
  } catch (error) {
    console.error('Error fetching pointages:', error);
    res.status(500).json({ error: error.message });
  }
});

// Save or update daily pointage
router.post('/pointages', (req, res) => {
  try {
    const { employee_id, chantier_id, date, statut, heures_normales, heures_sup, notes } = req.body;

    const emp = db.prepare('SELECT type_contrat, taux_journalier, salaire_base FROM employees WHERE id = ?').get(employee_id);
    let montantDuJour = 0;

    if (emp && emp.type_contrat === 'JOURNALIER_TACHERON') {
      const taux = emp.taux_journalier || 0;
      if (statut === 'PRESENT') montantDuJour = taux;
      else if (statut === 'DEMI_JOURNEE') montantDuJour = taux / 2;
      // Heures supplémentaires: +25% par heure au-delà de 8h
      const hSup = Number(heures_sup) || 0;
      if (hSup > 0) montantDuJour += (taux / 8) * 1.25 * hSup;
    }

    const stmt = db.prepare(`
      INSERT INTO employee_pointages (
        employee_id, chantier_id, date, statut, heures_normales, heures_sup, montant_du_jour, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(employee_id, date) DO UPDATE SET
        chantier_id = excluded.chantier_id,
        statut = excluded.statut,
        heures_normales = excluded.heures_normales,
        heures_sup = excluded.heures_sup,
        montant_du_jour = excluded.montant_du_jour,
        notes = excluded.notes
    `);

    stmt.run(
      employee_id, chantier_id, date, statut || 'PRESENT',
      Number(heures_normales) || 8, Number(heures_sup) || 0,
      montantDuJour, notes || ''
    );

    res.json({ message: 'Pointage enregistré avec succès', montantDuJour });
  } catch (error) {
    console.error('Error recording pointage:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Paies & Fiches de Salaire
router.get('/paies', (req, res) => {
  try {
    const { mois_annee, chantier_id, statut } = req.query;

    let query = `
      SELECT 
        p.*,
        e.matricule, e.nom, e.prenom, e.poste, e.type_contrat, e.cin_nin, e.numero_cnas,
        ch.name as chantier_name,
        c.name as caisse_name
      FROM paies p
      JOIN employees e ON p.employee_id = e.id
      LEFT JOIN chantiers ch ON p.chantier_id = ch.id
      LEFT JOIN caisses c ON p.caisse_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (mois_annee) {
      query += ` AND p.mois_annee = ?`;
      params.push(mois_annee);
    }
    if (chantier_id) {
      query += ` AND p.chantier_id = ?`;
      params.push(chantier_id);
    }
    if (statut) {
      query += ` AND p.statut = ?`;
      params.push(statut);
    }

    query += ` ORDER BY p.mois_annee DESC, e.nom ASC`;

    const paies = db.prepare(query).all(...params);
    res.json(paies);
  } catch (error) {
    console.error('Error fetching paies:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate monthly payroll for all or selected employees
router.post('/paies/generate', (req, res) => {
  try {
    const { mois_annee, chantier_id } = req.body; // e.g. '2026-10'
    if (!mois_annee) return res.status(400).json({ error: 'Mois et année requis' });

    let empQuery = `SELECT * FROM employees WHERE statut = 'ACTIF'`;
    const params = [];
    if (chantier_id) {
      empQuery += ` AND chantier_actuel_id = ?`;
      params.push(chantier_id);
    }
    const employees = db.prepare(empQuery).all(...params);

    const generated = [];

    for (const emp of employees) {
      // Check if paie already exists for this month
      const existing = db.prepare('SELECT id FROM paies WHERE employee_id = ? AND mois_annee = ?').get(emp.id, mois_annee);
      if (existing) continue;

      // Count attendance in this month
      const attendance = db.prepare(`
        SELECT 
          COUNT(CASE WHEN statut = 'PRESENT' THEN 1 END) as jours_presents,
          COUNT(CASE WHEN statut = 'DEMI_JOURNEE' THEN 1 END) as demi_jours,
          COALESCE(SUM(heures_sup), 0) as total_heures_sup,
          COALESCE(SUM(montant_du_jour), 0) as total_journalier
        FROM employee_pointages
        WHERE employee_id = ? AND strftime('%Y-%m', date) = ?
      `).get(emp.id, mois_annee);

      const joursPresents = (attendance ? attendance.jours_presents : 0) + (attendance ? attendance.demi_jours * 0.5 : 0);
      const heuresSup = attendance ? attendance.total_heures_sup : 0;

      let baseSalaire = 0;
      let montantHeuresSup = 0;

      if (emp.type_contrat === 'PERMANENT_MENSUEL') {
        baseSalaire = emp.salaire_base;
        montantHeuresSup = Math.round((emp.salaire_base / 173.33) * 1.5 * heuresSup);
      } else {
        baseSalaire = attendance ? attendance.total_journalier : 0;
      }

      // Check advances in caisse
      const advances = db.prepare(`
        SELECT COALESCE(SUM(montant), 0) as total_avances
        FROM caisse_mouvements
        WHERE beneficiaire_id = ? AND categorie = 'AVANCE_SALAIRE' AND strftime('%Y-%m', date) = ?
      `).get(emp.id, mois_annee);

      const totalAvances = advances ? advances.total_avances : 0;
      const primes = 5000; // Prime de chantier par défaut
      const retenues = emp.type_contrat === 'PERMANENT_MENSUEL' ? Math.round(baseSalaire * 0.09) : 0; // 9% CNAS
      const net = Math.max(0, baseSalaire + montantHeuresSup + primes - totalAvances - retenues);

      const ref = `PAIE-${mois_annee}-${emp.matricule}`;

      const resInsert = db.prepare(`
        INSERT INTO paies (
          reference, employee_id, chantier_id, mois_annee, jours_travailles, 
          salaire_base, montant_heures_sup, primes_chantier, avances_deduites, 
          retenues, net_a_payer, statut
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'GENERE')
      `).run(
        ref, emp.id, emp.chantier_actuel_id, mois_annee, joursPresents,
        baseSalaire, montantHeuresSup, primes, totalAvances, retenues, net
      );

      generated.push({ id: resInsert.lastInsertRowid, employee: emp.nom + ' ' + emp.prenom, net });
    }

    res.json({ message: `${generated.length} fiches de paie générées pour ${mois_annee}`, details: generated });
  } catch (error) {
    console.error('Error generating payroll:', error);
    res.status(500).json({ error: error.message });
  }
});

// Pay a salary slip
router.post('/paies/:id/payer', (req, res) => {
  try {
    const id = req.params.id;
    const { caisse_id, mode_paiement, date_paiement } = req.body;

    const paie = db.prepare(`
      SELECT p.*, e.nom, e.prenom, e.id as emp_id
      FROM paies p
      JOIN employees e ON p.employee_id = e.id
      WHERE p.id = ?
    `).get(id);

    if (!paie) return res.status(404).json({ error: 'Fiche de paie introuvable' });

    db.prepare(`
      UPDATE paies
      SET statut = 'PAYE', caisse_id = ?, mode_paiement = ?, date_paiement = ?
      WHERE id = ?
    `).run(caisse_id, mode_paiement || 'ESPECES', date_paiement || new Date().toISOString().slice(0, 10), id);

    if (caisse_id && paie.net_a_payer > 0) {
      const bcRef = `BC-SAL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      db.prepare(`
        INSERT INTO caisse_mouvements (
          reference, caisse_id, type, montant, date, mode_paiement, 
          piece_justificative, motif, categorie, chantier_id, beneficiaire_id, status
        )
        VALUES (?, ?, 'SORTIE', ?, ?, ?, ?, ?, 'MAIN_DOEUVRE', ?, ?, 'VALIDE')
      `).run(
        bcRef, caisse_id, paie.net_a_payer,
        date_paiement || new Date().toISOString().slice(0, 10),
        mode_paiement || 'ESPECES', paie.reference,
        `Paiement salaire ${paie.mois_annee} - ${paie.nom} ${paie.prenom}`,
        paie.chantier_id, paie.emp_id
      );

      // Deduct from caisse
      db.prepare('UPDATE caisses SET balance = balance - ? WHERE id = ?').run(paie.net_a_payer, caisse_id);
    }

    res.json({ message: 'Salaire payé et décaissé avec succès' });
  } catch (error) {
    console.error('Error paying salary:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
