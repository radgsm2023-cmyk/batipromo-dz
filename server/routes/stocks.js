const express = require('express');
const router = express.Router();
const { db } = require('../db');

// 1. Articles catalog with total quantities and alert status
router.get('/articles', (req, res) => {
  try {
    const { categorie, search } = req.query;

    let query = `
      SELECT 
        a.*,
        COALESCE(SUM(n.quantite), 0) as stock_total,
        COALESCE(SUM(CASE WHEN n.is_depot_central = 1 THEN n.quantite ELSE 0 END), 0) as stock_depot_central,
        COALESCE(SUM(CASE WHEN n.is_depot_central = 0 THEN n.quantite ELSE 0 END), 0) as stock_chantiers,
        (COALESCE(SUM(n.quantite), 0) * a.prix_unitaire_moyen) as valeur_totale_da,
        CASE WHEN COALESCE(SUM(n.quantite), 0) <= a.stock_min_alerte THEN 1 ELSE 0 END as is_alerte
      FROM stocks_articles a
      LEFT JOIN stocks_niveaux n ON a.id = n.article_id
      WHERE 1=1
    `;
    const params = [];

    if (categorie) {
      query += ` AND a.categorie = ?`;
      params.push(categorie);
    }
    if (search) {
      query += ` AND (a.code_article LIKE ? OR a.designation LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` GROUP BY a.id ORDER BY is_alerte DESC, a.designation ASC`;

    const articles = db.prepare(query).all(...params);
    res.json(articles);
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new article
router.post('/articles', (req, res) => {
  try {
    const { code_article, designation, categorie, unite, prix_unitaire_moyen, stock_min_alerte } = req.body;
    const code = code_article || `ART-${Math.floor(100 + Math.random() * 900)}`;

    const result = db.prepare(`
      INSERT INTO stocks_articles (code_article, designation, categorie, unite, prix_unitaire_moyen, stock_min_alerte)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      code, designation, categorie || 'GROS_OEUVRE', unite || 'Unité',
      Number(prix_unitaire_moyen) || 0, Number(stock_min_alerte) || 10
    );

    res.status(201).json({ id: result.lastInsertRowid, code, message: 'Article créé avec succès' });
  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Stock levels by location (Chantiers & Central Warehouse)
router.get('/niveaux', (req, res) => {
  try {
    const qp = (v) => (v && v !== 'undefined' && v !== 'null') ? v : undefined;
    const article_id = qp(req.query.article_id);
    const chantier_id = qp(req.query.chantier_id);

    let query = `
      SELECT 
        n.*,
        a.code_article, a.designation, a.unite, a.prix_unitaire_moyen, a.stock_min_alerte,
        CASE WHEN n.is_depot_central = 1 THEN 'Dépôt Central Chéraga' ELSE ch.name END as emplacement_nom,
        ch.code as chantier_code
      FROM stocks_niveaux n
      JOIN stocks_articles a ON n.article_id = a.id
      LEFT JOIN chantiers ch ON n.chantier_id = ch.id
      WHERE 1=1
    `;
    const params = [];

    if (article_id) {
      query += ` AND n.article_id = ?`;
      params.push(article_id);
    }
    if (chantier_id) {
      query += ` AND n.chantier_id = ?`;
      params.push(chantier_id);
    }

    query += ` ORDER BY a.designation ASC, n.is_depot_central DESC`;

    const niveaux = db.prepare(query).all(...params);
    res.json(niveaux);
  } catch (error) {
    console.error('Error fetching stocks niveaux:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Stock Movements (In, Out, Transfer)
router.get('/mouvements', (req, res) => {
  try {
    const { article_id, chantier_id, type_mouvement } = req.query;

    let query = `
      SELECT 
        m.*,
        a.code_article, a.designation as article_designation, a.unite,
        src.name as source_nom,
        dst.name as destination_nom,
        f.name as fournisseur_name,
        u.name as responsable_name
      FROM stocks_mouvements m
      JOIN stocks_articles a ON m.article_id = a.id
      LEFT JOIN chantiers src ON m.chantier_source_id = src.id
      LEFT JOIN chantiers dst ON m.chantier_destination_id = dst.id
      LEFT JOIN fournisseurs f ON m.fournisseur_id = f.id
      LEFT JOIN users u ON m.responsable_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (article_id) {
      query += ` AND m.article_id = ?`;
      params.push(article_id);
    }
    if (chantier_id) {
      query += ` AND (m.chantier_source_id = ? OR m.chantier_destination_id = ?)`;
      params.push(chantier_id, chantier_id);
    }
    if (type_mouvement) {
      query += ` AND m.type_mouvement = ?`;
      params.push(type_mouvement);
    }

    query += ` ORDER BY m.date_mouvement DESC, m.id DESC LIMIT 100`;

    const mouvements = db.prepare(query).all(...params);
    res.json(mouvements);
  } catch (error) {
    console.error('Error fetching stocks mouvements:', error);
    res.status(500).json({ error: error.message });
  }
});

// Record stock movement (updates levels atomically)
router.post('/mouvements', (req, res) => {
  try {
    const {
      article_id,
      type_mouvement, // 'ENTREE_ACHAT', 'SORTIE_CONSOMMATION', 'TRANSFERT', 'INVENTAIRE'
      quantite,
      prix_unitaire,
      chantier_source_id,
      chantier_destination_id,
      is_source_depot_central,
      is_destination_depot_central,
      fournisseur_id,
      numero_bl,
      date_mouvement,
      responsable_id,
      motif
    } = req.body;

    const qty = Number(quantite);
    const pu = Number(prix_unitaire) || 0;
    const total = qty * pu;
    const ref = `BON-STK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const result = db.prepare(`
      INSERT INTO stocks_mouvements (
        reference_bon, article_id, type_mouvement, quantite, prix_unitaire, 
        montant_total, chantier_source_id, chantier_destination_id, 
        fournisseur_id, numero_bl, date_mouvement, responsable_id, motif
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      ref, article_id, type_mouvement, qty, pu, total,
      chantier_source_id || null, chantier_destination_id || null,
      fournisseur_id || null, numero_bl || null,
      date_mouvement || new Date().toISOString().slice(0, 10),
      responsable_id || null, motif || ''
    );

    // Update stocks_niveaux accordingly
    if (type_mouvement === 'ENTREE_ACHAT') {
      const isCentral = is_destination_depot_central ? 1 : (chantier_destination_id ? 0 : 1);
      const targetCht = isCentral ? null : chantier_destination_id;

      const existing = db.prepare('SELECT id, quantite FROM stocks_niveaux WHERE article_id = ? AND ((is_depot_central = 1 AND ? = 1) OR (chantier_id = ? AND ? = 0))').get(article_id, isCentral, targetCht, isCentral);

      if (existing) {
        db.prepare('UPDATE stocks_niveaux SET quantite = quantite + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(qty, existing.id);
      } else {
        db.prepare('INSERT INTO stocks_niveaux (article_id, chantier_id, is_depot_central, quantite) VALUES (?, ?, ?, ?)').run(article_id, targetCht, isCentral, qty);
      }
    } else if (type_mouvement === 'SORTIE_CONSOMMATION') {
      const isCentral = is_source_depot_central ? 1 : 0;
      const srcCht = isCentral ? null : chantier_source_id;

      const existing = db.prepare('SELECT id, quantite FROM stocks_niveaux WHERE article_id = ? AND ((is_depot_central = 1 AND ? = 1) OR (chantier_id = ? AND ? = 0))').get(article_id, isCentral, srcCht, isCentral);

      if (existing) {
        db.prepare('UPDATE stocks_niveaux SET quantite = MAX(0, quantite - ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(qty, existing.id);
      }
    } else if (type_mouvement === 'TRANSFERT') {
      // Deduct from source
      const srcIsCentral = is_source_depot_central ? 1 : (chantier_source_id ? 0 : 1);
      const srcCht = srcIsCentral ? null : chantier_source_id;
      const srcExisting = db.prepare('SELECT id FROM stocks_niveaux WHERE article_id = ? AND ((is_depot_central = 1 AND ? = 1) OR (chantier_id = ? AND ? = 0))').get(article_id, srcIsCentral, srcCht, srcIsCentral);
      if (srcExisting) {
        db.prepare('UPDATE stocks_niveaux SET quantite = MAX(0, quantite - ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(qty, srcExisting.id);
      }

      // Add to destination
      const dstIsCentral = is_destination_depot_central ? 1 : (chantier_destination_id ? 0 : 1);
      const dstCht = dstIsCentral ? null : chantier_destination_id;
      const dstExisting = db.prepare('SELECT id FROM stocks_niveaux WHERE article_id = ? AND ((is_depot_central = 1 AND ? = 1) OR (chantier_id = ? AND ? = 0))').get(article_id, dstIsCentral, dstCht, dstIsCentral);
      if (dstExisting) {
        db.prepare('UPDATE stocks_niveaux SET quantite = quantite + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(qty, dstExisting.id);
      } else {
        db.prepare('INSERT INTO stocks_niveaux (article_id, chantier_id, is_depot_central, quantite) VALUES (?, ?, ?, ?)').run(article_id, dstCht, dstIsCentral, qty);
      }
    }

    res.status(201).json({ id: result.lastInsertRowid, reference: ref, message: 'Mouvement de stock enregistré avec succès' });
  } catch (error) {
    console.error('Error recording stock mouvement:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
