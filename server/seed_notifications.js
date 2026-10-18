const { db } = require('./db');

try {
  // 1. Pending movements
  db.prepare(`
    INSERT OR IGNORE INTO caisse_mouvements (
      reference, caisse_id, type, montant, date, mode_paiement, piece_justificative, 
      motif, categorie, chantier_id, beneficiaire_id, created_by, status, is_sensible
    ) VALUES (
      'BC-2026-9102', 2, 'SORTIE', 220000, '2026-10-18', 'ESPECES', 'DEVIS-FERR-44',
      'Acompte urgent équipe coffrage et ferraillage dalle niveau R+6', 'MAIN_DOEUVRE', 1, 1, 2, 'EN_ATTENTE_VALIDATION', 1
    )
  `).run();

  db.prepare(`
    INSERT OR IGNORE INTO caisse_mouvements (
      reference, caisse_id, type, montant, date, mode_paiement, piece_justificative, 
      motif, categorie, chantier_id, beneficiaire_id, created_by, status, is_sensible
    ) VALUES (
      'BC-2026-9105', 3, 'SORTIE', 350000, '2026-10-18', 'ESPECES', 'BON-ENGIN-109',
      'Paiement direct carburant gasoil et chauffeur dumper terrassement', 'CARBURANT', 2, 4, 2, 'EN_ATTENTE_VALIDATION', 1
    )
  `).run();

  // 2. Notifications
  const existingCount = db.prepare('SELECT count(*) as c FROM notifications').get().c;
  if (existingCount === 0) {
    db.prepare(`
      INSERT INTO notifications (user_id, type, titre, message, montant, lien, reference)
      VALUES (
        NULL, 'VALIDATION_CAISSE_REQUISE', 
        'Demande de Sortie de Caisse (BC-2026-9102)',
        'Demande de décaissement de 220 000 DA par Ing. Amine Dahmani sur FDR Hydra pour M. Abdelkader Bouzid. Validation Admin requise.',
        220000, 'caisses', 'BC-2026-9102'
      )
    `).run();

    db.prepare(`
      INSERT INTO notifications (user_id, type, titre, message, montant, lien, reference)
      VALUES (
        NULL, 'VERSEMENT_BENEFICIAIRE',
        'Nouveau Versement Bénéficiaire (BE-2026-8841)',
        'Versement de 450 000 DA encaissé de la part de M. Abdelkader Bouzid sur Caisse Centrale Siège. Motif: Restitution solde avance coffrage.',
        450000, 'caisses', 'BE-2026-8841'
      )
    `).run();

    db.prepare(`
      INSERT INTO notifications (user_id, type, titre, message, montant, lien, reference)
      VALUES (
        NULL, 'VERSEMENT_CLIENT',
        'Versement Acquéreur Client (REC-CL-2026-402)',
        'Versement de 1 200 000 DA reçu du Dr. Redha Mansouri pour Lot A31 - F4 Standing Hydra (Réf Caisse: BE-2026-4402).',
        1200000, 'clients', 'REC-CL-2026-402'
      )
    `).run();
  }

  console.log('Test notifications and pending movements successfully seeded!');
} catch (e) {
  console.error('Error seeding notifications:', e);
}
