const express = require('express');
const router = express.Router();
const path = require('node:path');
const fs = require('node:fs');
const multer = require('multer');
const { db } = require('../db');

// Ensure uploads folder exists
const uploadsDir = path.resolve(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Allowed extensions for documents
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.doc', '.docx', '.xls', '.xlsx'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBaseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_\u0600-\u06FF-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${safeBaseName}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Type de fichier non autorisé (${ext}). Formats acceptés : PDF, Images (JPG, PNG, WebP) et Bureautique (DOC, DOCX, XLS, XLSX).`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 } // 15 Mo max
});

// List documents with filters
router.get('/', (req, res) => {
  try {
    const { chantier_id, fournisseur_id, client_id, employee_id, materiel_id, type_document, search } = req.query;

    let query = `
      SELECT 
        d.*,
        ch.name as chantier_name,
        f.name as fournisseur_name,
        cl.nom || ' ' || cl.prenom as client_name,
        e.nom || ' ' || e.prenom as employee_name,
        m.nom as materiel_name,
        u.name as uploaded_by_name
      FROM documents d
      LEFT JOIN chantiers ch ON d.chantier_id = ch.id
      LEFT JOIN fournisseurs f ON d.fournisseur_id = f.id
      LEFT JOIN clients cl ON d.client_id = cl.id
      LEFT JOIN employees e ON d.employee_id = e.id
      LEFT JOIN materiel m ON d.materiel_id = m.id
      LEFT JOIN users u ON d.uploaded_by = u.id
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
    if (client_id) {
      query += ` AND d.client_id = ?`;
      params.push(client_id);
    }
    if (employee_id) {
      query += ` AND d.employee_id = ?`;
      params.push(employee_id);
    }
    if (materiel_id) {
      query += ` AND d.materiel_id = ?`;
      params.push(materiel_id);
    }
    if (type_document) {
      query += ` AND d.type_document = ?`;
      params.push(type_document);
    }
    if (search) {
      query += ` AND (d.titre LIKE ? OR d.file_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY d.date_document DESC, d.id DESC`;

    const documents = db.prepare(query).all(...params);
    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload and create document record
router.post('/', upload.single('file'), (req, res) => {
  try {
    const {
      titre,
      type_document,
      chantier_id,
      fournisseur_id,
      client_id,
      employee_id,
      materiel_id,
      date_document,
      uploaded_by
    } = req.body;

    const file = req.file;
    const filePath = file ? `/uploads/${file.filename}` : '/documents/document-standard.pdf';
    const fileName = file ? file.originalname : (titre || 'document.pdf');
    const fileSize = file ? file.size : 1024000;
    const mimeType = file ? file.mimetype : 'application/pdf';

    const result = db.prepare(`
      INSERT INTO documents (
        titre, type_document, chantier_id, fournisseur_id, client_id, 
        employee_id, materiel_id, file_path, file_name, file_size, 
        mime_type, date_document, uploaded_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      titre, type_document || 'AUTRE', chantier_id || null,
      fournisseur_id || null, client_id || null, employee_id || null,
      materiel_id || null, filePath, fileName, fileSize,
      mimeType, date_document || new Date().toISOString().slice(0, 10),
      uploaded_by || null
    );

    res.status(201).json({ id: result.lastInsertRowid, message: 'Document enregistré avec succès', filePath });
  } catch (error) {
    console.error('Error adding document:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete document
router.delete('/:id', (req, res) => {
  try {
    const id = req.params.id;
    db.prepare('DELETE FROM documents WHERE id = ?').run(id);
    res.json({ message: 'Document supprimé' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
