const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { optionalAuth } = require('../middleware/auth');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports/bilan-tresorerie - Consolidated treasury & cash flow statement
// ─────────────────────────────────────────────────────────────────────────────
router.get('/bilan-tresorerie', optionalAuth, (req, res) => {
  try {
    // 1. All Caisses & Bank accounts
    const caisses = db.prepare(`
      SELECT 
        c.*,
        ch.name as chantier_name,
        ch.code as chantier_code,
        u.name as responsable_name
      FROM caisses c
      LEFT JOIN chantiers ch ON c.chantier_id = ch.id
      LEFT JOIN users u ON c.responsable_id = u.id
      WHERE c.status = 'ACTIVE'
      ORDER BY c.type ASC, c.balance DESC
    `).all();

    const totalFDR = caisses.filter(c => c.type === 'FOND_ROULEMENT_CHANTIER').reduce((acc, c) => acc + (c.balance || 0), 0);
    const totalBanques = caisses.filter(c => c.type === 'COMPTE_BANCAIRE').reduce((acc, c) => acc + (c.balance || 0), 0);
    const totalCentrale = caisses.filter(c => c.type === 'CAISSE_CENTRALE').reduce((acc, c) => acc + (c.balance || 0), 0);
    const totalTresorerie = totalFDR + totalBanques + totalCentrale;

    // 2. Summary of inputs / outputs
    const mouvementsSummary = db.prepare(`
      SELECT 
        type,
        COUNT(*) as count,
        COALESCE(SUM(montant), 0) as total
      FROM caisse_mouvements
      WHERE status = 'VALIDE'
      GROUP BY type
    `).all();

    // 3. Last 30 validated operations
    const recentOperations = db.prepare(`
      SELECT 
        m.*,
        c.name as caisse_name,
        c.type as caisse_type,
        ch.name as chantier_name,
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
      WHERE m.status = 'VALIDE'
      ORDER BY m.date DESC, m.id DESC
      LIMIT 30
    `).all();

    res.json({
      dateRapport: new Date().toISOString(),
      totaux: {
        totalTresorerie,
        totalFDR,
        totalBanques,
        totalCentrale
      },
      caisses,
      mouvementsSummary,
      recentOperations
    });
  } catch (error) {
    console.error('Error generating bilan tresorerie:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports/grand-livre-depenses - General expense ledger by supplier & category
// ─────────────────────────────────────────────────────────────────────────────
router.get('/grand-livre-depenses', optionalAuth, (req, res) => {
  try {
    const { chantier_id, date_debut, date_fin } = req.query;

    let query = `
      SELECT 
        d.*,
        ch.name as chantier_name,
        ch.code as chantier_code,
        f.name as fournisseur_name,
        f.nif as fournisseur_nif,
        f.rc as fournisseur_rc,
        b.name as beneficiaire_name,
        c.name as caisse_name
      FROM depenses d
      JOIN chantiers ch ON d.chantier_id = ch.id
      LEFT JOIN fournisseurs f ON d.fournisseur_id = f.id
      LEFT JOIN beneficiaires b ON d.beneficiaire_id = b.id
      LEFT JOIN caisses c ON d.caisse_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (chantier_id) {
      query += ` AND d.chantier_id = ?`;
      params.push(chantier_id);
    }
    if (date_debut) {
      query += ` AND d.date >= ?`;
      params.push(date_debut);
    }
    if (date_fin) {
      query += ` AND d.date <= ?`;
      params.push(date_fin);
    }

    query += ` ORDER BY d.date DESC, d.id DESC`;

    const depenses = db.prepare(query).all(...params);

    const totalEngage = depenses.reduce((acc, d) => acc + (d.montant_total || 0), 0);
    const totalPaye = depenses.reduce((acc, d) => acc + (d.montant_paye || 0), 0);
    const totalReste = totalEngage - totalPaye;

    // By category
    const parCategorie = {};
    depenses.forEach(d => {
      const cat = d.categorie || 'AUTRE';
      if (!parCategorie[cat]) parCategorie[cat] = { montant: 0, count: 0 };
      parCategorie[cat].montant += (d.montant_total || 0);
      parCategorie[cat].count += 1;
    });

    res.json({
      dateRapport: new Date().toISOString(),
      totaux: {
        totalEngage,
        totalPaye,
        totalReste,
        nombreFactures: depenses.length
      },
      parCategorie,
      depenses
    });
  } catch (error) {
    console.error('Error generating grand livre:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
