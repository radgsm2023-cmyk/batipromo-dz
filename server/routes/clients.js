const express = require('express');
const router = express.Router();
const { db } = require('../db');

// List clients
router.get('/', (req, res) => {
  try {
    const clients = db.prepare(`
      SELECT 
        cl.*,
        (SELECT COUNT(*) FROM ventes WHERE client_id = cl.id) as total_acquisitions,
        (SELECT COALESCE(SUM(prix_total), 0) FROM ventes WHERE client_id = cl.id) as total_engagements_da,
        (SELECT COALESCE(SUM(montant_verse), 0) FROM ventes WHERE client_id = cl.id) as total_verse_da,
        (SELECT COALESCE(SUM(reste_a_payer), 0) FROM ventes WHERE client_id = cl.id) as total_reste_a_payer_da
      FROM clients cl
      ORDER BY cl.nom ASC
    `).all();

    res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create client
router.post('/', (req, res) => {
  try {
    const { nom, prenom, nin, telephone, email, adresse, wilaya, profession } = req.body;
    const code = `CLI-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 90)}`;

    const result = db.prepare(`
      INSERT INTO clients (code, nom, prenom, nin, telephone, email, adresse, wilaya, profession)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(code, nom, prenom, nin || '', telephone, email || '', adresse || '', wilaya || '', profession || '');

    res.status(201).json({ id: result.lastInsertRowid, code, message: 'Client créé avec succès' });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: error.message });
  }
});

// List all sales (lots / appartements)
router.get('/ventes/list', (req, res) => {
  try {
    const qp = (v) => (v && v !== 'undefined' && v !== 'null') ? v : undefined;
    const chantier_id = qp(req.query.chantier_id);
    const client_id = qp(req.query.client_id);
    const statut = qp(req.query.statut);

    let query = `
      SELECT 
        v.*,
        cl.nom as client_nom, cl.prenom as client_prenom, cl.telephone as client_telephone, cl.email as client_email,
        ch.name as chantier_name, ch.code as chantier_code, ch.wilaya as chantier_wilaya,
        (SELECT COUNT(*) FROM client_reglements WHERE vente_id = v.id) as versements_count
      FROM ventes v
      JOIN clients cl ON v.client_id = cl.id
      JOIN chantiers ch ON v.chantier_id = ch.id
      WHERE 1=1
    `;
    const params = [];

    if (chantier_id) {
      query += ` AND v.chantier_id = ?`;
      params.push(chantier_id);
    }
    if (client_id) {
      query += ` AND v.client_id = ?`;
      params.push(client_id);
    }
    if (statut) {
      query += ` AND v.statut = ?`;
      params.push(statut);
    }

    query += ` ORDER BY v.date_vente DESC`;

    const ventes = db.prepare(query).all(...params);
    res.json(ventes);
  } catch (error) {
    console.error('Error fetching ventes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new sale contract
router.post('/ventes', (req, res) => {
  try {
    const {
      chantier_id,
      client_id,
      lot_designation,
      surface_m2,
      prix_total,
      montant_verse_initial,
      caisse_id, // where initial payment went
      date_vente,
      statut
    } = req.body;

    const total = Number(prix_total);
    const initialVerse = Number(montant_verse_initial) || 0;
    const reste = total - initialVerse;
    const ref = `CONTRAT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const result = db.prepare(`
      INSERT INTO ventes (
        reference_contrat, chantier_id, client_id, lot_designation, 
        surface_m2, prix_total, montant_verse, reste_a_payer, date_vente, statut
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      ref, chantier_id, client_id, lot_designation,
      Number(surface_m2) || 0, total, initialVerse, reste,
      date_vente || new Date().toISOString().slice(0, 10),
      statut || 'RESERVE'
    );

    const venteId = result.lastInsertRowid;

    // If initial payment, record client_reglement and caisse entry
    if (initialVerse > 0) {
      const recuRef = `REC-CL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      db.prepare(`
        INSERT INTO client_reglements (
          vente_id, client_id, caisse_id, reference_recu, montant, date_reglement, mode_paiement, notes
        )
        VALUES (?, ?, ?, ?, ?, ?, 'VIREMENT', 'Apport initial / Réservation')
      `).run(venteId, client_id, caisse_id || null, recuRef, initialVerse, date_vente || new Date().toISOString().slice(0, 10));

      if (caisse_id) {
        db.prepare('UPDATE caisses SET balance = balance + ? WHERE id = ?').run(initialVerse, caisse_id);
      }
    }

    res.status(201).json({ id: venteId, reference_contrat: ref, message: 'Contrat de vente enregistré avec succès' });
  } catch (error) {
    console.error('Error creating vente:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add payment for a sale contract
router.post('/ventes/:id/reglement', (req, res) => {
  try {
    const venteId = req.params.id;
    const { montant, caisse_id, mode_paiement, banque, numero_piece, date_reglement, notes } = req.body;
    const numAmount = Number(montant);

    const vente = db.prepare('SELECT * FROM ventes WHERE id = ?').get(venteId);
    if (!vente) return res.status(404).json({ error: 'Contrat de vente introuvable' });

    const recuRef = `REC-CL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    db.prepare(`
      INSERT INTO client_reglements (
        vente_id, client_id, caisse_id, reference_recu, montant, 
        date_reglement, mode_paiement, banque, numero_piece, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      venteId, vente.client_id, caisse_id || null, recuRef, numAmount,
      date_reglement || new Date().toISOString().slice(0, 10),
      mode_paiement || 'VIREMENT', banque || '', numero_piece || '', notes || ''
    );

    // Update vente totals
    const nouveauVerse = vente.montant_verse + numAmount;
    const nouveauReste = Math.max(0, vente.prix_total - nouveauVerse);
    const newStatut = nouveauReste === 0 ? 'ACTE_NOTARIE' : vente.statut;

    db.prepare('UPDATE ventes SET montant_verse = ?, reste_a_payer = ?, statut = ? WHERE id = ?').run(nouveauVerse, nouveauReste, newStatut, venteId);

    // Increment caisse balance
    if (caisse_id) {
      db.prepare('UPDATE caisses SET balance = balance + ? WHERE id = ?').run(numAmount, caisse_id);

      // Record caisse mouvement
      const beRef = `BE-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      db.prepare(`
        INSERT INTO caisse_mouvements (
          reference, caisse_id, type, montant, date, mode_paiement, 
          piece_justificative, motif, categorie, chantier_id, status
        )
        VALUES (?, ?, 'ENTREE', ?, ?, ?, ?, ?, 'REGLEMENT_CLIENT', ?, 'VALIDE')
      `).run(
        beRef, caisse_id, numAmount,
        date_reglement || new Date().toISOString().slice(0, 10),
        mode_paiement || 'VIREMENT', recuRef,
        `Versement client ${vente.lot_designation}`,
        vente.chantier_id
      );

      // Notification to Admin
      try {
        const clientInfo = db.prepare('SELECT nom, prenom FROM clients WHERE id = ?').get(vente.client_id);
        const clientName = clientInfo ? `${clientInfo.prenom} ${clientInfo.nom}` : 'Client';
        db.prepare(`
          INSERT INTO notifications (user_id, type, titre, message, montant, lien, reference)
          VALUES (NULL, 'VERSEMENT_CLIENT', ?, ?, ?, 'clients', ?)
        `).run(
          `Versement Acquéreur Client (${recuRef})`,
          `Versement de ${numAmount.toLocaleString('fr-FR')} DA reçu de ${clientName} pour le lot "${vente.lot_designation}". Réf Caisse: ${beRef}`,
          numAmount,
          recuRef
        );
      } catch (errNotif) {
        console.error('Error creating client payment notification:', errNotif);
      }
    }

    res.json({ message: 'Règlement client enregistré avec succès', recuRef, nouveauVerse, nouveauReste });
  } catch (error) {
    console.error('Error adding client payment:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
