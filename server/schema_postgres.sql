-- ==============================================================================
-- BATIPROMO DZ - Schéma de Base de Données PostgreSQL
-- Promotion Immobilière & Gestion Multi-Chantiers (Normes Algériennes DZD)
-- ==============================================================================

-- 1. Utilisateurs & Collaborateurs
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'CONDUCTEUR',
  phone VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIF',
  role_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Chantiers & Projets de Construction
CREATE TABLE IF NOT EXISTS chantiers (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  wilaya VARCHAR(100) NOT NULL,
  commune VARCHAR(100) NOT NULL,
  address TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'EN_COURS',
  start_date DATE NOT NULL,
  end_date_planned DATE NOT NULL,
  budget_total NUMERIC(15, 2) NOT NULL DEFAULT 0,
  progress_percentage INTEGER NOT NULL DEFAULT 0,
  surface_totale_m2 NUMERIC(10, 2),
  nombre_unites INTEGER,
  chef_chantier_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Caisses & Comptes Trésorerie
CREATE TABLE IF NOT EXISTS caisses (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  chantier_id INTEGER REFERENCES chantiers(id) ON DELETE SET NULL,
  bank_name VARCHAR(100),
  rib VARCHAR(100),
  balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  seuil_alerte NUMERIC(15, 2) NOT NULL DEFAULT 50000,
  responsable_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Bénéficiaires (Tâcherons, Artisans, Salariés)
CREATE TABLE IF NOT EXISTS beneficiaires (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  phone VARCHAR(50),
  nif_cin VARCHAR(100),
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Fournisseurs de Matériaux & Prestataires
CREATE TABLE IF NOT EXISTS fournisseurs (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  specialite VARCHAR(100) NOT NULL,
  wilaya VARCHAR(100) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  nif VARCHAR(50),
  nis VARCHAR(50),
  rc VARCHAR(50),
  rib VARCHAR(100),
  solde_du NUMERIC(15, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Mouvements de Caisse & Décaissements
CREATE TABLE IF NOT EXISTS caisse_mouvements (
  id SERIAL PRIMARY KEY,
  reference VARCHAR(50) UNIQUE NOT NULL,
  caisse_id INTEGER NOT NULL REFERENCES caisses(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL,
  source_caisse_id INTEGER REFERENCES caisses(id) ON DELETE SET NULL,
  target_caisse_id INTEGER REFERENCES caisses(id) ON DELETE SET NULL,
  montant NUMERIC(15, 2) NOT NULL,
  date DATE NOT NULL,
  mode_paiement VARCHAR(30) NOT NULL DEFAULT 'ESPECES',
  piece_justificative VARCHAR(255),
  document_url TEXT,
  motif TEXT NOT NULL,
  categorie VARCHAR(50) NOT NULL,
  chantier_id INTEGER REFERENCES chantiers(id) ON DELETE SET NULL,
  beneficiaire_id INTEGER REFERENCES beneficiaires(id) ON DELETE SET NULL,
  fournisseur_id INTEGER REFERENCES fournisseurs(id) ON DELETE SET NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'VALIDE',
  validation_date TIMESTAMPTZ,
  validated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  is_sensible BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Dépenses & Factures
CREATE TABLE IF NOT EXISTS depenses (
  id SERIAL PRIMARY KEY,
  reference VARCHAR(50) UNIQUE NOT NULL,
  chantier_id INTEGER NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
  fournisseur_id INTEGER REFERENCES fournisseurs(id) ON DELETE SET NULL,
  beneficiaire_id INTEGER REFERENCES beneficiaires(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  categorie VARCHAR(50) NOT NULL,
  montant_total NUMERIC(15, 2) NOT NULL,
  montant_paye NUMERIC(15, 2) NOT NULL DEFAULT 0,
  mode_reglement VARCHAR(30) NOT NULL DEFAULT 'ESPECES',
  caisse_id INTEGER REFERENCES caisses(id) ON DELETE SET NULL,
  statut_paiement VARCHAR(30) NOT NULL DEFAULT 'NON_PAYE',
  date_echeance DATE,
  description TEXT NOT NULL,
  facture_numero VARCHAR(100),
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. Clients & Acquéreurs
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  nom VARCHAR(150) NOT NULL,
  prenom VARCHAR(150) NOT NULL,
  nin VARCHAR(50),
  telephone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  adresse TEXT,
  wilaya VARCHAR(100),
  profession VARCHAR(150),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. Ventes Immobilières & Lots
CREATE TABLE IF NOT EXISTS ventes (
  id SERIAL PRIMARY KEY,
  reference_contrat VARCHAR(50) UNIQUE NOT NULL,
  chantier_id INTEGER NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  lot_designation VARCHAR(255) NOT NULL,
  surface_m2 NUMERIC(10, 2) NOT NULL,
  prix_total NUMERIC(15, 2) NOT NULL,
  montant_verse NUMERIC(15, 2) NOT NULL DEFAULT 0,
  reste_a_payer NUMERIC(15, 2) NOT NULL,
  date_vente DATE NOT NULL,
  statut VARCHAR(50) NOT NULL DEFAULT 'RESERVE',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 10. Règlements Clients (Encaissements)
CREATE TABLE IF NOT EXISTS client_reglements (
  id SERIAL PRIMARY KEY,
  vente_id INTEGER NOT NULL REFERENCES ventes(id) ON DELETE CASCADE,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  caisse_id INTEGER REFERENCES caisses(id) ON DELETE SET NULL,
  reference_recu VARCHAR(50) UNIQUE NOT NULL,
  montant NUMERIC(15, 2) NOT NULL,
  date_reglement DATE NOT NULL,
  mode_paiement VARCHAR(30) NOT NULL DEFAULT 'VIREMENT',
  banque VARCHAR(100),
  numero_piece VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 11. Personnel & Ouvriers
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  matricule VARCHAR(50) UNIQUE NOT NULL,
  nom VARCHAR(150) NOT NULL,
  prenom VARCHAR(150) NOT NULL,
  poste VARCHAR(150) NOT NULL,
  type_contrat VARCHAR(50) NOT NULL DEFAULT 'PERMANENT_MENSUEL',
  salaire_base NUMERIC(15, 2) NOT NULL DEFAULT 0,
  taux_journalier NUMERIC(15, 2) NOT NULL DEFAULT 0,
  telephone VARCHAR(50),
  cin_nin VARCHAR(50),
  numero_cnas VARCHAR(50),
  chantier_actuel_id INTEGER REFERENCES chantiers(id) ON DELETE SET NULL,
  date_embauche DATE NOT NULL,
  statut VARCHAR(30) NOT NULL DEFAULT 'ACTIF',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 12. Affectations du Personnel
CREATE TABLE IF NOT EXISTS employee_affectations (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  chantier_id INTEGER NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
  role_sur_chantier VARCHAR(150),
  date_debut DATE NOT NULL,
  date_fin DATE,
  statut VARCHAR(30) NOT NULL DEFAULT 'EN_COURS',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 13. Pointages Quotidiens
CREATE TABLE IF NOT EXISTS employee_pointages (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  chantier_id INTEGER NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  statut VARCHAR(30) NOT NULL DEFAULT 'PRESENT',
  heures_normales NUMERIC(5, 2) NOT NULL DEFAULT 8,
  heures_sup NUMERIC(5, 2) NOT NULL DEFAULT 0,
  montant_du_jour NUMERIC(15, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id, date)
);

-- 14. Paies & Fiches de Salaire
CREATE TABLE IF NOT EXISTS paies (
  id SERIAL PRIMARY KEY,
  reference VARCHAR(50) UNIQUE NOT NULL,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  chantier_id INTEGER REFERENCES chantiers(id) ON DELETE SET NULL,
  mois_annee VARCHAR(10) NOT NULL,
  jours_travailles NUMERIC(5, 2) NOT NULL DEFAULT 0,
  salaire_base NUMERIC(15, 2) NOT NULL DEFAULT 0,
  montant_heures_sup NUMERIC(15, 2) NOT NULL DEFAULT 0,
  primes_chantier NUMERIC(15, 2) NOT NULL DEFAULT 0,
  avances_deduites NUMERIC(15, 2) NOT NULL DEFAULT 0,
  retenues NUMERIC(15, 2) NOT NULL DEFAULT 0,
  net_a_payer NUMERIC(15, 2) NOT NULL DEFAULT 0,
  statut VARCHAR(30) NOT NULL DEFAULT 'GENERE',
  date_paiement DATE,
  caisse_id INTEGER REFERENCES caisses(id) ON DELETE SET NULL,
  mode_paiement VARCHAR(30) NOT NULL DEFAULT 'ESPECES',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 15. Matériel & Engins
CREATE TABLE IF NOT EXISTS materiel (
  id SERIAL PRIMARY KEY,
  code_parc VARCHAR(50) UNIQUE NOT NULL,
  nom VARCHAR(255) NOT NULL,
  categorie VARCHAR(50) NOT NULL,
  type_propriete VARCHAR(30) NOT NULL,
  loueur_fournisseur_id INTEGER REFERENCES fournisseurs(id) ON DELETE SET NULL,
  cout_location_jour NUMERIC(15, 2) DEFAULT 0,
  cout_location_mois NUMERIC(15, 2) DEFAULT 0,
  valeur_acquisition NUMERIC(15, 2) DEFAULT 0,
  date_debut_location DATE,
  date_fin_location_prevue DATE,
  statut VARCHAR(30) NOT NULL DEFAULT 'DISPONIBLE',
  chantier_actuel_id INTEGER REFERENCES chantiers(id) ON DELETE SET NULL,
  compteur_heures_km NUMERIC(10, 2) DEFAULT 0,
  prochaine_maintenance DATE,
  immatriculation_serie VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 16. Affectations Matériel
CREATE TABLE IF NOT EXISTS materiel_affectations (
  id SERIAL PRIMARY KEY,
  materiel_id INTEGER NOT NULL REFERENCES materiel(id) ON DELETE CASCADE,
  chantier_id INTEGER NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
  date_debut DATE NOT NULL,
  date_fin_prevue DATE,
  date_fin_reelle DATE,
  operateur_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  cout_impute NUMERIC(15, 2) DEFAULT 0,
  statut VARCHAR(30) NOT NULL DEFAULT 'ACTIF',
  compteur_depart NUMERIC(10, 2) DEFAULT 0,
  compteur_retour NUMERIC(10, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 17. Consommations Carburant & Maintenance
CREATE TABLE IF NOT EXISTS materiel_consommations (
  id SERIAL PRIMARY KEY,
  materiel_id INTEGER NOT NULL REFERENCES materiel(id) ON DELETE CASCADE,
  chantier_id INTEGER NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'CARBURANT_GASOIL',
  quantite_litres NUMERIC(10, 2) DEFAULT 0,
  montant_total NUMERIC(15, 2) NOT NULL,
  compteur_heures_km NUMERIC(10, 2) DEFAULT 0,
  fournisseur_id INTEGER REFERENCES fournisseurs(id) ON DELETE SET NULL,
  caisse_mouvement_id INTEGER REFERENCES caisse_mouvements(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 18. Catalogue Articles Stocks
CREATE TABLE IF NOT EXISTS stocks_articles (
  id SERIAL PRIMARY KEY,
  code_article VARCHAR(50) UNIQUE NOT NULL,
  designation VARCHAR(255) NOT NULL,
  categorie VARCHAR(50) NOT NULL,
  unite VARCHAR(50) NOT NULL,
  prix_unitaire_moyen NUMERIC(15, 2) NOT NULL DEFAULT 0,
  stock_min_alerte NUMERIC(10, 2) NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 19. Niveaux de Stock par Chantier
CREATE TABLE IF NOT EXISTS stocks_niveaux (
  id SERIAL PRIMARY KEY,
  article_id INTEGER NOT NULL REFERENCES stocks_articles(id) ON DELETE CASCADE,
  chantier_id INTEGER REFERENCES chantiers(id) ON DELETE CASCADE,
  is_depot_central BOOLEAN NOT NULL DEFAULT FALSE,
  quantite NUMERIC(10, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(article_id, chantier_id, is_depot_central)
);

-- 20. Mouvements de Stock
CREATE TABLE IF NOT EXISTS stocks_mouvements (
  id SERIAL PRIMARY KEY,
  reference_bon VARCHAR(50) UNIQUE NOT NULL,
  article_id INTEGER NOT NULL REFERENCES stocks_articles(id) ON DELETE CASCADE,
  type_mouvement VARCHAR(50) NOT NULL,
  quantite NUMERIC(10, 2) NOT NULL,
  prix_unitaire NUMERIC(15, 2) NOT NULL DEFAULT 0,
  montant_total NUMERIC(15, 2) NOT NULL DEFAULT 0,
  chantier_source_id INTEGER REFERENCES chantiers(id) ON DELETE SET NULL,
  chantier_destination_id INTEGER REFERENCES chantiers(id) ON DELETE SET NULL,
  fournisseur_id INTEGER REFERENCES fournisseurs(id) ON DELETE SET NULL,
  numero_bl VARCHAR(100),
  date_mouvement DATE NOT NULL,
  responsable_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  motif TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 21. Documents & GED
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  titre VARCHAR(255) NOT NULL,
  type_document VARCHAR(50) NOT NULL,
  chantier_id INTEGER REFERENCES chantiers(id) ON DELETE SET NULL,
  fournisseur_id INTEGER REFERENCES fournisseurs(id) ON DELETE SET NULL,
  client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  materiel_id INTEGER REFERENCES materiel(id) ON DELETE SET NULL,
  file_path TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT DEFAULT 0,
  mime_type VARCHAR(100),
  date_document DATE NOT NULL,
  uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 22. Journal d'Audit & Sécurité
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  user_name VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  module VARCHAR(100) NOT NULL,
  details TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 23. Rôles et Permissions
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_key VARCHAR(100) NOT NULL,
  PRIMARY KEY(role_id, permission_key)
);

-- 24. Périmètre Utilisateur par Chantier
CREATE TABLE IF NOT EXISTS user_chantiers (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chantier_id INTEGER NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
  PRIMARY KEY(user_id, chantier_id)
);

-- 25. Notifications Système & Alertes
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  titre VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  montant NUMERIC(15, 2),
  lien TEXT,
  reference VARCHAR(50),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 26. Paramétrage Entreprise Promoteur Immobilier
CREATE TABLE IF NOT EXISTS company_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  company_name VARCHAR(255) NOT NULL DEFAULT 'BATIPROMO DZ',
  sigle VARCHAR(50) DEFAULT 'BATIPROMO',
  forme_juridique VARCHAR(50) DEFAULT 'SARL',
  capital_social NUMERIC(15, 2) DEFAULT 50000000,
  agrement_promoteur VARCHAR(100) DEFAULT 'AGR-MIN-HABITAT-2021-0487',
  date_agrement DATE DEFAULT '2021-03-15',
  registre_commerce VARCHAR(100) DEFAULT '16/00-0987654B21',
  nif VARCHAR(50) DEFAULT '002116010987654',
  nis VARCHAR(50) DEFAULT '098765432101234',
  article_imposition VARCHAR(50) DEFAULT '16010987654',
  adresse_siege TEXT DEFAULT '14, Boulevard du 11 Décembre 1960, Val d''Hydra',
  commune VARCHAR(100) DEFAULT 'Hydra',
  wilaya VARCHAR(100) DEFAULT 'Alger',
  code_postal VARCHAR(20) DEFAULT '16035',
  telephone_1 VARCHAR(50) DEFAULT '+213 (0) 23 45 67 89',
  telephone_2 VARCHAR(50) DEFAULT '+213 (0) 550 12 34 56',
  fax VARCHAR(50) DEFAULT '+213 (0) 23 45 67 90',
  email_contact VARCHAR(255) DEFAULT 'contact@batipromo.dz',
  email_direction VARCHAR(255) DEFAULT 'direction@batipromo.dz',
  site_web VARCHAR(255) DEFAULT 'https://www.batipromo.dz',
  rib_principal VARCHAR(100) DEFAULT '001 00234 0300012345 67',
  banque_principale VARCHAR(255) DEFAULT 'Banque Nationale d''Algérie (BNA) - Agence Didouche Mourad Alger',
  logo_url TEXT DEFAULT '',
  cachet_url TEXT DEFAULT '',
  devise_nom VARCHAR(50) DEFAULT 'Dinar Algérien',
  devise_code VARCHAR(10) DEFAULT 'DZD',
  devise_symbole VARCHAR(10) DEFAULT 'DA',
  seuil_validation_caisse NUMERIC(15, 2) DEFAULT 100000,
  exiger_validation_toutes_sorties BOOLEAN DEFAULT TRUE,
  seuil_alerte_caisse_defaut NUMERIC(15, 2) DEFAULT 150000,
  taux_cnas_salarie NUMERIC(5, 2) DEFAULT 9.0,
  taux_cnas_patronal NUMERIC(5, 2) DEFAULT 26.0,
  heures_jour_travail NUMERIC(5, 2) DEFAULT 8.0,
  jours_ouvrables_mois INTEGER DEFAULT 22,
  mention_legale_documents TEXT DEFAULT 'Document comptable officiel BATIPROMO DZ - Généré par le Système Intégré de Gestion de Promotion Immobilière',
  pied_de_page_documents TEXT DEFAULT 'BATIPROMO DZ SARL au Capital de 50 000 000 DA - Agrément Promoteur Immobilier N° AGR-MIN-HABITAT-2021-0487 - Val d''Hydra, Alger',
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 27. Planning & Jalons des Chantiers
CREATE TABLE IF NOT EXISTS chantier_planning (
  id SERIAL PRIMARY KEY,
  chantier_id INTEGER NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
  phase_nom VARCHAR(255) NOT NULL,
  ordre INTEGER NOT NULL DEFAULT 1,
  date_debut_prevue DATE NOT NULL,
  date_fin_prevue DATE NOT NULL,
  date_debut_reelle DATE,
  date_fin_reelle DATE,
  progress_pct INTEGER NOT NULL DEFAULT 0,
  statut VARCHAR(50) NOT NULL DEFAULT 'A_VENIR',
  responsable VARCHAR(150),
  budget_alloue NUMERIC(15, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Index pour accélérer les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_caisse_mouvements_caisse ON caisse_mouvements(caisse_id);
CREATE INDEX IF NOT EXISTS idx_caisse_mouvements_date ON caisse_mouvements(date);
CREATE INDEX IF NOT EXISTS idx_depenses_chantier ON depenses(chantier_id);
CREATE INDEX IF NOT EXISTS idx_ventes_chantier ON ventes(chantier_id);
CREATE INDEX IF NOT EXISTS idx_stocks_niveaux_article ON stocks_niveaux(article_id, chantier_id);
CREATE INDEX IF NOT EXISTS idx_employee_pointages ON employee_pointages(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_planning_chantier ON chantier_planning(chantier_id);
