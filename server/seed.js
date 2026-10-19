const bcrypt = require('bcryptjs');
const { db, initDatabase } = require('./db');

function seedDatabase() {
  initDatabase();

  // Check if users already exist
  const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (existingUsers && Number(existingUsers.count) > 0) {
    console.log('Database already seeded.');
    return;
  }

  console.log('Seeding database with professional Algerian real estate data...');

  const passwordHash = bcrypt.hashSync('promo2026', 10);

  // 1. Users
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, phone)
    VALUES (?, ?, ?, ?, ?)
  `);

  const uAdmin = insertUser.run('M. Karim Brahimi (Directeur Général)', 'admin@batipromo.dz', passwordHash, 'ADMIN', '0550 12 34 56').lastInsertRowid;
  const uConducteur = insertUser.run('Ing. Amine Dahmani (Conducteur Travaux)', 'conducteur@batipromo.dz', passwordHash, 'CONDUCTEUR', '0661 78 90 12').lastInsertRowid;
  const uCaisse = insertUser.run('Mme. Samia Benali (Trésorerie & Caisses)', 'caisse@batipromo.dz', passwordHash, 'CAISSIER', '0770 45 67 89').lastInsertRowid;
  const uComptable = insertUser.run('M. Yacine Mebarki (Chef Comptable)', 'comptable@batipromo.dz', passwordHash, 'COMPTABLE', '0555 98 76 54').lastInsertRowid;
  const uRH = insertUser.run('Mme. Leila Cherif (Responsable RH & Paie)', 'rh@batipromo.dz', passwordHash, 'RH', '0660 33 22 11').lastInsertRowid;
  const uMagasin = insertUser.run('M. Omar Bouzid (Gestionnaire Stocks & Matériel)', 'magasin@batipromo.dz', passwordHash, 'MAGASINIER', '0772 11 44 77').lastInsertRowid;

  // 2. Chantiers
  const insertChantier = db.prepare(`
    INSERT INTO chantiers (code, name, type, wilaya, commune, address, status, start_date, end_date_planned, budget_total, progress_percentage, surface_totale_m2, nombre_unites, chef_chantier_id, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const c1 = insertChantier.run(
    'CHT-01-ALG',
    'Résidence Les Jasmins - Alger',
    'Promotionnel Haut Standing',
    'Alger',
    'Hydra',
    'Boulevard Sidi Yahia, Lot 14',
    'GROS_OEUVRES',
    '2025-03-01',
    '2027-06-30',
    850000000, // 850 Millions DA
    62,
    6400,
    48,
    uConducteur,
    'Immeuble R+9 avec 2 sous-sols, appartements F4/F5 de luxe et penthouses avec vue dégagée.'
  ).lastInsertRowid;

  const c2 = insertChantier.run(
    'CHT-02-ORN',
    'Tour El Bahia - Oran',
    'Centre Commercial & Résidence Prestige',
    'Oran',
    'Front de Mer',
    'Boulevard de l\'ALN',
    'SECOND_OEUVRE',
    '2024-09-15',
    '2027-02-28',
    1450000000, // 1.45 Milliards DA
    45,
    11200,
    72,
    uConducteur,
    'Tour R+16 de très haut standing face à la mer, galerie commerciale, bureaux et 72 appartements.'
  ).lastInsertRowid;

  const c3 = insertChantier.run(
    'CHT-03-CST',
    'Les Terrasses du Mansourah - Constantine',
    'Logements Promotionnels Libres (LPL)',
    'Constantine',
    'Mansourah',
    'Zone Universitaire Ouest',
    'FINITIONS',
    '2024-01-10',
    '2026-12-15',
    520000000, // 520 Millions DA
    88,
    4800,
    36,
    uConducteur,
    'Ensemble résidentiel clos et sécurisé de 36 logements F3/F4 avec espaces verts et parkings souterrains.'
  ).lastInsertRowid;

  const c4 = insertChantier.run(
    'CHT-04-ANN',
    'Résidence Bella Vista - Annaba',
    'Semi-Collectif',
    'Annaba',
    'Seraïdi',
    'Route Panoramique de Seraïdi',
    'GROS_OEUVRES',
    '2025-06-01',
    '2027-10-30',
    430000000, // 430 Millions DA
    25,
    3900,
    24,
    uConducteur,
    'Résidence privée de villas mitoyennes et duplexes vue mer panoramique.'
  ).lastInsertRowid;

  // 3. Caisses de Fond de Roulement & Banques
  const insertCaisse = db.prepare(`
    INSERT INTO caisses (code, name, type, chantier_id, bank_name, rib, balance, seuil_alerte, responsable_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const caisseSiege = insertCaisse.run('CAISSE-SIEGE', 'Caisse Centrale Siège Alger', 'CAISSE_CENTRALE', null, null, null, 5450000, 500000, uCaisse, 'ACTIVE').lastInsertRowid;
  const caisseHydra = insertCaisse.run('FDR-CHT-01', 'Fond de Roulement - Chantier Hydra', 'FOND_ROULEMENT_CHANTIER', c1, null, null, 780000, 150000, uConducteur, 'ACTIVE').lastInsertRowid;
  const caisseOran = insertCaisse.run('FDR-CHT-02', 'Fond de Roulement - Chantier Oran', 'FOND_ROULEMENT_CHANTIER', c2, null, null, 1120000, 200000, uConducteur, 'ACTIVE').lastInsertRowid;
  const caisseCst = insertCaisse.run('FDR-CHT-03', 'Fond de Roulement - Chantier Constantine', 'FOND_ROULEMENT_CHANTIER', c3, null, null, 85000, 150000, uConducteur, 'ACTIVE').lastInsertRowid; // Seuil bas déclenché!
  const caisseAnnaba = insertCaisse.run('FDR-CHT-04', 'Fond de Roulement - Chantier Annaba', 'FOND_ROULEMENT_CHANTIER', c4, null, null, 420000, 120000, uConducteur, 'ACTIVE').lastInsertRowid;

  const bnaBank = insertCaisse.run('BNK-BNA-01', 'Compte Courant BNA - Agence Didouche Alger', 'COMPTE_BANCAIRE', null, 'BNA Algérie', '001 00234 0300012345 67', 42800000, 1000000, uCaisse, 'ACTIVE').lastInsertRowid;
  const cpaBank = insertCaisse.run('BNK-CPA-02', 'Compte Projet CPA - Agence Oran Gambetta', 'COMPTE_BANCAIRE', null, 'CPA Algérie', '004 00456 0800045678 90', 28500000, 1000000, uCaisse, 'ACTIVE').lastInsertRowid;

  // 4. Bénéficiaires
  const insertBenef = db.prepare(`
    INSERT INTO beneficiaires (name, type, phone, nif_cin, address, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const b1 = insertBenef.run('M. Abdelkader Bouzid', 'ARTISAN_TACHERON', '0551 22 33 44', '19811601002345', 'Kouba, Alger', 'Équipe ferraillage et coffrage dallettes').lastInsertRowid;
  const b2 = insertBenef.run('M. Farid Rahmouni', 'ARTISAN_TACHERON', '0662 99 88 77', '19783102008765', 'Es Senia, Oran', 'Tâcheron maçonnerie et enduits ciment').lastInsertRowid;
  const b3 = insertBenef.run('Bureau d\'Études BTP Architectes Associés', 'PRESTATAIRE', '021 69 45 20', '001216010987654', 'Dely Ibrahim, Alger', 'Suivi de conformité CTC et plans d\'exécution').lastInsertRowid;
  const b4 = insertBenef.run('M. Mourad Belkacem', 'PARTICULIER', '0770 14 25 36', '19852501004321', 'Constantine', 'Chauffeur citerne eau et approvisionnement').lastInsertRowid;

  // 5. Fournisseurs
  const insertFournisseur = db.prepare(`
    INSERT INTO fournisseurs (code, name, specialite, wilaya, phone, email, nif, nis, rc, rib, solde_du)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const f1 = insertFournisseur.run('FRN-BETON-01', 'SARL Béton Express Centre', 'Béton prêt à l\'emploi & Pompage', 'Alger', '023 45 67 89', 'contact@betonexpress-dz.com', '001616019028374', '00161601902', '16/00-12874B16', '00100345000123456789', 2450000).lastInsertRowid;
  const f2 = insertFournisseur.run('FRN-ACIER-02', 'EURL Hadjar Sidérurgie & Aciers', 'Fers à béton et Treillis soudés', 'Sétif', '036 84 12 30', 'commercial@hadjar-acier.dz', '001919017654321', '00191901765', '19/00-09823A19', '00400567000876543210', 5800000).lastInsertRowid;
  const f3 = insertFournisseur.run('FRN-ENGIN-03', 'ETS Amellal & Frères Location Engins', 'Location Grues, Pelles & Nacelles', 'Alger', '0550 44 88 12', 'amellal.engins@gmail.com', '000816023456789', '00081602345', '16/00-00452B08', '00200112000456123789', 850000).lastInsertRowid;
  const f4 = insertFournisseur.run('FRN-CERAM-04', 'Comptoir Algérien de Céramique & Sanitaire', 'Carrelage, Faïence et Robinetterie', 'Oran', '041 33 55 77', 'ventes@comptoir-ceramique.dz', '003131018765432', '00313101876', '31/00-04561B31', '00300890000123789456', 1200000).lastInsertRowid;
  const f5 = insertFournisseur.run('FRN-PETROL-05', 'Station Service Naftal Chéraga', 'Carburant Gasoil & Lubrifiants', 'Alger', '021 36 25 14', 'naftal.cheraga@naftal.dz', '000016001234567', '00001600123', '16/00-99881A16', '00100999000555444333', 180000).lastInsertRowid;

  // 6. Mouvements de Caisse (Entrées, Sorties, Règlements)
  const insertMouvement = db.prepare(`
    INSERT INTO caisse_mouvements (reference, caisse_id, type, source_caisse_id, target_caisse_id, montant, date, mode_paiement, piece_justificative, motif, categorie, chantier_id, beneficiaire_id, fournisseur_id, created_by, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Alimentations de fond de roulement
  insertMouvement.run('ALIM-2026-001', caisseHydra, 'ALIMENTATION', bnaBank, caisseHydra, 1500000, '2026-10-01', 'VIREMENT', 'VIR-BNA-8892', 'Approvisionnement mensuel Caisse Fond de Roulement Hydra', 'APPROVISIONNEMENT', c1, null, null, uCaisse, 'VALIDE');
  insertMouvement.run('ALIM-2026-002', caisseOran, 'ALIMENTATION', cpaBank, caisseOran, 2000000, '2026-10-02', 'VIREMENT', 'VIR-CPA-4412', 'Approvisionnement Caisse Fond de Roulement Tour El Bahia', 'APPROVISIONNEMENT', c2, null, null, uCaisse, 'VALIDE');

  // Sorties d'argent / Bons de caisse
  insertMouvement.run('BC-2026-0101', caisseHydra, 'SORTIE', null, null, 185000, '2026-10-05', 'ESPECES', 'BC-N-101', 'Paiement main d\'œuvre journalière ferraillage (4 jours)', 'MAIN_DOEUVRE', c1, b1, null, uConducteur, 'VALIDE');
  insertMouvement.run('BC-2026-0102', caisseHydra, 'SORTIE', null, null, 68000, '2026-10-08', 'ESPECES', 'Facture Naftal N°441', 'Plein gasoil 1200L groupe électrogène et grue chantier Hydra', 'CARBURANT', c1, null, f5, uConducteur, 'VALIDE');
  insertMouvement.run('BC-2026-0103', caisseHydra, 'SORTIE', null, null, 45000, '2026-10-10', 'ESPECES', 'Reçu Quincaillerie', 'Achat petit outillage, disques meuleuse, pointes et fil recuit', 'ACHAT_MATERIAUX', c1, null, null, uConducteur, 'VALIDE');
  insertMouvement.run('BC-2026-0104', caisseHydra, 'SORTIE', null, null, 50000, '2026-10-12', 'ESPECES', 'Reçu Avance N°12', 'Avance sur salaire quinzaine M. Meziane (Grutier)', 'AVANCE_SALAIRE', c1, null, null, uConducteur, 'VALIDE');

  insertMouvement.run('BC-2026-0201', caisseOran, 'SORTIE', null, null, 240000, '2026-10-06', 'ESPECES', 'Bon décaissement 201', 'Paiement tâche coffrage cages d\'ascenseur R+10', 'MAIN_DOEUVRE', c2, b2, null, uConducteur, 'VALIDE');
  insertMouvement.run('BC-2026-0202', caisseOran, 'SORTIE', null, null, 120000, '2026-10-09', 'ESPECES', 'BL-Transp-88', 'Transport par fardier éléments échafaudages lourds', 'SOUS_TRAITANCE', c2, null, f3, uConducteur, 'VALIDE');

  // 7. Dépenses globales des chantiers
  const insertDepense = db.prepare(`
    INSERT INTO depenses (reference, chantier_id, fournisseur_id, beneficiaire_id, date, categorie, montant_total, montant_paye, mode_reglement, caisse_id, statut_paiement, date_echeance, description, facture_numero)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertDepense.run('DEP-2026-001', c1, f1, null, '2026-10-03', 'GROS_OEUVRE', 3800000, 3800000, 'CHEQUE', bnaBank, 'PAYE', '2026-10-10', 'Coulage dalle R+6 (120 m³ Béton B25 auto-plaçant avec pompe 42m)', 'FACT-BET-2026-89');
  insertDepense.run('DEP-2026-002', c1, f2, null, '2026-10-07', 'GROS_OEUVRE', 6500000, 4000000, 'TRAITE', bnaBank, 'PARTIEL', '2026-11-15', 'Livraison 45 Tonnes Rond à béton FeE500 Diam 12, 14, 16mm pour poteaux et poutres', 'FACT-HADJ-1029');
  insertDepense.run('DEP-2026-003', c1, f3, null, '2026-10-02', 'MATERIEL_LOCATION', 900000, 900000, 'VIREMENT', bnaBank, 'PAYE', '2026-10-05', 'Location mensuelle Groupe Électrogène 160 kVA avec maintenance préventive', 'FACT-AMEL-302');
  insertDepense.run('DEP-2026-004', c2, f1, null, '2026-10-04', 'GROS_OEUVRE', 5200000, 3000000, 'CHEQUE', cpaBank, 'PARTIEL', '2026-10-25', 'Béton haute performance B35 pour voiles périphériques et radier R+11', 'FACT-BET-2026-94');
  insertDepense.run('DEP-2026-005', c3, f4, null, '2026-10-08', 'SECOND_OEUVRE', 2400000, 2400000, 'VIREMENT', bnaBank, 'PAYE', '2026-10-12', 'Fourniture grès cérame 60x60 premier choix et colle ciment pour 12 appartements', 'FACT-CER-778');

  // 8. Clients & Acquéreurs
  const insertClient = db.prepare(`
    INSERT INTO clients (code, nom, prenom, nin, telephone, email, adresse, wilaya, profession)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const cl1 = insertClient.run('CLI-2025-01', 'Dr. Mansouri', 'Redha', '109823410098', '0550 88 77 66', 'r.mansouri@clinique-elazhar.dz', 'Val d\'Hydra, Alger', 'Alger', 'Médecin Spécialiste').lastInsertRowid;
  const cl2 = insertClient.run('CLI-2025-02', 'M. Benkhelifa', 'Mustapha', '198731002345', '0661 22 55 88', 'm.benkhelifa@groupe-import.com', 'Canastel, Oran', 'Oran', 'Gérant de Société Import-Export').lastInsertRowid;
  const cl3 = insertClient.run('CLI-2025-03', 'Mme. Saoudi', 'Nassima', '199025004561', '0770 99 11 33', 'nassima.saoudi@gmail.com', 'Cité Zouaghi, Constantine', 'Constantine', 'Professeur Universitaire').lastInsertRowid;
  const cl4 = insertClient.run('CLI-2026-04', 'M. Tebboune', 'Farouk', '198316007890', '0555 44 33 22', 'farouk.tebboune@yahoo.fr', 'El Biar, Alger', 'Alger', 'Notaire Associé').lastInsertRowid;

  // 9. Ventes Immobilières
  const insertVente = db.prepare(`
    INSERT INTO ventes (reference_contrat, chantier_id, client_id, lot_designation, surface_m2, prix_total, montant_verse, reste_a_payer, date_vente, statut)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const v1 = insertVente.run('CONTRAT-HYD-A31', c1, cl1, 'Appartement F4 Standing - Bloc A - 3ème étage - N°12 (Vue Parc)', 142.5, 34200000, 20520000, 13680000, '2025-04-10', 'SOUS_COMPROMIS').lastInsertRowid;
  const v2 = insertVente.run('CONTRAT-ORN-B14', c2, cl2, 'Duplex Vue Panoramique Mer - R+15 & R+16 - Tour El Bahia', 240.0, 68000000, 40800000, 27200000, '2024-11-20', 'ACTE_NOTARIE').lastInsertRowid;
  const v3 = insertVente.run('CONTRAT-CST-C08', c3, cl3, 'Appartement F3 avec terrasse - Bloc C - 2ème étage', 98.0, 15680000, 14112000, 1568000, '2024-03-15', 'ACTE_NOTARIE').lastInsertRowid;
  const v4 = insertVente.run('CONTRAT-HYD-PH02', c1, cl4, 'Penthouse F5 Terrasse privative 80m² - Bloc B - Dernier étage', 215.0, 53750000, 16125000, 37625000, '2025-08-01', 'RESERVE').lastInsertRowid;

  // 10. Règlements Clients
  const insertReglementClient = db.prepare(`
    INSERT INTO client_reglements (vente_id, client_id, caisse_id, reference_recu, montant, date_reglement, mode_paiement, banque, numero_piece, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertReglementClient.run(v1, cl1, bnaBank, 'REC-CL-2026-045', 6840000, '2026-09-15', 'VIREMENT', 'BNA', 'VIR-BNA-9921', 'Tranche N°3 : Fin achèvement gros œuvre R+6');
  insertReglementClient.run(v2, cl2, cpaBank, 'REC-CL-2026-078', 13600000, '2026-08-20', 'CHEQUE', 'CPA', 'CHQ-CPA-004921', 'Tranche N°2 : Pose menuiserie extérieure et façade mur rideau');

  // 11. Personnel & Ouvriers
  const insertEmployee = db.prepare(`
    INSERT INTO employees (matricule, nom, prenom, poste, type_contrat, salaire_base, taux_journalier, telephone, cin_nin, numero_cnas, chantier_actuel_id, date_embauche, statut)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const e1 = insertEmployee.run('EMP-001', 'Brahimi', 'Kaddour', 'Chef de Chantier Principal', 'PERMANENT_MENSUEL', 135000, 0, '0550 91 82 73', '197516001234', '16-1975-0012-90', c1, '2023-01-15', 'ACTIF').lastInsertRowid;
  const e2 = insertEmployee.run('EMP-002', 'Meziane', 'Rabah', 'Grutier Certifié Potain', 'PERMANENT_MENSUEL', 95000, 0, '0661 14 25 36', '198216008765', '16-1982-0456-12', c1, '2023-06-01', 'ACTIF').lastInsertRowid;
  const e3 = insertEmployee.run('EMP-003', 'Haddad', 'Noureddine', 'Conducteur d\'Engins Lourds (CAT/Komatsu)', 'PERMANENT_MENSUEL', 85000, 0, '0770 33 66 99', '198031004321', '31-1980-0089-45', c2, '2024-02-01', 'ACTIF').lastInsertRowid;
  const e4 = insertEmployee.run('EMP-004', 'Benmansour', 'Youcef', 'Chef d\'Équipe Ferraillage', 'JOURNALIER_TACHERON', 0, 4200, '0555 12 34 89', '198616009876', '16-1986-0789-23', c1, '2024-03-10', 'ACTIF').lastInsertRowid;
  const e5 = insertEmployee.run('EMP-005', 'Dridi', 'Kamel', 'Maçon Finisseur & Carrelage', 'JOURNALIER_TACHERON', 0, 3800, '0663 88 77 44', '198825001122', '25-1988-0034-78', c3, '2024-05-15', 'ACTIF').lastInsertRowid;
  const e6 = insertEmployee.run('EMP-006', 'Messaoudi', 'Djamel', 'Électricien Bâtiment Industriel', 'PERMANENT_MENSUEL', 78000, 0, '0771 55 44 33', '198531005566', '31-1985-0123-67', c2, '2024-08-01', 'ACTIF').lastInsertRowid;
  const e7 = insertEmployee.run('EMP-007', 'Zitouni', 'Sofiane', 'Plombier Sanitaire & Chauffage', 'JOURNALIER_TACHERON', 0, 3600, '0554 99 22 11', '199216006677', '16-1992-0456-89', c1, '2025-01-10', 'ACTIF').lastInsertRowid;
  const e8 = insertEmployee.run('EMP-008', 'Ghezzal', 'Mounir', 'Manœuvre Polyvalent', 'JOURNALIER_TACHERON', 0, 2400, '0665 44 11 22', '199616007788', '16-1996-0890-12', c1, '2025-02-01', 'ACTIF').lastInsertRowid;
  const e9 = insertEmployee.run('EMP-009', 'Lounis', 'Billel', 'Manœuvre Polyvalent', 'JOURNALIER_TACHERON', 0, 2400, '0773 22 88 55', '199731008899', '31-1997-0112-34', c2, '2025-03-01', 'ACTIF').lastInsertRowid;
  const e10 = insertEmployee.run('EMP-010', 'Touati', 'Hocine', 'Magasinier Chantier & Réceptionnaire', 'PERMANENT_MENSUEL', 65000, 0, '0552 66 77 88', '198316003344', '16-1983-0567-90', c1, '2024-01-05', 'ACTIF').lastInsertRowid;

  // 12. Affectations Personnel aux Chantiers
  const insertAffectationEmp = db.prepare(`
    INSERT INTO employee_affectations (employee_id, chantier_id, role_sur_chantier, date_debut, date_fin, statut, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertAffectationEmp.run(e1, c1, 'Chef de chantier général', '2025-03-01', null, 'EN_COURS', 'Supervision complète gros œuvre et sous-traitants');
  insertAffectationEmp.run(e2, c1, 'Opérateur grue à tour Potain', '2025-03-15', null, 'EN_COURS', 'Approvisionnement benne à béton et armatures en hauteur');
  insertAffectationEmp.run(e3, c2, 'Opérateur Rétrochargeuse & Engins terrassement', '2024-09-15', null, 'EN_COURS', 'Terrassement, remblaiement et manutention lourde');
  insertAffectationEmp.run(e4, c1, 'Chef d\'équipe Ferraillage', '2025-04-01', null, 'EN_COURS', 'Montage cages d\'armatures poteaux et dalles');
  insertAffectationEmp.run(e5, c3, 'Pose carrelage et revêtements muraux', '2024-05-15', null, 'EN_COURS', 'Finitions logements Témoins et hall');
  insertAffectationEmp.run(e6, c2, 'Câblage colonnes montantes et TGBT', '2025-01-10', null, 'EN_COURS', 'Installation électrique moyenne et basse tension');
  insertAffectationEmp.run(e7, c1, 'Réseau évacuation et alimentation PER', '2025-02-01', null, 'EN_COURS', 'Gaine technique et tuyauterie sous dalle');
  insertAffectationEmp.run(e8, c1, 'Aide ferraillage et manutention ciment', '2025-03-01', null, 'EN_COURS', 'Manœuvre de soutien');
  insertAffectationEmp.run(e9, c2, 'Déblaiement gravats et nettoyage dalles', '2025-03-01', null, 'EN_COURS', 'Nettoyage et sécurité');
  insertAffectationEmp.run(e10, c1, 'Responsable dépôt chantier Hydra', '2025-03-01', null, 'EN_COURS', 'Réception matériaux et bons de sortie');

  // 13. Pointages (Échantillon récent)
  const insertPointage = db.prepare(`
    INSERT INTO employee_pointages (employee_id, chantier_id, date, statut, heures_normales, heures_sup, montant_du_jour, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const datesPointage = ['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16'];
  for (const dt of datesPointage) {
    insertPointage.run(e1, c1, dt, 'PRESENT', 8, 2, 0, 'Journée complète + 2h réunion coordination');
    insertPointage.run(e2, c1, dt, 'PRESENT', 8, 1, 0, 'Opérationnel sur grue');
    insertPointage.run(e4, c1, dt, 'PRESENT', 8, 0, 4200, 'Ferraillage radier R+6');
    insertPointage.run(e7, c1, dt, 'PRESENT', 8, 0, 3600, 'Pose tuyaux PER');
    insertPointage.run(e8, c1, dt, 'PRESENT', 8, 1, 2700, 'Manœuvre + 1h déchargement');
    insertPointage.run(e3, c2, dt, 'PRESENT', 8, 0, 0, 'Conduite rétrochargeuse');
    insertPointage.run(e6, c2, dt, 'PRESENT', 8, 0, 0, 'Passage gaines');
    insertPointage.run(e9, c2, dt, 'PRESENT', 8, 0, 2400, 'Déblaiement');
  }

  // 14. Paies du mois écoulé (Septembre 2026)
  const insertPaie = db.prepare(`
    INSERT INTO paies (reference, employee_id, chantier_id, mois_annee, jours_travailles, salaire_base, montant_heures_sup, primes_chantier, avances_deduites, retenues, net_a_payer, statut, date_paiement, caisse_id, mode_paiement)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertPaie.run('PAIE-2026-09-001', e1, c1, '2026-09', 24, 135000, 22000, 15000, 20000, 12150, 139850, 'PAYE', '2026-10-02', bnaBank, 'VIREMENT');
  insertPaie.run('PAIE-2026-09-002', e2, c1, '2026-09', 24, 95000, 14000, 10000, 15000, 8550, 95450, 'PAYE', '2026-10-02', bnaBank, 'VIREMENT');
  insertPaie.run('PAIE-2026-09-004', e4, c1, '2026-09', 22, 92400, 0, 5000, 25000, 0, 72400, 'PAYE', '2026-10-03', caisseHydra, 'ESPECES');
  insertPaie.run('PAIE-2026-09-008', e8, c1, '2026-09', 23, 55200, 3600, 3000, 10000, 0, 51800, 'PAYE', '2026-10-03', caisseHydra, 'ESPECES');

  // 15. Matériel & Engins (Interne et Location)
  const insertMateriel = db.prepare(`
    INSERT INTO materiel (code_parc, nom, categorie, type_propriete, loueur_fournisseur_id, cout_location_jour, cout_location_mois, valeur_acquisition, date_debut_location, date_fin_location_prevue, statut, chantier_actuel_id, compteur_heures_km, prochaine_maintenance, immatriculation_serie, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const m1 = insertMateriel.run('MAT-001-INT', 'Grue à Tour Potain MC85B (Flèche 50m)', 'ENGIN_LOURD', 'INTERNE', null, 0, 0, 28000000, null, null, 'AFFECTE_CHANTIER', c1, 4120, '2026-11-15', 'POT-85B-2019-DZ', 'Propriété promoteur. Révision semestrielle effectuée en Août 2026.').lastInsertRowid;
  const m2 = insertMateriel.run('MAT-002-INT', 'Rétrochargeuse CAT 428F 4x4 avec Godet & BRH', 'ENGIN_TERRASSEMENT', 'INTERNE', null, 0, 0, 14500000, null, null, 'AFFECTE_CHANTIER', c2, 3480, '2026-10-30', '00341-119-16', 'Propriété promoteur. Équipée d\'un marteau brise-roche pour fondations.').lastInsertRowid;
  const m3 = insertMateriel.run('MAT-003-INT', 'Camion Benne Renault Kerax 440 DXi 6x4 (16 m³)', 'VEHICULE_TRANSPORT', 'INTERNE', null, 0, 0, 18200000, null, null, 'DISPONIBLE', null, 89450, '2026-11-01', '08945-116-16', 'Basé au dépôt central Chéraga, disponible pour évacuation gravats et navettes.').lastInsertRowid;
  const m4 = insertMateriel.run('MAT-004-LOC', 'Groupe Électrogène Cummins Insonorisé 160 kVA', 'PETIT_MATERIEL', 'LOCATION', f3, 12000, 300000, 0, '2026-06-01', '2027-01-31', 'AFFECTE_CHANTIER', c1, 1850, '2026-11-05', 'LOC-CUM-160-DZ', 'Contrat de location avec ETS Amellal. Maintenance et pièces à la charge du loueur.').lastInsertRowid;
  const m5 = insertMateriel.run('MAT-005-LOC', 'Pompe à Béton Automotrice Putzmeister 36m', 'ENGIN_LOURD', 'LOCATION', f3, 45000, 0, 0, '2026-10-01', '2026-10-31', 'AFFECTE_CHANTIER', c2, 620, '2026-10-25', 'LOC-PUTZ-36M', 'Louée pour les coulages verticaux des voiles R+11 à R+14.').lastInsertRowid;
  const m6 = insertMateriel.run('MAT-006-INT', 'Lot Échafaudage Métallique Multidirectionnel 1200 m²', 'ECHAFAUDAGE', 'INTERNE', null, 0, 0, 9600000, null, null, 'AFFECTE_CHANTIER', c3, 0, '2027-01-15', 'ECHAF-MULTI-1200', 'En place sur les façades des Terrasses du Mansourah pour enduits et peinture.').lastInsertRowid;
  const m7 = insertMateriel.run('MAT-007-INT', 'Bétonnière Tractable 500L Moteur Lombardini Diesel', 'PETIT_MATERIEL', 'INTERNE', null, 0, 0, 850000, null, null, 'AFFECTE_CHANTIER', c4, 940, '2026-11-20', 'BET-500L-04', 'Pour petits gâchages mortier et finitions à Annaba Seraïdi.').lastInsertRowid;

  // 16. Affectations Matériel aux Chantiers
  const insertAffectationMat = db.prepare(`
    INSERT INTO materiel_affectations (materiel_id, chantier_id, date_debut, date_fin_prevue, operateur_id, cout_impute, statut, compteur_depart, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAffectationMat.run(m1, c1, '2025-03-15', '2027-01-15', e2, 0, 'ACTIF', 2800, 'Grue affectée pour toute la durée du gros œuvre et pose préfabriqués');
  insertAffectationMat.run(m2, c2, '2024-10-01', '2026-12-30', e3, 0, 'ACTIF', 1850, 'Rétrochargeuse en charge du déblai/remblai tour El Bahia');
  insertAffectationMat.run(m4, c1, '2026-06-01', '2027-01-31', null, 300000, 'ACTIF', 450, 'Alimentation de secours grue et centrale à mortier');
  insertAffectationMat.run(m5, c2, '2026-10-01', '2026-10-31', null, 45000, 'ACTIF', 580, 'Coulage voiles et planchers de grande hauteur');
  insertAffectationMat.run(m6, c3, '2025-08-01', '2026-11-30', null, 0, 'ACTIF', 0, 'Échafaudage pour ravalement de façade et peinture');
  insertAffectationMat.run(m7, c4, '2025-06-15', '2027-06-30', null, 0, 'ACTIF', 310, 'Affectée aux villas Bella Vista');

  // 17. Consommation Carburant & Maintenance
  const insertConso = db.prepare(`
    INSERT INTO materiel_consommations (materiel_id, chantier_id, date, type, quantite_litres, montant_total, compteur_heures_km, fournisseur_id, caisse_mouvement_id, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertConso.run(m4, c1, '2026-10-08', 'CARBURANT_GASOIL', 800, 23200, 1820, f5, null, 'Alimentation cuve groupe électrogène chantier Hydra (Gasoil 29 DA/L)');
  insertConso.run(m2, c2, '2026-10-05', 'CARBURANT_GASOIL', 350, 10150, 3450, f5, null, 'Plein réservoir rétrochargeuse Oran');
  insertConso.run(m2, c2, '2026-10-10', 'VIDANGE_LUBRIFIANT', 25, 28000, 3480, f5, null, 'Vidange moteur 250h + filtre à huile et filtre gasoil');

  // 18. Stocks Articles
  const insertArticle = db.prepare(`
    INSERT INTO stocks_articles (code_article, designation, categorie, unite, prix_unitaire_moyen, stock_min_alerte)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const a1 = insertArticle.run('ART-CIM-425', 'Ciment Portland Composé CPJ-CEM II/A 42.5 (Sac 50kg)', 'GROS_OEUVRE', 'Sac 50kg', 650, 200).lastInsertRowid;
  const a2 = insertArticle.run('ART-FER-12', 'Rond à béton Haute Adhérence FeE500 Diamètre 12mm', 'ACIER_FERRAILLAGE', 'Tonne', 115000, 5).lastInsertRowid;
  const a3 = insertArticle.run('ART-FER-14', 'Rond à béton Haute Adhérence FeE500 Diamètre 14mm', 'ACIER_FERRAILLAGE', 'Tonne', 115000, 5).lastInsertRowid;
  const a4 = insertArticle.run('ART-BRQ-08', 'Brique Creuse Terre Cuite 8 Trous (10x20x20 cm)', 'GROS_OEUVRE', 'Unité', 38, 1500).lastInsertRowid;
  const a5 = insertArticle.run('ART-SBL-04', 'Sable de Carrière Lavé 0/4 pour Maçonnerie & Béton', 'AGREGATS', 'm³', 2800, 30).lastInsertRowid;
  const a6 = insertArticle.run('ART-GRV-15', 'Gravier Concassé 15/25 pour Béton Armé', 'AGREGATS', 'm³', 2400, 30).lastInsertRowid;
  const a7 = insertArticle.run('ART-CER-60', 'Grès Cérame Émaillé Rectifié 60x60 cm Gris Anthracite', 'REVETEMENT', 'm²', 2600, 100).lastInsertRowid;
  const a8 = insertArticle.run('ART-PLA-13', 'Plaque de Plâtre BA13 Standard 2.50 x 1.20 m (Placo)', 'PLATRERIE', 'Unité', 850, 80).lastInsertRowid;

  // 19. Niveaux de Stock (Dépôt central et chantiers)
  const insertNiveau = db.prepare(`
    INSERT INTO stocks_niveaux (article_id, chantier_id, is_depot_central, quantite)
    VALUES (?, ?, ?, ?)
  `);

  // Dépôt central Chéraga
  insertNiveau.run(a1, null, 1, 850);
  insertNiveau.run(a2, null, 1, 24);
  insertNiveau.run(a3, null, 1, 18);
  insertNiveau.run(a4, null, 1, 6200);
  insertNiveau.run(a7, null, 1, 450);

  // Chantier Hydra (c1)
  insertNiveau.run(a1, c1, 0, 120); // Alerte seuil bas ! (< 200)
  insertNiveau.run(a2, c1, 0, 8.5);
  insertNiveau.run(a3, c1, 0, 12.0);
  insertNiveau.run(a4, c1, 0, 2400);
  insertNiveau.run(a5, c1, 0, 45);
  insertNiveau.run(a6, c1, 0, 60);

  // Chantier Oran (c2)
  insertNiveau.run(a1, c2, 0, 340);
  insertNiveau.run(a2, c2, 0, 15.0);
  insertNiveau.run(a4, c2, 0, 4800);
  insertNiveau.run(a5, c2, 0, 75);

  // Chantier Constantine (c3)
  insertNiveau.run(a7, c3, 0, 280);
  insertNiveau.run(a8, c3, 0, 150);

  // 20. Mouvements de Stock
  const insertMvtStock = db.prepare(`
    INSERT INTO stocks_mouvements (reference_bon, article_id, type_mouvement, quantite, prix_unitaire, montant_total, chantier_source_id, chantier_destination_id, fournisseur_id, numero_bl, date_mouvement, responsable_id, motif)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertMvtStock.run('BL-ENT-2026-088', a1, 'ENTREE_ACHAT', 500, 650, 325000, null, c1, f1, 'BL-CIM-9912', '2026-10-04', uMagasin, 'Livraison 500 sacs ciment CPJ 42.5 pour élévation R+6');
  insertMvtStock.run('BS-SRT-2026-145', a1, 'SORTIE_CONSOMMATION', 380, 650, 247000, c1, null, null, null, '2026-10-10', uMagasin, 'Consommation mortier de pose briques et enduit sous-face');
  insertMvtStock.run('BL-ENT-2026-092', a2, 'ENTREE_ACHAT', 10, 115000, 1150000, null, c1, f2, 'BL-HADJ-443', '2026-10-06', uMagasin, 'Réception 10 tonnes rond à béton D12');
  insertMvtStock.run('BT-TRF-2026-012', a4, 'TRANSFERT', 800, 38, 30400, null, c1, null, 'BON-TRF-012', '2026-10-08', uMagasin, 'Transfert de 800 briques depuis dépôt central vers Hydra');

  // 21. Documents & GED
  const insertDoc = db.prepare(`
    INSERT INTO documents (titre, type_document, chantier_id, fournisseur_id, client_id, employee_id, materiel_id, file_path, file_name, file_size, mime_type, date_document, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertDoc.run('Permis de Construire N°124/2024 - APC Hydra', 'PERMIS_CONSTRUIRE', c1, null, null, null, null, '/documents/permis-hydra.pdf', 'permis-hydra.pdf', 3420000, 'application/pdf', '2024-11-15', uAdmin);
  insertDoc.run('Plans Architecturaux R+9 & Coupes Façades - BET BTP', 'PLAN_ARCHI', c1, null, null, null, null, '/documents/plans-archi-hydra.pdf', 'plans-archi-hydra.pdf', 14500000, 'application/pdf', '2024-12-01', uConducteur);
  insertDoc.run('Contrat Fourniture Béton Prêt à l\'Emploi - SARL Béton Express', 'CONTRAT', c1, f1, null, null, null, '/documents/contrat-beton-2025.pdf', 'contrat-beton-2025.pdf', 1250000, 'application/pdf', '2025-02-10', uAdmin);
  insertDoc.run('Rapport de Contrôle Technique CTC Organisme Régional', 'AUTRE', c1, null, null, null, null, '/documents/rapport-ctc-r6.pdf', 'rapport-ctc-r6.pdf', 2800000, 'application/pdf', '2026-10-05', uConducteur);
  insertDoc.run('Contrat de Réservation & Plan Notarié Lot A31 Dr. Mansouri', 'CONTRAT', c1, null, cl1, null, null, '/documents/contrat-mansouri.pdf', 'contrat-mansouri.pdf', 4100000, 'application/pdf', '2025-04-10', uAdmin);
  insertDoc.run('Certificat de Conformité & Visite Annuelle Grue Potain', 'ASSURANCE', c1, null, null, null, m1, '/documents/certif-potain-2026.pdf', 'certif-potain-2026.pdf', 980000, 'application/pdf', '2026-08-20', uConducteur);

  // 22. Audit Logs
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, action, module, details, ip_address)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertAudit.run(uAdmin, 'M. Karim Brahimi', 'CREATION_CHANTIER', 'Chantiers', 'Création du chantier Résidence Les Jasmins Hydra (Budget 850M DA)', '192.168.1.10');
  insertAudit.run(uCaisse, 'Mme. Samia Benali', 'ALIMENTATION_CAISSE', 'Caisses', 'Alimentation 1 500 000 DA de FDR Hydra depuis compte BNA', '192.168.1.15');
  insertAudit.run(uConducteur, 'Ing. Amine Dahmani', 'SORTIE_CAISSE', 'Caisses', 'Émission bon de caisse BC-2026-0101 (185 000 DA) pour ferraillage', '192.168.1.22');
  insertAudit.run(uRH, 'Mme. Leila Cherif', 'GENERATION_PAIE', 'Personnel & Paie', 'Clôture et génération des paies du mois de Septembre 2026', '192.168.1.18');
  insertAudit.run(uMagasin, 'M. Omar Bouzid', 'ENTREE_STOCK', 'Stocks', 'Réception BL-ENT-2026-088: 500 sacs ciment CPJ 42.5', '192.168.1.30');

  seedRolesAndPermissions();

  console.log('Database successfully seeded with realistic Algerian construction data!');
}

function seedRolesAndPermissions() {
  const rolesCount = db.prepare('SELECT COUNT(*) as count FROM roles').get();
  if (rolesCount && rolesCount.count > 0) {
    return;
  }

  console.log('Seeding roles and granular permissions...');

  const insertRole = db.prepare(`
    INSERT INTO roles (code, name, description, is_system)
    VALUES (?, ?, ?, ?)
  `);

  const insertPerm = db.prepare(`
    INSERT OR IGNORE INTO role_permissions (role_id, permission_key)
    VALUES (?, ?)
  `);

  // 1. Roles
  const rAdmin = insertRole.run('ADMIN', 'Promoteur / Directeur Général', 'Accès total à tous les chantiers, finances, paies, trésorerie et administration.', 1).lastInsertRowid;
  const rConducteur = insertRole.run('CONDUCTEUR', 'Conducteur de Travaux', 'Gestion de chantier, bons de caisse de fond de roulement, pointages ouvriers, matériel et stocks.', 1).lastInsertRowid;
  const rCaissier = insertRole.run('CAISSIER', 'Responsable Trésorerie & Caisse', 'Gestion des caisses chantiers, approvisionnements, sorties d\'argent, règlements fournisseurs.', 1).lastInsertRowid;
  const rComptable = insertRole.run('COMPTABLE', 'Chef Comptable', 'Validation des dépenses, calcul de la paie, suivi des factures fournisseurs et états financiers.', 1).lastInsertRowid;
  const rRH = insertRole.run('RH', 'Responsable RH & Paie', 'Gestion du personnel, contrats ouvriers, fiches de paie, avances et attestations de travail.', 1).lastInsertRowid;
  const rMagasin = insertRole.run('MAGASINIER', 'Gestionnaire Stocks & Matériel', 'Réception des matériaux, bons de sortie chantier, entretien des engins et carburant.', 1).lastInsertRowid;

  // 2. Permissions per Role
  const { ALL_PERMISSIONS } = require('./db');
  const allKeys = ALL_PERMISSIONS.map(p => p.key);

  // Admin has ALL
  for (const k of allKeys) {
    insertPerm.run(rAdmin, k);
  }

  // Conducteur
  const conducteurKeys = [
    'chantiers:read', 'chantiers:edit',
    'caisses:read', 'caisses:decaissement',
    'personnel:read', 'personnel:affecter', 'personnel:pointage',
    'materiel:read', 'materiel:affecter', 'materiel:carburant',
    'stocks:read', 'stocks:mouvements',
    'depenses:read', 'depenses:create',
    'documents:read', 'documents:upload'
  ];
  for (const k of conducteurKeys) insertPerm.run(rConducteur, k);

  // Caissier
  const caissierKeys = [
    'chantiers:read',
    'caisses:read', 'caisses:decaissement', 'caisses:alimentation',
    'personnel:read', 'personnel:paie_payer',
    'depenses:read', 'depenses:create', 'depenses:regler',
    'clients:read', 'clients:encaissement',
    'documents:read', 'audit:read'
  ];
  for (const k of caissierKeys) insertPerm.run(rCaissier, k);

  // Comptable
  const comptableKeys = [
    'chantiers:read',
    'caisses:read',
    'personnel:read', 'personnel:paie_generate', 'personnel:paie_payer',
    'depenses:read', 'depenses:create', 'depenses:regler',
    'clients:read', 'clients:encaissement',
    'documents:read', 'documents:upload',
    'audit:read'
  ];
  for (const k of comptableKeys) insertPerm.run(rComptable, k);

  // RH
  const rhKeys = [
    'chantiers:read',
    'personnel:read', 'personnel:create', 'personnel:affecter', 'personnel:pointage', 'personnel:paie_generate', 'personnel:paie_payer',
    'documents:read', 'documents:upload'
  ];
  for (const k of rhKeys) insertPerm.run(rRH, k);

  // Magasinier
  const magasinKeys = [
    'chantiers:read',
    'materiel:read', 'materiel:affecter', 'materiel:carburant',
    'stocks:read', 'stocks:mouvements', 'stocks:create',
    'documents:read', 'documents:upload'
  ];
  for (const k of magasinKeys) insertPerm.run(rMagasin, k);

  // 3. Link existing users to role_id
  db.prepare('UPDATE users SET role_id = ? WHERE role = ?').run(rAdmin, 'ADMIN');
  db.prepare('UPDATE users SET role_id = ? WHERE role = ?').run(rConducteur, 'CONDUCTEUR');
  db.prepare('UPDATE users SET role_id = ? WHERE role = ?').run(rCaissier, 'CAISSIER');
  db.prepare('UPDATE users SET role_id = ? WHERE role = ?').run(rComptable, 'COMPTABLE');
  db.prepare('UPDATE users SET role_id = ? WHERE role = ?').run(rRH, 'RH');
  db.prepare('UPDATE users SET role_id = ? WHERE role = ?').run(rMagasin, 'MAGASINIER');

  // 4. Sample user_chantiers scope
  const conducteurUser = db.prepare("SELECT id FROM users WHERE role = 'CONDUCTEUR'").get();
  const cHydra = db.prepare("SELECT id FROM chantiers WHERE code = 'CHT-01-ALG'").get();
  const cOran = db.prepare("SELECT id FROM chantiers WHERE code = 'CHT-02-ORN'").get();

  if (conducteurUser && cHydra) {
    db.prepare('INSERT OR IGNORE INTO user_chantiers (user_id, chantier_id) VALUES (?, ?)').run(conducteurUser.id, cHydra.id);
  }
  if (conducteurUser && cOran) {
    db.prepare('INSERT OR IGNORE INTO user_chantiers (user_id, chantier_id) VALUES (?, ?)').run(conducteurUser.id, cOran.id);
  }

  console.log('Roles and permissions seeded successfully!');
}

module.exports = { seedDatabase, seedRolesAndPermissions };

if (require.main === module) {
  seedDatabase();
  seedRolesAndPermissions();
}
