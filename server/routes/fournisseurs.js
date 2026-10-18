const express = require('express');
const router = express.Router();
const { db } = require('../db');

// List fournisseurs
router.get('/', (req, res) => {
  try {
    const fournisseurs = db.prepare(`
      SELECT 
        f.*,
        (SELECT COUNT(*) FROM depenses WHERE fournisseur_id = f.id) as total_factures,
        (SELECT COALESCE(SUM(montant_total), 0) FROM depenses WHERE fournisseur_id = f.id) as total_achats,
        (SELECT COALESCE(SUM(montant_paye), 0) FROM depenses WHERE fournisseur_id = f.id) as total_regle,
        (SELECT COALESCE(SUM(montant_total - montant_paye), 0) FROM depenses WHERE fournisseur_id = f.id) as solde_restant_du
      FROM fournisseurs f
      ORDER BY f.name ASC
    `).all();

    res.json(fournisseurs);
  } catch (error) {
    console.error('Error fetching fournisseurs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create fournisseur
router.post('/', (req, res) => {
  try {
    const { code, name, specialite, wilaya, phone, email, nif, nis, rc, rib } = req.body;
    const generatedCode = code || `FRN-${Math.floor(100 + Math.random() * 900)}`;

    const result = db.prepare(`
      INSERT INTO fournisseurs (code, name, specialite, wilaya, phone, email, nif, nis, rc, rib)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(generatedCode, name, specialite, wilaya, phone, email || '', nif || '', nis || '', rc || '', rib || '');

    res.status(201).json({ id: result.lastInsertRowid, message: 'Fournisseur ajouté avec succès' });
  } catch (error) {
    console.error('Error creating fournisseur:', error);
    res.status(500).json({ error: error.message });
  }
});

// Bénéficiaires endpoints
router.get('/beneficiaires/list', (req, res) => {
  try {
    const beneficiaires = db.prepare(`
      SELECT 
        b.*,
        (SELECT COUNT(*) FROM caisse_mouvements WHERE beneficiaire_id = b.id) as total_operations,
        (SELECT COALESCE(SUM(montant), 0) FROM caisse_mouvements WHERE beneficiaire_id = b.id) as total_versements
      FROM beneficiaires b
      ORDER BY b.name ASC
    `).all();
    res.json(beneficiaires);
  } catch (error) {
    console.error('Error fetching beneficiaires:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/beneficiaires', (req, res) => {
  try {
    const { name, type, phone, nif_cin, address, notes } = req.body;
    const result = db.prepare(`
      INSERT INTO beneficiaires (name, type, phone, nif_cin, address, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, type || 'PARTICULIER', phone, nif_cin || '', address || '', notes || '');

    res.status(201).json({ id: result.lastInsertRowid, message: 'Bénéficiaire enregistré avec succès' });
  } catch (error) {
    console.error('Error creating beneficiaire:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
