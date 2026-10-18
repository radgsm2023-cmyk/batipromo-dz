const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { optionalAuth } = require('../middleware/auth');

// Default standard Algerian construction phases
const STANDARD_PHASES = [
  { nom: 'Terrassement & Fouilles en pleine masse', ordre: 1, dureeMois: 2, pct: 100, statut: 'TERMINE', notes: 'Évacuation gravois et terrassement au rocher' },
  { nom: 'Fondations profondes, Radier & Sous-sols', ordre: 2, dureeMois: 4, pct: 100, statut: 'TERMINE', notes: 'Béton armé dosé à 350kg/m³, étanchéité cuvelage' },
  { nom: 'Structure & Gros Œuvres (Poteaux / Dalles)', ordre: 3, dureeMois: 8, pct: 75, statut: 'EN_COURS', notes: 'Élévation des étages R+ et planchers corps creux' },
  { nom: 'Maçonnerie, Cloisons & Brique rouge 12 trous', ordre: 4, dureeMois: 4, pct: 30, statut: 'EN_COURS', notes: 'Double paroi avec isolation phonique et thermique' },
  { nom: 'Plomberie, Électricité, Chauffage & Climatisation', ordre: 5, dureeMois: 5, pct: 15, statut: 'EN_COURS', notes: 'Incorporation gaines et colonnes montantes' },
  { nom: 'Enduits plâtre, Revêtements Sols & Faïences', ordre: 6, dureeMois: 5, pct: 0, statut: 'A_VENIR', notes: 'Monocouche extérieur et grès cérame premier choix' },
  { nom: 'Menuiserie Aluminium / PVC, Sanitaires & Peinture', ordre: 7, dureeMois: 4, pct: 0, statut: 'A_VENIR', notes: 'Double vitrage, portes blindées, cuisines équipées' },
  { nom: 'VRD, Raccordements Sonelgaz/ADE & Aménagements', ordre: 8, dureeMois: 3, pct: 0, statut: 'A_VENIR', notes: 'Branchements eau, gaz, électricité et espaces verts' },
  { nom: 'Contrôle CTC, Certificat de Conformité & Livraison', ordre: 9, dureeMois: 2, pct: 0, statut: 'A_VENIR', notes: 'PV de réception définitive et remise des clés' }
];

