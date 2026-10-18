const express = require('express');
const router = express.Router();
const { db } = require('../db');

// List all chantiers
router.get('/', (req, res) => {
  try {
    const chantiers = db.prepare(`
      SELECT 
        c.*,
        u.name as chef_chantier_name,
        (SELECT COUNT(*) FROM employee_affectations WHERE chantier_id = c.id AND statut = 'EN_COURS') as effectif_count,
        (SELECT COUNT(*) FROM materiel_affectations WHERE chantier_id = c.id AND statut = 'ACTIF') as engins_count,
        (SELECT COALESCE(SUM(montant_total), 0) FROM depenses WHERE chantier_id = c.id) as total_depenses,
        (SELECT balance FROM caisses WHERE chantier_id = c.id LIMIT 1) as caisse_solde,
        (SELECT code FROM caisses WHERE chantier_id = c.id LIMIT 1) as caisse_code,
        (SELECT COUNT(*) FROM ventes WHERE chantier_id = c.id) as total_ventes_count,
        (SELECT COALESCE(SUM(prix_total), 0) FROM ventes WHERE chantier_id = c.id) as total_ventes_montant
      FROM chantiers c
      LEFT JOIN users u ON c.chef_chantier_id = u.id
      ORDER BY c.created_at DESC
    `).all();

    res.json(chantiers);
  } catch (error) {
    console.error('Error fetching chantiers:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single chantier with complete details
router.get('/:id', (req, res) => {
  try {
    const id = req.params.id;
    const chantier = db.prepare(`
      SELECT c.*, u.name as chef_chantier_name, u.phone as chef_chantier_phone
      FROM chantiers c
      LEFT JOIN users u ON c.chef_chantier_id = u.id
      WHERE c.id = ?
    `).get(id);

    if (!chantier) {
      return res.status(404).json({ error: 'Chantier introuvable' });
    }

    // 1. Caisse dédiée de fond de roulement
    const caisse = db.prepare(`
      SELECT * FROM caisses WHERE chantier_id = ?
    `).get(id);

    // 2. Mouvements récents de la caisse du chantier
    const mouvementsCaisse = caisse ? db.prepare(`
      SELECT m.*, b.name as beneficiaire_name, f.name as fournisseur_name
      FROM caisse_mouvements m
      LEFT JOIN beneficiaires b ON m.beneficiaire_id = b.id
      LEFT JOIN fournisseurs f ON m.fournisseur_id = f.id
      WHERE m.caisse_id = ?
      ORDER BY m.date DESC, m.id DESC
      LIMIT 10
    `).all(caisse.id) : [];

    // 3. Dépenses du chantier
    const depenses = db.prepare(`
      SELECT d.*, f.name as fournisseur_name, b.name as beneficiaire_name
      FROM depenses d
      LEFT JOIN fournisseurs f ON d.fournisseur_id = f.id
      LEFT JOIN beneficiaires b ON d.beneficiaire_id = b.id
      WHERE d.chantier_id = ?
      ORDER BY d.date DESC
    `).all(id);

    // 4. Personnel affecté
    const personnel = db.prepare(`
      SELECT 
        e.*, 
        a.role_sur_chantier, 
        a.date_debut as date_affectation,
        (SELECT COUNT(*) FROM employee_pointages WHERE employee_id = e.id AND chantier_id = ? AND date >= date('now', '-30 days')) as jours_presence_30j
      FROM employee_affectations a
      JOIN employees e ON a.employee_id = e.id
      WHERE a.chantier_id = ? AND a.statut = 'EN_COURS'
      ORDER BY e.poste ASC
    `).all(id, id);

    // 5. Matériel affecté
    const materiel = db.prepare(`
      SELECT 
        m.*,
        a.date_debut as date_affectation,
        a.date_fin_prevue as date_fin_affectation,
        a.cout_impute,
        op.nom || ' ' || op.prenom as operateur_name
      FROM materiel_affectations a
      JOIN materiel m ON a.materiel_id = m.id
      LEFT JOIN employees op ON a.operateur_id = op.id
      WHERE a.chantier_id = ? AND a.statut = 'ACTIF'
      ORDER BY m.type_propriete DESC, m.nom ASC
    `).all(id);

    // 6. Stocks sur le chantier
    const stocks = db.prepare(`
      SELECT 
        a.code_article, a.designation, a.unite, a.prix_unitaire_moyen,
        n.quantite, (n.quantite * a.prix_unitaire_moyen) as valeur_stock
      FROM stocks_niveaux n
      JOIN stocks_articles a ON n.article_id = a.id
      WHERE n.chantier_id = ? AND n.quantite > 0
    `).all(id);

    // 7. Documents du chantier
    const documents = db.prepare(`
      SELECT * FROM documents WHERE chantier_id = ? ORDER BY date_document DESC
    `).all(id);

    // 8. Ventes / Lots
    const ventes = db.prepare(`
      SELECT v.*, cl.nom as client_nom, cl.prenom as client_prenom, cl.telephone as client_telephone
      FROM ventes v
      JOIN clients cl ON v.client_id = cl.id
      WHERE v.chantier_id = ?
      ORDER BY v.date_vente DESC
    `).all(id);

    res.json({
      ...chantier,
      caisse,
      mouvementsCaisse,
      depenses,
      personnel,
      materiel,
      stocks,
      documents,
      ventes
    });
  } catch (error) {
    console.error('Error fetching chantier details:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new chantier
router.post('/', (req, res) => {
  try {
    const {
      code,
      name,
      type,
      wilaya,
      commune,
      address,
      status,
      start_date,
      end_date_planned,
      budget_total,
      progress_percentage,
      surface_totale_m2,
      nombre_unites,
      chef_chantier_id,
      description,
      initial_caisse_fond // optional initial working capital fund
    } = req.body;

    const stmt = db.prepare(`
      INSERT INTO chantiers (
        code, name, type, wilaya, commune, address, status, 
        start_date, end_date_planned, budget_total, progress_percentage, 
        surface_totale_m2, nombre_unites, chef_chantier_id, description
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      code,
      name,
      type || 'Promotionnel Haut Standing',
      wilaya,
      commune,
      address || '',
      status || 'EN_COURS',
      start_date,
      end_date_planned,
      budget_total || 0,
      progress_percentage || 0,
      surface_totale_m2 || 0,
      nombre_unites || 0,
      chef_chantier_id || null,
      description || ''
    );

    const chantierId = result.lastInsertRowid;

    // Automatically create a dedicated Caisse de Fond de Roulement for this chantier
    const caisseCode = `FDR-${code}`;
    const caisseName = `Fond de Roulement - ${name}`;
    const initialBalance = Number(initial_caisse_fond) || 0;

    db.prepare(`
      INSERT INTO caisses (code, name, type, chantier_id, balance, seuil_alerte, responsable_id, status)
      VALUES (?, ?, 'FOND_ROULEMENT_CHANTIER', ?, ?, 150000, ?, 'ACTIVE')
    `).run(caisseCode, caisseName, chantierId, initialBalance, chef_chantier_id || null);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (action, module, details)
      VALUES ('CREATION_CHANTIER', 'Chantiers', ?)
    `).run(`Création du chantier ${name} (${code}) avec caisse de fond de roulement`);

    res.status(201).json({ id: chantierId, message: 'Chantier et sa caisse créés avec succès' });
  } catch (error) {
    console.error('Error creating chantier:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update chantier
router.put('/:id', (req, res) => {
  try {
    const id = req.params.id;
    const {
      name,
      type,
      wilaya,
      commune,
      address,
      status,
      start_date,
      end_date_planned,
      budget_total,
      progress_percentage,
      surface_totale_m2,
      nombre_unites,
      chef_chantier_id,
      description
    } = req.body;

    db.prepare(`
      UPDATE chantiers
      SET name = ?, type = ?, wilaya = ?, commune = ?, address = ?,
          status = ?, start_date = ?, end_date_planned = ?, budget_total = ?,
          progress_percentage = ?, surface_totale_m2 = ?, nombre_unites = ?,
          chef_chantier_id = ?, description = ?
      WHERE id = ?
    `).run(
      name, type, wilaya, commune, address, status,
      start_date, end_date_planned, budget_total,
      progress_percentage, surface_totale_m2, nombre_unites,
      chef_chantier_id || null, description, id
    );

    res.json({ message: 'Chantier mis à jour avec succès' });
  } catch (error) {
    console.error('Error updating chantier:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete chantier
router.delete('/:id', (req, res) => {
  try {
    const id = req.params.id;
    db.prepare('DELETE FROM chantiers WHERE id = ?').run(id);
    res.json({ message: 'Chantier supprimé' });
  } catch (error) {
    console.error('Error deleting chantier:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
