const express = require('express');
const router = express.Router();
const { db } = require('../db');

// List expenses with filters
router.get('/', (req, res) => {
  try {
    const { chantier_id, fournisseur_id, categorie, statut_paiement, search } = req.query;

    let query = `
      SELECT 
        d.*,
        ch.name as chantier_name,
        ch.code as chantier_code,
        f.name as fournisseur_name,
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
    if (fournisseur_id) {
      query += ` AND d.fournisseur_id = ?`;
      params.push(fournisseur_id);
    }
    if (categorie) {
      query += ` AND d.categorie = ?`;
      params.push(categorie);
    }
    if (statut_paiement) {
      query += ` AND d.statut_paiement = ?`;
      params.push(statut_paiement);
    }
    if (search) {
      query += ` AND (d.reference LIKE ? OR d.description LIKE ? OR d.facture_numero LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY d.date DESC, d.id DESC`;

    const depenses = db.prepare(query).all(...params);
    res.json(depenses);
  } catch (error) {
    console.error('Error fetching depenses:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create expense
router.post('/', (req, res) => {
  try {
    const {
      chantier_id,
      fournisseur_id,
      beneficiaire_id,
      date,
      categorie,
      montant_total,
      montant_paye,
      mode_reglement,
      caisse_id,
      date_echeance,
      description,
      facture_numero,
      debiter_caisse // boolean: should this automatically record a cash fund disbursement?
    } = req.body;

    const total = Number(montant_total);
    const paye = Number(montant_paye) || 0;
    const statut = paye >= total ? 'PAYE' : (paye > 0 ? 'PARTIEL' : 'NON_PAYE');
    const ref = `DEP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const result = db.prepare(`
      INSERT INTO depenses (
        reference, chantier_id, fournisseur_id, beneficiaire_id, date, 
        categorie, montant_total, montant_paye, mode_reglement, caisse_id, 
        statut_paiement, date_echeance, description, facture_numero
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      ref, chantier_id, fournisseur_id || null, beneficiaire_id || null,
      date || new Date().toISOString().slice(0, 10),
      categorie, total, paye, mode_reglement || 'ESPECES',
      caisse_id || null, statut, date_echeance || null,
      description, facture_numero || null
    );

    // If paid by caisse and requested, create caisse movement
    if (debiter_caisse && caisse_id && paye > 0) {
      const bcRef = `BC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      db.prepare(`
        INSERT INTO caisse_mouvements (
          reference, caisse_id, type, montant, date, mode_paiement, 
          piece_justificative, motif, categorie, chantier_id, 
          fournisseur_id, beneficiaire_id, status
        )
        VALUES (?, ?, 'SORTIE', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'VALIDE')
      `).run(
        bcRef, caisse_id, paye, date || new Date().toISOString().slice(0, 10),
        mode_reglement || 'ESPECES', facture_numero || ref,
        `Règlement facture ${description}`, categorie || 'ACHAT_MATERIAUX',
        chantier_id, fournisseur_id || null, beneficiaire_id || null
      );

      // Decrement caisse balance
      db.prepare('UPDATE caisses SET balance = balance - ? WHERE id = ?').run(paye, caisse_id);
    }

    res.status(201).json({ id: result.lastInsertRowid, reference: ref, message: 'Dépense enregistrée avec succès' });
  } catch (error) {
    console.error('Error creating depense:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update expense (e.g. add a payment)
router.put('/:id/reglement', (req, res) => {
  try {
    const id = req.params.id;
    const { montant_verse, caisse_id, mode_reglement } = req.body;
    const montantVerse = Number(montant_verse);

    const depense = db.prepare('SELECT * FROM depenses WHERE id = ?').get(id);
    if (!depense) return res.status(404).json({ error: 'Dépense introuvable' });

    const newPaye = depense.montant_paye + montantVerse;
    const statut = newPaye >= depense.montant_total ? 'PAYE' : 'PARTIEL';

    db.prepare(`
      UPDATE depenses 
      SET montant_paye = ?, statut_paiement = ? 
      WHERE id = ?
    `).run(newPaye, statut, id);

    if (caisse_id && montantVerse > 0) {
      const bcRef = `BC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      db.prepare(`
        INSERT INTO caisse_mouvements (
          reference, caisse_id, type, montant, date, mode_paiement, 
          motif, categorie, chantier_id, fournisseur_id, status
        )
        VALUES (?, ?, 'SORTIE', ?, CURRENT_DATE, ?, ?, ?, ?, ?, 'VALIDE')
      `).run(
        bcRef, caisse_id, montantVerse, mode_reglement || 'ESPECES',
        `Règlement solde dépense ${depense.reference}`, depense.categorie,
        depense.chantier_id, depense.fournisseur_id
      );

      db.prepare('UPDATE caisses SET balance = balance - ? WHERE id = ?').run(montantVerse, caisse_id);
    }

    res.json({ message: 'Règlement enregistré avec succès', nouveau_solde_paye: newPaye });
  } catch (error) {
    console.error('Error registering depense payment:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
