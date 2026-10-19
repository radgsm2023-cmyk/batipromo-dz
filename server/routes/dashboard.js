const express = require('express');
const router = express.Router();
const { db } = require('../db');

router.get('/stats', (req, res) => {
  try {
    // 1. Chantiers stats
    const chantiersSummary = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status != 'LIVRE' THEN 1 ELSE 0 END) as active,
        SUM(budget_total) as total_budget,
        AVG(progress_percentage) as avg_progress
      FROM chantiers
    `).get();

    // 2. Caisses & Trésorerie
    const caisses = db.prepare(`
      SELECT 
        SUM(balance) as total_tresorerie,
        SUM(CASE WHEN type = 'FOND_ROULEMENT_CHANTIER' THEN balance ELSE 0 END) as total_fdr,
        SUM(CASE WHEN type = 'COMPTE_BANCAIRE' THEN balance ELSE 0 END) as total_banque,
        SUM(CASE WHEN balance <= seuil_alerte THEN 1 ELSE 0 END) as alertes_count
      FROM caisses
      WHERE status = 'ACTIVE'
    `).get();

    // Caisses list with alert status
    const caissesAlertes = db.prepare(`
      SELECT c.*, ch.name as chantier_name
      FROM caisses c
      LEFT JOIN chantiers ch ON c.chantier_id = ch.id
      WHERE c.balance <= c.seuil_alerte AND c.status = 'ACTIVE'
    `).all();

    // 3. Dépenses stats
    const depensesStats = db.prepare(`
      SELECT 
        SUM(montant_total) as total_depenses,
        SUM(montant_paye) as total_paye,
        SUM(montant_total - montant_paye) as reste_a_payer
      FROM depenses
    `).get();

    // 4. Ventes & Recouvrement
    const ventesStats = db.prepare(`
      SELECT 
        COUNT(*) as total_contrats,
        SUM(prix_total) as total_ventes,
        SUM(montant_verse) as total_recouvre,
        SUM(reste_a_payer) as reste_a_recouvrer
      FROM ventes
    `).get();

    // 5. Personnel
    const personnelStats = db.prepare(`
      SELECT 
        COUNT(*) as total_personnel,
        SUM(CASE WHEN statut = 'ACTIF' THEN 1 ELSE 0 END) as actifs,
        SUM(CASE WHEN type_contrat = 'PERMANENT_MENSUEL' THEN 1 ELSE 0 END) as permanents,
        SUM(CASE WHEN type_contrat = 'JOURNALIER_TACHERON' THEN 1 ELSE 0 END) as journaliers
      FROM employees
    `).get();

    // Masse salariale du dernier mois
    const paieDernierMois = db.prepare(`
      SELECT SUM(net_a_payer) as masse_salariale
      FROM paies
      WHERE mois_annee = (SELECT MAX(mois_annee) FROM paies)
    `).get();

    // 6. Matériel & Engins
    const materielStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN type_propriete = 'INTERNE' THEN 1 ELSE 0 END) as internes,
        SUM(CASE WHEN type_propriete = 'LOCATION' THEN 1 ELSE 0 END) as loues,
        SUM(CASE WHEN statut = 'AFFECTE_CHANTIER' THEN 1 ELSE 0 END) as affectes,
        SUM(CASE WHEN statut IN ('EN_PANNE', 'EN_MAINTENANCE') THEN 1 ELSE 0 END) as en_panne
      FROM materiel
    `).get();

    // 7. Stocks Alertes
    const stocksAlertes = db.prepare(`
      SELECT 
        a.id, a.code_article, a.designation, a.unite, a.stock_min_alerte,
        COALESCE(SUM(n.quantite), 0) as quantite_totale
      FROM stocks_articles a
      LEFT JOIN stocks_niveaux n ON a.id = n.article_id
      GROUP BY a.id, a.code_article, a.designation, a.unite, a.stock_min_alerte
      HAVING COALESCE(SUM(n.quantite), 0) <= a.stock_min_alerte
    `).all();

    // 8. Chantiers récapitulatif
    const chantiersProgress = db.prepare(`
      SELECT 
        c.id, c.code, c.name, c.wilaya, c.status, c.progress_percentage, c.budget_total,
        COALESCE(SUM(d.montant_total), 0) as depenses_cumulees,
        (SELECT balance FROM caisses WHERE chantier_id = c.id LIMIT 1) as caisse_solde
      FROM chantiers c
      LEFT JOIN depenses d ON c.id = d.chantier_id
      GROUP BY c.id
      ORDER BY c.progress_percentage DESC
    `).all();

    // 9. Dépenses par catégorie
    const depensesParCategorie = db.prepare(`
      SELECT categorie, SUM(montant_total) as montant
      FROM depenses
      GROUP BY categorie
      ORDER BY montant DESC
    `).all();

    // 10. Derniers mouvements de caisse
    const recentMouvements = db.prepare(`
      SELECT 
        m.*, 
        c.name as caisse_name,
        ch.name as chantier_name,
        b.name as beneficiaire_name,
        f.name as fournisseur_name
      FROM caisse_mouvements m
      JOIN caisses c ON m.caisse_id = c.id
      LEFT JOIN chantiers ch ON m.chantier_id = ch.id
      LEFT JOIN beneficiaires b ON m.beneficiaire_id = b.id
      LEFT JOIN fournisseurs f ON m.fournisseur_id = f.id
      ORDER BY m.date DESC, m.id DESC
      LIMIT 6
    `).all();

    // 11. Évolution dépenses mensuelles (12 derniers mois)
    const depensesEvolution = db.prepare(`
      SELECT TO_CHAR(date::date, 'YYYY-MM') as mois, SUM(montant_total) as montant
      FROM depenses
      WHERE date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY 1
      ORDER BY 1 ASC
    `).all();

    // 12. Ventes par statut
    const ventesParStatut = db.prepare(`
      SELECT statut, COUNT(*) as count, COALESCE(SUM(prix_total), 0) as montant
      FROM ventes
      GROUP BY statut
      ORDER BY montant DESC
    `).all();

    // 13. Évolution trésorerie (6 derniers mois)
    const tresorerieEvolution = db.prepare(`
      SELECT 
        TO_CHAR(m.date::date, 'YYYY-MM') as mois,
        SUM(CASE WHEN m.type = 'ENTREE' THEN m.montant ELSE 0 END) as entrees,
        SUM(CASE WHEN m.type = 'SORTIE' THEN m.montant ELSE 0 END) as sorties,
        SUM(CASE WHEN m.type = 'ENTREE' THEN m.montant ELSE -m.montant END) as solde
      FROM caisse_mouvements m
      WHERE m.date >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY 1
      ORDER BY 1 ASC
    `).all();

    res.json({
      chantiersSummary: {
        total: chantiersSummary.total || 0,
        active: chantiersSummary.active || 0,
        totalBudget: chantiersSummary.total_budget || 0,
        avgProgress: Math.round(chantiersSummary.avg_progress || 0)
      },
      tresorerie: {
        total: caisses.total_tresorerie || 0,
        fdrChantiers: caisses.total_fdr || 0,
        banques: caisses.total_banque || 0,
        alertesCount: caisses.alertes_count || 0,
        caissesAlertes,
        evolution: tresorerieEvolution
      },
      depenses: {
        total: depensesStats.total_depenses || 0,
        paye: depensesStats.total_paye || 0,
        resteAPayer: depensesStats.reste_a_payer || 0,
        parCategorie: depensesParCategorie,
        evolution: depensesEvolution
      },
      ventes: {
        totalContrats: ventesStats.total_contrats || 0,
        totalVentes: ventesStats.total_ventes || 0,
        totalRecouvre: ventesStats.total_recouvre || 0,
        resteARecouvrer: ventesStats.reste_a_recouvrer || 0,
        tauxRecouvrement: ventesStats.total_ventes ? Math.round((ventesStats.total_recouvre / ventesStats.total_ventes) * 100) : 0,
        parStatut: ventesParStatut
      },
      personnel: {
        total: personnelStats.total_personnel || 0,
        actifs: personnelStats.actifs || 0,
        permanents: personnelStats.permanents || 0,
        journaliers: personnelStats.journaliers || 0,
        masseSalarialeMois: paieDernierMois ? paieDernierMois.masse_salariale || 0 : 0
      },
      materiel: {
        total: materielStats.total || 0,
        internes: materielStats.internes || 0,
        loues: materielStats.loues || 0,
        affectes: materielStats.affectes || 0,
        enPanne: materielStats.en_panne || 0
      },
      stocksAlertes,
      chantiersProgress,
      recentMouvements
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// GET /stats/:chantierId - Statistiques pour un chantier donné
// ============================================================
router.get('/stats/:chantierId', (req, res) => {
  try {
    const { chantierId } = req.params;

    // Vérifier que le chantier existe
    const chantier = db.prepare(`
      SELECT c.*, u.name as chef_chantier_name
      FROM chantiers c
      LEFT JOIN users u ON c.chef_chantier_id = u.id
      WHERE c.id = ?
    `).get(chantierId);

    if (!chantier) {
      return res.status(404).json({ error: 'Chantier non trouvé' });
    }

    // --- Trésorerie ---
    const caissesDetail = db.prepare(`
      SELECT *
      FROM caisses
      WHERE chantier_id = ? AND status = 'ACTIVE'
    `).all(chantierId);

    const tresorerieTotal = caissesDetail.reduce((sum, c) => sum + (c.balance || 0), 0);
    const alertesCount = caissesDetail.filter(c => c.balance <= c.seuil_alerte).length;

    // --- Dépenses ---
    const depensesStats = db.prepare(`
      SELECT 
        COALESCE(SUM(montant_total), 0) as total_depenses,
        COALESCE(SUM(montant_paye), 0) as total_paye,
        COALESCE(SUM(montant_total - montant_paye), 0) as reste_a_payer
      FROM depenses
      WHERE chantier_id = ?
    `).get(chantierId);

    const depensesParCategorie = db.prepare(`
      SELECT categorie, SUM(montant_total) as montant
      FROM depenses
      WHERE chantier_id = ?
      GROUP BY categorie
      ORDER BY montant DESC
    `).all(chantierId);

    const depensesEvolution = db.prepare(`
      SELECT TO_CHAR(date::date, 'YYYY-MM') as mois, SUM(montant_total) as montant
      FROM depenses
      WHERE chantier_id = ? AND date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY 1
      ORDER BY 1 ASC
    `).all(chantierId);

    // --- Ventes ---
    const ventesStats = db.prepare(`
      SELECT 
        COUNT(*) as total_contrats,
        COALESCE(SUM(prix_total), 0) as total_ventes,
        COALESCE(SUM(montant_verse), 0) as total_recouvre,
        COALESCE(SUM(reste_a_payer), 0) as reste_a_recouvrer
      FROM ventes
      WHERE chantier_id = ?
    `).get(chantierId);

    const ventesParStatut = db.prepare(`
      SELECT statut, COUNT(*) as count, COALESCE(SUM(prix_total), 0) as montant
      FROM ventes
      WHERE chantier_id = ?
      GROUP BY statut
      ORDER BY montant DESC
    `).all(chantierId);

    const tauxRecouvrement = ventesStats.total_ventes
      ? Math.round((ventesStats.total_recouvre / ventesStats.total_ventes) * 100)
      : 0;

    // --- Personnel ---
    const personnelStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN type_contrat = 'PERMANENT_MENSUEL' THEN 1 ELSE 0 END) as permanents,
        SUM(CASE WHEN type_contrat = 'JOURNALIER_TACHERON' THEN 1 ELSE 0 END) as journaliers
      FROM employees
      WHERE chantier_actuel_id = ? AND statut = 'ACTIF'
    `).get(chantierId);

    const masseSalarialeMois = db.prepare(`
      SELECT COALESCE(SUM(net_a_payer), 0) as masse_salariale
      FROM paies
      WHERE chantier_id = ? AND mois_annee = (SELECT MAX(mois_annee) FROM paies WHERE chantier_id = ?)
    `).get(chantierId, chantierId);

    const personnelListe = db.prepare(`
      SELECT e.id, e.matricule, e.nom, e.prenom, e.poste, e.type_contrat, e.telephone
      FROM employees e
      WHERE e.chantier_actuel_id = ? AND e.statut = 'ACTIF'
      ORDER BY e.nom, e.prenom
    `).all(chantierId);

    // --- Matériel ---
    const materielStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN type_propriete = 'INTERNE' THEN 1 ELSE 0 END) as internes,
        SUM(CASE WHEN type_propriete = 'LOCATION' THEN 1 ELSE 0 END) as loues,
        SUM(CASE WHEN statut IN ('EN_PANNE', 'EN_MAINTENANCE') THEN 1 ELSE 0 END) as en_panne
      FROM materiel
      WHERE chantier_actuel_id = ?
    `).get(chantierId);

    const coutLocationMois = db.prepare(`
      SELECT COALESCE(SUM(cout_location_mois), 0) as cout_total
      FROM materiel
      WHERE chantier_actuel_id = ? AND type_propriete = 'LOCATION'
    `).get(chantierId);

    const materielListe = db.prepare(`
      SELECT id, code_parc, nom, categorie, type_propriete, statut, immatriculation_serie
      FROM materiel
      WHERE chantier_actuel_id = ?
      ORDER BY nom
    `).all(chantierId);

    // --- Stocks ---
    const stocksArticles = db.prepare(`
      SELECT 
        a.id, a.code_article, a.designation, a.unite, a.stock_min_alerte,
        COALESCE(n.quantite, 0) as quantite
      FROM stocks_niveaux n
      JOIN stocks_articles a ON n.article_id = a.id
      WHERE n.chantier_id = ?
      ORDER BY a.designation
    `).all(chantierId);

    const stocksAlertes = stocksArticles.filter(
      s => s.quantite <= (s.stock_min_alerte || 0)
    );

    // --- Derniers mouvements de caisse ---
    const recentMouvements = db.prepare(`
      SELECT 
        m.*, 
        c.name as caisse_name,
        b.name as beneficiaire_name,
        f.name as fournisseur_name
      FROM caisse_mouvements m
      JOIN caisses c ON m.caisse_id = c.id
      LEFT JOIN beneficiaires b ON m.beneficiaire_id = b.id
      LEFT JOIN fournisseurs f ON m.fournisseur_id = f.id
      WHERE m.chantier_id = ?
      ORDER BY m.date DESC, m.id DESC
      LIMIT 10
    `).all(chantierId);

    // --- Budget consommation ---
    const budgetTotal = chantier.budget_total || 0;
    const depensesCumulees = depensesStats.total_depenses || 0;
    const pourcentageBudget = budgetTotal > 0
      ? Math.round((depensesCumulees / budgetTotal) * 100)
      : 0;

    res.json({
      chantier,
      tresorerie: {
        total: tresorerieTotal,
        caissesDetail,
        alertesCount
      },
      depenses: {
        total: depensesStats.total_depenses,
        paye: depensesStats.total_paye,
        resteAPayer: depensesStats.reste_a_payer,
        parCategorie: depensesParCategorie,
        evolution: depensesEvolution
      },
      ventes: {
        totalContrats: ventesStats.total_contrats,
        totalVentes: ventesStats.total_ventes,
        totalRecouvre: ventesStats.total_recouvre,
        resteARecouvrer: ventesStats.reste_a_recouvrer,
        tauxRecouvrement,
        parStatut: ventesParStatut
      },
      personnel: {
        total: personnelStats.total || 0,
        permanents: personnelStats.permanents || 0,
        journaliers: personnelStats.journaliers || 0,
        masseSalarialeMois: masseSalarialeMois.masse_salariale || 0,
        liste: personnelListe
      },
      materiel: {
        total: materielStats.total || 0,
        internes: materielStats.internes || 0,
        loues: materielStats.loues || 0,
        enPanne: materielStats.en_panne || 0,
        coutLocationMois: coutLocationMois.cout_total || 0,
        liste: materielListe
      },
      stocks: {
        articles: stocksArticles,
        alertes: stocksAlertes
      },
      recentMouvements,
      budgetConsommation: {
        budget: budgetTotal,
        depensesCumulees,
        pourcentage: pourcentageBudget
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des stats du chantier:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
