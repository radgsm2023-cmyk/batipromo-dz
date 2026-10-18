const { db } = require('./db');

db.prepare(`
  UPDATE company_settings SET
    company_name = 'BATIPROMO EL DJAZAIR',
    sigle = 'BATIPROMO DZ',
    forme_juridique = 'SARL',
    capital_social = 50000000,
    agrement_promoteur = 'AGR-MIN-HABITAT-2021-0487',
    date_agrement = '2021-03-15',
    registre_commerce = '16/00-0987654B21',
    nif = '002116010987654',
    nis = '098765432101234',
    article_imposition = '16010987654',
    adresse_siege = '14, Boulevard du 11 Décembre 1960, Val d''Hydra',
    commune = 'Hydra',
    wilaya = 'Alger',
    code_postal = '16035',
    telephone_1 = '+213 (0) 23 45 67 89',
    telephone_2 = '+213 (0) 550 12 34 56',
    fax = '+213 (0) 23 45 67 90',
    email_contact = 'contact@batipromo.dz',
    email_direction = 'direction@batipromo.dz',
    site_web = 'https://www.batipromo.dz',
    rib_principal = '001 00234 0300012345 67',
    banque_principale = 'Banque Nationale d''Algérie (BNA) - Agence Didouche Mourad Alger',
    devise_nom = 'Dinar Algérien',
    devise_code = 'DZD',
    devise_symbole = 'DA',
    seuil_validation_caisse = 100000,
    exiger_validation_toutes_sorties = 1,
    seuil_alerte_caisse_defaut = 150000,
    taux_cnas_salarie = 9.0,
    taux_cnas_patronal = 26.0,
    heures_jour_travail = 8.0,
    jours_ouvrables_mois = 22,
    mention_legale_documents = 'Document comptable officiel BATIPROMO DZ - Généré par le Système Intégré de Gestion de Promotion Immobilière',
    pied_de_page_documents = 'BATIPROMO DZ SARL au Capital de 50 000 000 DA - Agrément Promoteur Immobilier N° AGR-MIN-HABITAT-2021-0487 - Val d''Hydra, Alger'
  WHERE id = 1
`).run();

console.log('Company settings initialized successfully');
