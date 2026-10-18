const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

// Ensure db directory
const dbPath = path.resolve(__dirname, '..', 'batipromo.db');
const db = new DatabaseSync(dbPath);

// Enable foreign keys and WAL mode if applicable
db.exec('PRAGMA foreign_keys = ON;');

function initDatabase() {
  db.exec(`
    -- 1. Users
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'CONDUCTEUR', -- 'ADMIN', 'CONDUCTEUR', 'CAISSIER', 'COMPTABLE', 'RH', 'MAGASINIER'
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Chantiers
    CREATE TABLE IF NOT EXISTS chantiers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL, -- 'Promotionnel Haut Standing', 'Logements Promotionnels Libres (LPL)', 'Semi-Collectif', 'Centre Commercial & Bureaux'
      wilaya TEXT NOT NULL,
      commune TEXT NOT NULL,
      address TEXT,
      status TEXT NOT NULL DEFAULT 'EN_COURS', -- 'ETUDE', 'GROS_OEUVRES', 'SECOND_OEUVRE', 'FINITIONS', 'LIVRE', 'EN_PAUSE'
      start_date DATE NOT NULL,
      end_date_planned DATE NOT NULL,
      budget_total REAL NOT NULL DEFAULT 0, -- DA
      progress_percentage INTEGER NOT NULL DEFAULT 0,
      surface_totale_m2 REAL,
      nombre_unites INTEGER,
      chef_chantier_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 3. Caisses de Fond de Roulement & Trésorerie
    CREATE TABLE IF NOT EXISTS caisses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL, -- 'FOND_ROULEMENT_CHANTIER', 'CAISSE_CENTRALE', 'COMPTE_BANCAIRE'
      chantier_id INTEGER REFERENCES chantiers(id) ON DELETE SET NULL,
      bank_name TEXT, -- 'BNA', 'BEA', 'CPA', 'BADR', 'BDL', etc.
      rib TEXT,
      balance REAL NOT NULL DEFAULT 0, -- DA
      seuil_alerte REAL NOT NULL DEFAULT 50000, -- DA seuil bas
      responsable_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 4. Bénéficiaires
    CREATE TABLE IF NOT EXISTS beneficiaires (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL, -- 'PARTICULIER', 'ARTISAN_TACHERON', 'PRESTATAIRE', 'FOURNISSEUR', 'EMPLOYE', 'AUTRE'
      phone TEXT,
      nif_cin TEXT,
      address TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 5. Fournisseurs
    CREATE TABLE IF NOT EXISTS fournisseurs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      specialite TEXT NOT NULL,
      wilaya TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      nif TEXT,
      nis TEXT,
      rc TEXT,
      rib TEXT,
      solde_du REAL NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 6. Mouvements de Caisse (Entrées, Sorties, Alimentations)
    CREATE TABLE IF NOT EXISTS caisse_mouvements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference TEXT UNIQUE NOT NULL,
      caisse_id INTEGER NOT NULL REFERENCES caisses(id) ON DELETE CASCADE,
      type TEXT NOT NULL, -- 'ENTREE', 'SORTIE', 'TRANSFERT', 'ALIMENTATION'
      source_caisse_id INTEGER REFERENCES caisses(id) ON DELETE SET NULL,
      target_caisse_id INTEGER REFERENCES caisses(id) ON DELETE SET NULL,
      montant REAL NOT NULL, -- DA
      date DATE NOT NULL,
      mode_paiement TEXT NOT NULL DEFAULT 'ESPECES', -- 'ESPECES', 'CHEQUE', 'VIREMENT', 'TRAITE'
      piece_justificative TEXT,
      document_url TEXT,
      motif TEXT NOT NULL,
      categorie TEXT NOT NULL, -- 'APPROVISIONNEMENT', 'ACHAT_MATERIAUX', 'MAIN_DOEUVRE', 'AVANCE_SALAIRE', 'LOCATION_MATERIEL', 'CARBURANT', 'SOUS_TRAITANCE', 'FRAIS_GENERAUX', 'REGLEMENT_CLIENT', 'AUTRE'
      chantier_id INTEGER REFERENCES chantiers(id) ON DELETE SET NULL,
      beneficiaire_id INTEGER REFERENCES beneficiaires(id) ON DELETE SET NULL,
      fournisseur_id INTEGER REFERENCES fournisseurs(id) ON DELETE SET NULL,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'VALIDE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 7. Dépenses & Factures
    CREATE TABLE IF NOT EXISTS depenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference TEXT UNIQUE NOT NULL,
      chantier_id INTEGER NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
      fournisseur_id INTEGER REFERENCES fournisseurs(id) ON DELETE SET NULL,
      beneficiaire_id INTEGER REFERENCES beneficiaires(id) ON DELETE SET NULL,
      date DATE NOT NULL,
      categorie TEXT NOT NULL, -- 'GROS_OEUVRE', 'SECOND_OEUVRE', 'MATERIEL_LOCATION', 'CARBURANT', 'MAIN_DOEUVRE', 'SOUS_TRAITANCE', 'TRANSPORT', 'ADMINISTRATIF', 'DIVERS'
      montant_total REAL NOT NULL,
      montant_paye REAL NOT NULL DEFAULT 0,
      mode_reglement TEXT NOT NULL DEFAULT 'ESPECES',
      caisse_id INTEGER REFERENCES caisses(id) ON DELETE SET NULL,
      statut_paiement TEXT NOT NULL DEFAULT 'NON_PAYE', -- 'PAYE', 'PARTIEL', 'NON_PAYE'
      date_echeance DATE,
      description TEXT NOT NULL,
      facture_numero TEXT,
      document_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 8. Clients & Acquéreurs
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      nin TEXT,
      telephone TEXT NOT NULL,
      email TEXT,
      adresse TEXT,
      wilaya TEXT,
      profession TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 9. Ventes Immobilières & Lots
    CREATE TABLE IF NOT EXISTS ventes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference_contrat TEXT UNIQUE NOT NULL,
      chantier_id INTEGER NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
      client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      lot_designation TEXT NOT NULL, -- Ex: 'Appartement F4 - Bloc B - 3ème étage - N°12'
      surface_m2 REAL NOT NULL,
      prix_total REAL NOT NULL, -- DA
      montant_verse REAL NOT NULL DEFAULT 0,
      reste_a_payer REAL NOT NULL,
      date_vente DATE NOT NULL,
      statut TEXT NOT NULL DEFAULT 'RESERVE', -- 'RESERVE', 'SOUS_COMPROMIS', 'ACTE_NOTARIE', 'LIVRE'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 10. Règlements Clients (Encaissements)
    CREATE TABLE IF NOT EXISTS client_reglements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vente_id INTEGER NOT NULL REFERENCES ventes(id) ON DELETE CASCADE,
      client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      caisse_id INTEGER REFERENCES caisses(id) ON DELETE SET NULL,
      reference_recu TEXT UNIQUE NOT NULL,
      montant REAL NOT NULL,
      date_reglement DATE NOT NULL,
      mode_paiement TEXT NOT NULL DEFAULT 'VIREMENT', -- 'ESPECES', 'CHEQUE', 'VIREMENT'
      banque TEXT,
      numero_piece TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 11. Personnel & Ouvriers
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      matricule TEXT UNIQUE NOT NULL,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      poste TEXT NOT NULL, -- 'Chef de chantier', 'Conducteur de travaux', 'Maçon qualifié', 'Ferrailleur', 'Coffreur', 'Grutier', 'Électricien bâtiment', 'Plombier', 'Manœuvre / Journalier', 'Magasinier'
      type_contrat TEXT NOT NULL DEFAULT 'PERMANENT_MENSUEL', -- 'PERMANENT_MENSUEL', 'JOURNALIER_TACHERON', 'PRESTATAIRE'
      salaire_base REAL NOT NULL DEFAULT 0, -- DA (mensuel ou base journalière)
      taux_journalier REAL NOT NULL DEFAULT 0, -- DA/jour
      telephone TEXT,
      cin_nin TEXT,
      numero_cnas TEXT,
      chantier_actuel_id INTEGER REFERENCES chantiers(id) ON DELETE SET NULL,
      date_embauche DATE NOT NULL,
      statut TEXT NOT NULL DEFAULT 'ACTIF', -- 'ACTIF', 'EN_CONGE', 'SORTI'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 12. Affectations Personnel aux Chantiers
    CREATE TABLE IF NOT EXISTS employee_affectations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      chantier_id INTEGER NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
      role_sur_chantier TEXT,
      date_debut DATE NOT NULL,
      date_fin DATE,
      statut TEXT NOT NULL DEFAULT 'EN_COURS', -- 'EN_COURS', 'TERMINE'
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 13. Pointages Quotidiens
    CREATE TABLE IF NOT EXISTS employee_pointages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      chantier_id INTEGER NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      statut TEXT NOT NULL DEFAULT 'PRESENT', -- 'PRESENT', 'ABSENT', 'DEMI_JOURNEE', 'CONGE', 'MALADIE'
      heures_normales REAL NOT NULL DEFAULT 8,
      heures_sup REAL NOT NULL DEFAULT 0,
      montant_du_jour REAL NOT NULL DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(employee_id, date)
    );

    -- 14. Paies & Fiches de Salaire
    CREATE TABLE IF NOT EXISTS paies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference TEXT UNIQUE NOT NULL,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      chantier_id INTEGER REFERENCES chantiers(id) ON DELETE SET NULL,
      mois_annee TEXT NOT NULL, -- '2026-10'
      jours_travailles REAL NOT NULL DEFAULT 0,
      salaire_base REAL NOT NULL DEFAULT 0,
      montant_heures_sup REAL NOT NULL DEFAULT 0,
      primes_chantier REAL NOT NULL DEFAULT 0,
      avances_deduites REAL NOT NULL DEFAULT 0,
      retenues REAL NOT NULL DEFAULT 0,
      net_a_payer REAL NOT NULL DEFAULT 0,
      statut TEXT NOT NULL DEFAULT 'GENERE', -- 'GENERE', 'PAYE'
      date_paiement DATE,
      caisse_id INTEGER REFERENCES caisses(id) ON DELETE SET NULL,
      mode_paiement TEXT NOT NULL DEFAULT 'ESPECES',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 15. Matériel & Engins (Interne & Location)
    CREATE TABLE IF NOT EXISTS materiel (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code_parc TEXT UNIQUE NOT NULL,
      nom TEXT NOT NULL,
      categorie TEXT NOT NULL, -- 'ENGIN_LOURD', 'ENGIN_TERRASSEMENT', 'VEHICULE_TRANSPORT', 'PETIT_MATERIEL', 'ECHAFAUDAGE'
      type_propriete TEXT NOT NULL, -- 'INTERNE', 'LOCATION'
      loueur_fournisseur_id INTEGER REFERENCES fournisseurs(id) ON DELETE SET NULL,
      cout_location_jour REAL DEFAULT 0, -- DA/jour
      cout_location_mois REAL DEFAULT 0, -- DA/mois
      valeur_acquisition REAL DEFAULT 0, -- DA
      date_debut_location DATE,
      date_fin_location_prevue DATE,
      statut TEXT NOT NULL DEFAULT 'DISPONIBLE', -- 'DISPONIBLE', 'AFFECTE_CHANTIER', 'EN_MAINTENANCE', 'EN_PANNE', 'RESTITUE'
      chantier_actuel_id INTEGER REFERENCES chantiers(id) ON DELETE SET NULL,
      compteur_heures_km REAL DEFAULT 0,
      prochaine_maintenance DATE,
      immatriculation_serie TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 16. Affectations Matériel aux Chantiers
    CREATE TABLE IF NOT EXISTS materiel_affectations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      materiel_id INTEGER NOT NULL REFERENCES materiel(id) ON DELETE CASCADE,
      chantier_id INTEGER NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
      date_debut DATE NOT NULL,
      date_fin_prevue DATE,
      date_fin_reelle DATE,
      operateur_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
      cout_impute REAL DEFAULT 0,
      statut TEXT NOT NULL DEFAULT 'ACTIF', -- 'ACTIF', 'TERMINE'
      compteur_depart REAL DEFAULT 0,
      compteur_retour REAL DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 17. Consommation Carburant & Maintenance Matériel
    CREATE TABLE IF NOT EXISTS materiel_consommations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      materiel_id INTEGER NOT NULL REFERENCES materiel(id) ON DELETE CASCADE,
      chantier_id INTEGER NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      type TEXT NOT NULL DEFAULT 'CARBURANT_GASOIL', -- 'CARBURANT_GASOIL', 'VIDANGE_LUBRIFIANT', 'REPARATION', 'ENTRETIEN'
      quantite_litres REAL DEFAULT 0,
      montant_total REAL NOT NULL, -- DA
      compteur_heures_km REAL DEFAULT 0,
      fournisseur_id INTEGER REFERENCES fournisseurs(id) ON DELETE SET NULL,
      caisse_mouvement_id INTEGER REFERENCES caisse_mouvements(id) ON DELETE SET NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 18. Catalogue Stocks Matériaux
    CREATE TABLE IF NOT EXISTS stocks_articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code_article TEXT UNIQUE NOT NULL,
      designation TEXT NOT NULL,
      categorie TEXT NOT NULL, -- 'GROS_OEUVRE', 'ACIER_FERRAILLAGE', 'AGREGATS', 'REVETEMENT', 'PLATRERIE', 'PLOMBERIE', 'ELECTRICITE'
      unite TEXT NOT NULL, -- 'Sac 50kg', 'Tonne', 'm³', 'm²', 'Unité', 'Barre 12m', 'Palette'
      prix_unitaire_moyen REAL NOT NULL DEFAULT 0, -- DA
      stock_min_alerte REAL NOT NULL DEFAULT 10,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 19. Niveaux de Stock par Chantier et Dépôt Central
    CREATE TABLE IF NOT EXISTS stocks_niveaux (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER NOT NULL REFERENCES stocks_articles(id) ON DELETE CASCADE,
      chantier_id INTEGER REFERENCES chantiers(id) ON DELETE CASCADE,
      is_depot_central INTEGER NOT NULL DEFAULT 0, -- 1 if depot central
      quantite REAL NOT NULL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(article_id, chantier_id, is_depot_central)
    );

    -- 20. Mouvements de Stock
    CREATE TABLE IF NOT EXISTS stocks_mouvements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference_bon TEXT UNIQUE NOT NULL,
      article_id INTEGER NOT NULL REFERENCES stocks_articles(id) ON DELETE CASCADE,
      type_mouvement TEXT NOT NULL, -- 'ENTREE_ACHAT', 'SORTIE_CONSOMMATION', 'TRANSFERT', 'INVENTAIRE'
      quantite REAL NOT NULL,
      prix_unitaire REAL NOT NULL DEFAULT 0,
      montant_total REAL NOT NULL DEFAULT 0,
      chantier_source_id INTEGER REFERENCES chantiers(id) ON DELETE SET NULL,
      chantier_destination_id INTEGER REFERENCES chantiers(id) ON DELETE SET NULL,
      fournisseur_id INTEGER REFERENCES fournisseurs(id) ON DELETE SET NULL,
      numero_bl TEXT,
      date_mouvement DATE NOT NULL,
      responsable_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      motif TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 21. Documents & GED
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titre TEXT NOT NULL,
      type_document TEXT NOT NULL, -- 'PERMIS_CONSTRUIRE', 'PLAN_ARCHI', 'CONTRAT', 'FACTURE', 'BON_LIVRAISON', 'ASSURANCE', 'RECETTE_CAISSE', 'BULLETIN_PAIE', 'AUTRE'
      chantier_id INTEGER REFERENCES chantiers(id) ON DELETE SET NULL,
      fournisseur_id INTEGER REFERENCES fournisseurs(id) ON DELETE SET NULL,
      client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
      employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
      materiel_id INTEGER REFERENCES materiel(id) ON DELETE SET NULL,
      file_path TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_size INTEGER DEFAULT 0,
      mime_type TEXT,
      date_document DATE NOT NULL,
      uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 22. Journal d'Audit & Sécurité
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      user_name TEXT,
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 23. Rôles et Permissions Personnalisables
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      is_system INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      permission_key TEXT NOT NULL,
      PRIMARY KEY(role_id, permission_key)
    );

    -- 24. Restriction de Périmètre Utilisateur par Chantier
    CREATE TABLE IF NOT EXISTS user_chantiers (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      chantier_id INTEGER NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
      PRIMARY KEY(user_id, chantier_id)
    );

    -- 25. Notifications Système & Alertes Caisse / Versements
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL, -- 'VERSEMENT_BENEFICIAIRE', 'VERSEMENT_CLIENT', 'VALIDATION_CAISSE_REQUISE', 'OPERATION_VALIDEE', 'OPERATION_REJETEE', 'ALERTE_SEUIL'
      titre TEXT NOT NULL,
      message TEXT NOT NULL,
      montant REAL,
      lien TEXT,
      reference TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 26. Paramétrage Centralisé de l'Entreprise / Promoteur Immobilier
    CREATE TABLE IF NOT EXISTS company_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      company_name TEXT NOT NULL DEFAULT 'BATIPROMO DZ',
      sigle TEXT DEFAULT 'BATIPROMO',
      forme_juridique TEXT DEFAULT 'SARL',
      capital_social REAL DEFAULT 50000000,
      agrement_promoteur TEXT DEFAULT 'AGR-MIN-HABITAT-2021-0487',
      date_agrement DATE DEFAULT '2021-03-15',
      registre_commerce TEXT DEFAULT '16/00-0987654B21',
      nif TEXT DEFAULT '002116010987654',
      nis TEXT DEFAULT '098765432101234',
      article_imposition TEXT DEFAULT '16010987654',
      adresse_siege TEXT DEFAULT '14, Boulevard du 11 Décembre 1960, Val d''Hydra',
      commune TEXT DEFAULT 'Hydra',
      wilaya TEXT DEFAULT 'Alger',
      code_postal TEXT DEFAULT '16035',
      telephone_1 TEXT DEFAULT '+213 (0) 23 45 67 89',
      telephone_2 TEXT DEFAULT '+213 (0) 550 12 34 56',
      fax TEXT DEFAULT '+213 (0) 23 45 67 90',
      email_contact TEXT DEFAULT 'contact@batipromo.dz',
      email_direction TEXT DEFAULT 'direction@batipromo.dz',
      site_web TEXT DEFAULT 'https://www.batipromo.dz',
      rib_principal TEXT DEFAULT '001 00234 0300012345 67',
      banque_principale TEXT DEFAULT 'Banque Nationale d''Algérie (BNA) - Agence Didouche Mourad Alger',
      logo_url TEXT DEFAULT '',
      cachet_url TEXT DEFAULT '',
      devise_nom TEXT DEFAULT 'Dinar Algérien',
      devise_code TEXT DEFAULT 'DZD',
      devise_symbole TEXT DEFAULT 'DA',
      seuil_validation_caisse REAL DEFAULT 100000,
      exiger_validation_toutes_sorties INTEGER DEFAULT 1,
      seuil_alerte_caisse_defaut REAL DEFAULT 150000,
      taux_cnas_salarie REAL DEFAULT 9.0,
      taux_cnas_patronal REAL DEFAULT 26.0,
      heures_jour_travail REAL DEFAULT 8.0,
      jours_ouvrables_mois INTEGER DEFAULT 22,
      mention_legale_documents TEXT DEFAULT 'Document comptable officiel BATIPROMO DZ - Généré par le Système Intégré de Gestion de Promotion Immobilière',
      pied_de_page_documents TEXT DEFAULT 'BATIPROMO DZ SARL au Capital de 50 000 000 DA - Agrément Promoteur Immobilier N° AGR-MIN-HABITAT-2021-0487 - Val d''Hydra, Alger',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 27. Planning & Jalons des Chantiers
    CREATE TABLE IF NOT EXISTS chantier_planning (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chantier_id INTEGER NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
      phase_nom TEXT NOT NULL,
      ordre INTEGER NOT NULL DEFAULT 1,
      date_debut_prevue DATE NOT NULL,
      date_fin_prevue DATE NOT NULL,
      date_debut_reelle DATE,
      date_fin_reelle DATE,
      progress_pct INTEGER NOT NULL DEFAULT 0,
      statut TEXT NOT NULL DEFAULT 'A_VENIR',
      responsable TEXT,
      budget_alloue REAL DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Initialize company_settings default row if not exists
  try {
    const existing = db.prepare('SELECT id FROM company_settings WHERE id = 1').get();
    if (!existing) {
      db.prepare(`
        INSERT INTO company_settings (id, company_name)
        VALUES (1, 'BATIPROMO DZ')
      `).run();
    }
  } catch (e) {}

  // Migrate users table with status and role_id if not present
  try {
    db.exec("ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'ACTIF';");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE users ADD COLUMN role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL;");
  } catch (e) {}

  // Migrate caisse_mouvements with validation fields
  try {
    db.exec("ALTER TABLE caisse_mouvements ADD COLUMN validation_date DATETIME;");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE caisse_mouvements ADD COLUMN validated_by INTEGER REFERENCES users(id) ON DELETE SET NULL;");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE caisse_mouvements ADD COLUMN rejection_reason TEXT;");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE caisse_mouvements ADD COLUMN is_sensible INTEGER DEFAULT 0;");
  } catch (e) {}

  // Grant caisses:validate and settings:manage to ADMIN role if exists
  try {
    const adminRole = db.prepare("SELECT id FROM roles WHERE code = 'ADMIN'").get();
    if (adminRole) {
      db.prepare("INSERT OR IGNORE INTO role_permissions (role_id, permission_key) VALUES (?, 'caisses:validate')").run(adminRole.id);
      db.prepare("INSERT OR IGNORE INTO role_permissions (role_id, permission_key) VALUES (?, 'settings:manage')").run(adminRole.id);
    }
  } catch (e) {}
}

const ALL_PERMISSIONS = [
  { key: 'chantiers:read', module: 'Chantiers', label: 'Consulter les chantiers et avancement' },
  { key: 'chantiers:create', module: 'Chantiers', label: 'Créer un nouveau chantier' },
  { key: 'chantiers:edit', module: 'Chantiers', label: 'Modifier les informations du chantier' },
  { key: 'chantiers:delete', module: 'Chantiers', label: 'Supprimer un chantier' },

  { key: 'caisses:read', module: 'Caisses & Trésorerie', label: 'Consulter les caisses et soldes DA' },
  { key: 'caisses:decaissement', module: 'Caisses & Trésorerie', label: 'Émettre des bons de décaissement (Sorties)' },
  { key: 'caisses:validate', module: 'Caisses & Trésorerie', label: 'Valider les décaissements et opérations sensibles de caisse' },
  { key: 'caisses:alimentation', module: 'Caisses & Trésorerie', label: 'Alimenter un fond de roulement (Transfert)' },
  { key: 'caisses:create', module: 'Caisses & Trésorerie', label: 'Créer une caisse ou compte bancaire' },

  { key: 'personnel:read', module: 'Personnel & Paie', label: 'Consulter l\'effectif et ouvriers' },
  { key: 'personnel:create', module: 'Personnel & Paie', label: 'Ajouter/Modifier un salarié ou ouvrier' },
  { key: 'personnel:affecter', module: 'Personnel & Paie', label: 'Affecter des ouvriers aux chantiers' },
  { key: 'personnel:pointage', module: 'Personnel & Paie', label: 'Saisir et valider les pointages quotidiens' },
  { key: 'personnel:paie_generate', module: 'Personnel & Paie', label: 'Générer et calculer les fiches de paie' },
  { key: 'personnel:paie_payer', module: 'Personnel & Paie', label: 'Décaisser et payer les salaires' },

  { key: 'materiel:read', module: 'Matériel & Engins', label: 'Consulter le parc engins (Interne & Loué)' },
  { key: 'materiel:create', module: 'Matériel & Engins', label: 'Ajouter un engin ou contrat de location' },
  { key: 'materiel:affecter', module: 'Matériel & Engins', label: 'Affecter ou libérer un engin sur chantier' },
  { key: 'materiel:carburant', module: 'Matériel & Engins', label: 'Saisir les pleins de gasoil et entretiens' },

  { key: 'stocks:read', module: 'Stocks & Matériaux', label: 'Consulter les stocks et alertes critiques' },
  { key: 'stocks:mouvements', module: 'Stocks & Matériaux', label: 'Enregistrer bons d\'entrée (BL) et sorties' },
  { key: 'stocks:create', module: 'Stocks & Matériaux', label: 'Ajouter des matériaux au catalogue' },

  { key: 'depenses:read', module: 'Dépenses & Tiers', label: 'Consulter dépenses, factures et tiers' },
  { key: 'depenses:create', module: 'Dépenses & Tiers', label: 'Enregistrer des dépenses et factures' },
  { key: 'depenses:regler', module: 'Dépenses & Tiers', label: 'Régler les soldes dus aux fournisseurs' },

  { key: 'clients:read', module: 'Clients & Ventes', label: 'Consulter acquéreurs et contrats de vente' },
  { key: 'clients:create', module: 'Clients & Ventes', label: 'Créer réservations et contrats de lots' },
  { key: 'clients:encaissement', module: 'Clients & Ventes', label: 'Encaisser les versements clients' },

  { key: 'documents:read', module: 'GED & Documents', label: 'Consulter et télécharger les documents' },
  { key: 'documents:upload', module: 'GED & Documents', label: 'Ajouter des permis, plans et PV' },
  { key: 'documents:delete', module: 'GED & Documents', label: 'Supprimer des documents' },

  { key: 'planning:read', module: 'Planning', label: 'Consulter le planning et jalons' },
  { key: 'planning:manage', module: 'Planning', label: 'Créer et mettre à jour les phases du planning' },
  { key: 'reports:read', module: 'Rapports', label: 'Consulter et imprimer les rapports financiers et bilans' },

  { key: 'users:manage', module: 'Administration', label: 'Gérer les utilisateurs et mots de passe' },
  { key: 'roles:manage', module: 'Administration', label: 'Gérer les rôles et permissions' },
  { key: 'settings:manage', module: 'Administration', label: 'Gérer les paramètres du promoteur, logo et configuration' },
  { key: 'audit:read', module: 'Administration', label: 'Consulter le journal d\'audit' }
];

module.exports = {
  db,
  initDatabase,
  ALL_PERMISSIONS
};