// Helper: seed default phases for a chantier if empty
function ensurePhasesForChantier(chantierId) {
  const count = db.prepare('SELECT COUNT(*) as count FROM chantier_planning WHERE chantier_id = ?').get(chantierId);
  if (!count || count.count === 0) {
    const ch = db.prepare('SELECT start_date, end_date_planned FROM chantiers WHERE id = ?').get(chantierId);
    const startDate = new Date(ch?.start_date || '2025-03-01');
    
    let currentDate = new Date(startDate);
    const insert = db.prepare(`
      INSERT INTO chantier_planning (
        chantier_id, phase_nom, ordre, date_debut_prevue, date_fin_prevue, 
        progress_pct, statut, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    STANDARD_PHASES.forEach((p) => {
      const start = new Date(currentDate);
      currentDate.setMonth(currentDate.getMonth() + p.dureeMois);
      const end = new Date(currentDate);

      insert.run(
        chantierId,
        p.nom,
        p.ordre,
        start.toISOString().slice(0, 10),
        end.toISOString().slice(0, 10),
        p.pct,
        p.statut,
        p.notes
      );
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/planning - List planning phases
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const { chantier_id } = req.query;

    if (chantier_id) {
      ensurePhasesForChantier(chantier_id);
      const phases = db.prepare(`
        SELECT p.*, c.name as chantier_name, c.code as chantier_code
        FROM chantier_planning p
        JOIN chantiers c ON p.chantier_id = c.id
        WHERE p.chantier_id = ?
        ORDER BY p.ordre ASC, p.date_debut_prevue ASC
      `).all(chantier_id);

      return res.json(phases);
    }

    // All phases across all active chantiers
    const chantiers = db.prepare('SELECT id FROM chantiers').all();
    for (const c of chantiers) {
      ensurePhasesForChantier(c.id);
    }

    const phases = db.prepare(`
      SELECT p.*, c.name as chantier_name, c.code as chantier_code
      FROM chantier_planning p
      JOIN chantiers c ON p.chantier_id = c.id
      ORDER BY p.chantier_id ASC, p.ordre ASC
    `).all();

    res.json(phases);
  } catch (error) {
    console.error('Error fetching planning:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/planning - Create new phase
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', optionalAuth, (req, res) => {
  try {
    const {
      chantier_id,
      phase_nom,
      ordre,
      date_debut_prevue,
      date_fin_prevue,
      progress_pct,
      statut,
      responsable,
      budget_alloue,
      notes
    } = req.body;

    if (!chantier_id || !phase_nom || !date_debut_prevue || !date_fin_prevue) {
      return res.status(400).json({ error: 'Chantier, nom de la phase et dates prévues obligatoires' });
    }

    const result = db.prepare(`
      INSERT INTO chantier_planning (
        chantier_id, phase_nom, ordre, date_debut_prevue, date_fin_prevue,
        progress_pct, statut, responsable, budget_alloue, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      chantier_id,
      phase_nom,
      ordre || 1,
      date_debut_prevue,
      date_fin_prevue,
      progress_pct || 0,
      statut || 'A_VENIR',
      responsable || '',
      budget_alloue || 0,
      notes || ''
    );

    res.status(201).json({ id: result.lastInsertRowid, message: 'Phase ajoutée au planning avec succès' });
  } catch (error) {
    console.error('Error creating planning phase:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/planning/:id - Update phase
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id', optionalAuth, (req, res) => {
  try {
    const { id } = req.params;
    const {
      phase_nom,
      ordre,
      date_debut_prevue,
      date_fin_prevue,
      date_debut_reelle,
      date_fin_reelle,
      progress_pct,
      statut,
      responsable,
      budget_alloue,
      notes
    } = req.body;

    const current = db.prepare('SELECT * FROM chantier_planning WHERE id = ?').get(id);
    if (!current) {
      return res.status(404).json({ error: 'Phase de planning introuvable' });
    }

    const pct = progress_pct !== undefined ? Number(progress_pct) : current.progress_pct;
    let computedStatut = statut || current.statut;
    if (pct >= 100) computedStatut = 'TERMINE';
    else if (pct > 0 && computedStatut === 'A_VENIR') computedStatut = 'EN_COURS';

    db.prepare(`
      UPDATE chantier_planning SET
        phase_nom = COALESCE(?, phase_nom),
        ordre = COALESCE(?, ordre),
        date_debut_prevue = COALESCE(?, date_debut_prevue),
        date_fin_prevue = COALESCE(?, date_fin_prevue),
        date_debut_reelle = COALESCE(?, date_debut_reelle),
        date_fin_reelle = COALESCE(?, date_fin_reelle),
        progress_pct = ?,
        statut = ?,
        responsable = COALESCE(?, responsable),
        budget_alloue = COALESCE(?, budget_alloue),
        notes = COALESCE(?, notes)
      WHERE id = ?
    `).run(
      phase_nom || null,
      ordre !== undefined ? ordre : null,
      date_debut_prevue || null,
      date_fin_prevue || null,
      date_debut_reelle || null,
      date_fin_reelle || null,
      pct,
      computedStatut,
      responsable !== undefined ? responsable : null,
      budget_alloue !== undefined ? budget_alloue : null,
      notes !== undefined ? notes : null,
      id
    );

    // Recalculate average progress of the chantier and update chantiers.progress_percentage
    const avg = db.prepare('SELECT AVG(progress_pct) as avg_prog FROM chantier_planning WHERE chantier_id = ?').get(current.chantier_id);
    if (avg && avg.avg_prog !== null) {
      const rounded = Math.round(avg.avg_prog);
      db.prepare('UPDATE chantiers SET progress_percentage = ? WHERE id = ?').run(rounded, current.chantier_id);
    }

    res.json({ message: 'Phase mise à jour avec succès', status: computedStatut });
  } catch (error) {
    console.error('Error updating planning phase:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/planning/:id - Delete phase
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', optionalAuth, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM chantier_planning WHERE id = ?').run(id);
    res.json({ message: 'Phase supprimée du planning' });
  } catch (error) {
    console.error('Error deleting planning phase:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
