const express = require('express');
const router = express.Router();
const path = require('node:path');
const fs = require('node:fs');
const multer = require('multer');
const { db } = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

// Ensure uploads folder
const uploadsDir = path.resolve(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage for logo & stamp
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const prefix = req.path.includes('cachet') ? 'cachet' : 'logo';
    const filename = `${prefix}-${Date.now()}${ext}`;
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.png', '.jpg', '.jpeg', '.svg', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Format d\'image non supporté. Veuillez utiliser PNG, JPG, JPEG, SVG ou WebP.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

// Helper: Get or initialize settings row
function getSettingsRow() {
  let row = db.prepare('SELECT * FROM company_settings WHERE id = 1').get();
  if (!row) {
    db.prepare(`
      INSERT INTO company_settings (id, company_name)
      VALUES (1, 'BATIPROMO DZ')
    `).run();
    row = db.prepare('SELECT * FROM company_settings WHERE id = 1').get();
  }
  return row;
}

// ──────────────────────────────────────────────────────────────────────────
// GET /api/settings - Fetch current company settings
// ──────────────────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const settings = getSettingsRow();
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────────────────────────────────────────
// PUT /api/settings - Update company settings (ADMIN ONLY)
// ──────────────────────────────────────────────────────────────────────────
router.put('/', verifyToken, requireRole('ADMIN'), (req, res) => {
  try {
    const { updated_by } = req.body;
    const current = getSettingsRow();

    const company_name = req.body.company_name !== undefined ? req.body.company_name : current.company_name;
    const sigle = req.body.sigle !== undefined ? req.body.sigle : current.sigle;
    const forme_juridique = req.body.forme_juridique !== undefined ? req.body.forme_juridique : current.forme_juridique;
    const capital_social = req.body.capital_social !== undefined ? Number(req.body.capital_social) : current.capital_social;
    const agrement_promoteur = req.body.agrement_promoteur !== undefined ? req.body.agrement_promoteur : current.agrement_promoteur;
    const date_agrement = req.body.date_agrement !== undefined ? req.body.date_agrement : current.date_agrement;
    const registre_commerce = req.body.registre_commerce !== undefined ? req.body.registre_commerce : current.registre_commerce;
    const nif = req.body.nif !== undefined ? req.body.nif : current.nif;
    const nis = req.body.nis !== undefined ? req.body.nis : current.nis;
    const article_imposition = req.body.article_imposition !== undefined ? req.body.article_imposition : current.article_imposition;
    const adresse_siege = req.body.adresse_siege !== undefined ? req.body.adresse_siege : current.adresse_siege;
    const commune = req.body.commune !== undefined ? req.body.commune : current.commune;
    const wilaya = req.body.wilaya !== undefined ? req.body.wilaya : current.wilaya;
    const code_postal = req.body.code_postal !== undefined ? req.body.code_postal : current.code_postal;
    const telephone_1 = req.body.telephone_1 !== undefined ? req.body.telephone_1 : current.telephone_1;
    const telephone_2 = req.body.telephone_2 !== undefined ? req.body.telephone_2 : current.telephone_2;
    const fax = req.body.fax !== undefined ? req.body.fax : current.fax;
    const email_contact = req.body.email_contact !== undefined ? req.body.email_contact : current.email_contact;
    const email_direction = req.body.email_direction !== undefined ? req.body.email_direction : current.email_direction;
    const site_web = req.body.site_web !== undefined ? req.body.site_web : current.site_web;
    const rib_principal = req.body.rib_principal !== undefined ? req.body.rib_principal : current.rib_principal;
    const banque_principale = req.body.banque_principale !== undefined ? req.body.banque_principale : current.banque_principale;
    const logo_url = req.body.logo_url !== undefined ? req.body.logo_url : current.logo_url;
    const cachet_url = req.body.cachet_url !== undefined ? req.body.cachet_url : current.cachet_url;
    const devise_nom = req.body.devise_nom !== undefined ? req.body.devise_nom : current.devise_nom;
    const devise_code = req.body.devise_code !== undefined ? req.body.devise_code : current.devise_code;
    const devise_symbole = req.body.devise_symbole !== undefined ? req.body.devise_symbole : current.devise_symbole;
    const seuil_validation_caisse = req.body.seuil_validation_caisse !== undefined ? Number(req.body.seuil_validation_caisse) : current.seuil_validation_caisse;
    const exiger_validation_toutes_sorties = req.body.exiger_validation_toutes_sorties !== undefined ? (req.body.exiger_validation_toutes_sorties ? 1 : 0) : current.exiger_validation_toutes_sorties;
    const seuil_alerte_caisse_defaut = req.body.seuil_alerte_caisse_defaut !== undefined ? Number(req.body.seuil_alerte_caisse_defaut) : current.seuil_alerte_caisse_defaut;
    const taux_cnas_salarie = req.body.taux_cnas_salarie !== undefined ? Number(req.body.taux_cnas_salarie) : current.taux_cnas_salarie;
    const taux_cnas_patronal = req.body.taux_cnas_patronal !== undefined ? Number(req.body.taux_cnas_patronal) : current.taux_cnas_patronal;
    const heures_jour_travail = req.body.heures_jour_travail !== undefined ? Number(req.body.heures_jour_travail) : current.heures_jour_travail;
    const jours_ouvrables_mois = req.body.jours_ouvrables_mois !== undefined ? Number(req.body.jours_ouvrables_mois) : current.jours_ouvrables_mois;
    const mention_legale_documents = req.body.mention_legale_documents !== undefined ? req.body.mention_legale_documents : current.mention_legale_documents;
    const pied_de_page_documents = req.body.pied_de_page_documents !== undefined ? req.body.pied_de_page_documents : current.pied_de_page_documents;

    db.prepare(`
      UPDATE company_settings SET
        company_name = ?,
        sigle = ?,
        forme_juridique = ?,
        capital_social = ?,
        agrement_promoteur = ?,
        date_agrement = ?,
        registre_commerce = ?,
        nif = ?,
        nis = ?,
        article_imposition = ?,
        adresse_siege = ?,
        commune = ?,
        wilaya = ?,
        code_postal = ?,
        telephone_1 = ?,
        telephone_2 = ?,
        fax = ?,
        email_contact = ?,
        email_direction = ?,
        site_web = ?,
        rib_principal = ?,
        banque_principale = ?,
        logo_url = ?,
        cachet_url = ?,
        devise_nom = ?,
        devise_code = ?,
        devise_symbole = ?,
        seuil_validation_caisse = ?,
        exiger_validation_toutes_sorties = ?,
        seuil_alerte_caisse_defaut = ?,
        taux_cnas_salarie = ?,
        taux_cnas_patronal = ?,
        heures_jour_travail = ?,
        jours_ouvrables_mois = ?,
        mention_legale_documents = ?,
        pied_de_page_documents = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(
      company_name,
      sigle,
      forme_juridique,
      capital_social,
      agrement_promoteur,
      date_agrement,
      registre_commerce,
      nif,
      nis,
      article_imposition,
      adresse_siege,
      commune,
      wilaya,
      code_postal,
      telephone_1,
      telephone_2,
      fax,
      email_contact,
      email_direction,
      site_web,
      rib_principal,
      banque_principale,
      logo_url,
      cachet_url,
      devise_nom,
      devise_code,
      devise_symbole,
      seuil_validation_caisse,
      exiger_validation_toutes_sorties,
      seuil_alerte_caisse_defaut,
      taux_cnas_salarie,
      taux_cnas_patronal,
      heures_jour_travail,
      jours_ouvrables_mois,
      mention_legale_documents,
      pied_de_page_documents
    );

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, module, details)
      VALUES (?, 'MISE_A_JOUR_PARAMETRES', 'Paramétrage', ?)
    `).run(
      updated_by || null,
      `Mise à jour des coordonnées et paramètres de l'entreprise "${company_name || 'BATIPROMO DZ'}"`
    );

    const updated = getSettingsRow();
    res.json({ success: true, settings: updated, message: 'Paramètres du promoteur enregistrés avec succès' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────────────────────────────────────────
// POST /api/settings/upload-logo - Import company logo (ADMIN ONLY)
// ──────────────────────────────────────────────────────────────────────────
router.post('/upload-logo', verifyToken, requireRole('ADMIN'), upload.single('logo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier image fourni' });
    }

    const logoUrl = `/uploads/${req.file.filename}`;
    getSettingsRow();

    db.prepare('UPDATE company_settings SET logo_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1').run(logoUrl);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (action, module, details)
      VALUES ('IMPORT_LOGO', 'Paramétrage', ?)
    `).run(`Importation du nouveau logo officiel de l'entreprise (${req.file.filename})`);

    const updated = getSettingsRow();
    res.json({
      success: true,
      logo_url: logoUrl,
      settings: updated,
      message: 'Logo officiel du promoteur importé avec succès'
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────────────────────────────────────────
// POST /api/settings/upload-cachet - Import company stamp / signature (ADMIN ONLY)
// ──────────────────────────────────────────────────────────────────────────
router.post('/upload-cachet', verifyToken, requireRole('ADMIN'), upload.single('cachet'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier image fourni' });
    }

    const cachetUrl = `/uploads/${req.file.filename}`;
    getSettingsRow();

    db.prepare('UPDATE company_settings SET cachet_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1').run(cachetUrl);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (action, module, details)
      VALUES ('IMPORT_CACHET', 'Paramétrage', ?)
    `).run(`Importation du cachet et de la griffe officielle (${req.file.filename})`);

    const updated = getSettingsRow();
    res.json({
      success: true,
      cachet_url: cachetUrl,
      settings: updated,
      message: 'Cachet & griffe officielle importés avec succès'
    });
  } catch (error) {
    console.error('Error uploading cachet:', error);
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────────────────────────────────────────
// DELETE /api/settings/logo - Reset logo (ADMIN ONLY)
// ──────────────────────────────────────────────────────────────────────────
router.delete('/logo', verifyToken, requireRole('ADMIN'), (req, res) => {
  try {
    db.prepare("UPDATE company_settings SET logo_url = '', updated_at = CURRENT_TIMESTAMP WHERE id = 1").run();
    res.json({ success: true, message: 'Logo réinitialisé' });
  } catch (error) {
    console.error('Error resetting logo:', error);
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────────────────────────────────────────
// DELETE /api/settings/cachet - Reset cachet (ADMIN ONLY)
// ──────────────────────────────────────────────────────────────────────────
router.delete('/cachet', verifyToken, requireRole('ADMIN'), (req, res) => {
  try {
    db.prepare("UPDATE company_settings SET cachet_url = '', updated_at = CURRENT_TIMESTAMP WHERE id = 1").run();
    res.json({ success: true, message: 'Cachet réinitialisé' });
  } catch (error) {
    console.error('Error resetting cachet:', error);
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────────────────────────────────────────
// GET /api/settings/backup - Database backup download (ADMIN ONLY)
// ──────────────────────────────────────────────────────────────────────────
router.get('/backup', verifyToken, requireRole('ADMIN'), (req, res) => {
  try {
    const dbPath = path.resolve(__dirname, '..', '..', 'batipromo.db'); // server/routes/ -> server/ -> projectpromo/
    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ error: 'Base de données introuvable' });
    }
    const backupName = `batipromo-dz-backup-${new Date().toISOString().slice(0, 10)}.db`;
    res.download(dbPath, backupName);
  } catch (error) {
    console.error('Error generating backup:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
