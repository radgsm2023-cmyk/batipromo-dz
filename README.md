# BATIPROMO DZ 🏗️
### ERP Professionnel de Promotion Immobilière & Gestion Multi-Chantiers

Application web d'entreprise moderne, évolutive et sécurisée conçue spécifiquement pour les promoteurs immobiliers et entreprises de construction gérant plusieurs chantiers simultanément en Algérie.

**Devise principale :** Dinar Algérien (**DZD / DA**)  
**Langue de l'interface :** Français  

---

## 🌟 Modules & Fonctionnalités

### 1. 📊 Tableau de Bord Stratégique & Trésorerie en Temps Réel
- **KPIs Trésorerie Globale :** Suivi consolidé des soldes des fonds de roulement chantiers et des comptes bancaires (BNA, CPA, etc.) en Dinars Algériens.
- **Avancement & Consommation Budgétaire :** Suivi comparatif des budgets prévus vs dépenses réelles par chantier (Alger, Oran, Constantine, Annaba, etc.).
- **Alertes Trésorerie & Stocks :** Détection instantanée des caisses de chantier en dessous du seuil de sécurité (`seuil_alerte`) et des ruptures de stock imminentes (ciment, ferraillage).
- **Répartition des Dépenses :** Visualisation par poste (Gros œuvre, Main d'œuvre, Carburant, Matériel & Engins, Céramique, Sous-traitance).
- **Flux & Règlements Récents :** Historique des dernières opérations avec impression immédiate des bons de caisse officiels.

---

### 2. 🏗️ Gestion Multi-Chantiers (Projets Immobiliers)
- **Fiches Projets Complètes :** Code chantier, désignation, standing (Haut Standing, LPL, Semi-collectif, Commercial), localisation (Wilaya, Commune), budget en DA, surface, nombre de lots.
- **Cockpit Projet Dédié (Multi-Onglets) :**
  - **Aperçu & Planning :** Dates, conducteur responsable, description technique.
  - **Caisse Dédiée :** Solde en direct du fond de roulement propre au chantier.
  - **Personnel Affecté :** Liste des ouvriers, chefs de chantier et qualification.
  - **Matériel & Engins :** Engins en service sur le site (internes & loués).
  - **Stocks sur Place :** Matériaux physiquement stockés sur le chantier.
  - **Dépenses :** Factures et décomptes rattachés.
  - **Ventes & Lots :** Acquéreurs, appartements réservés et échéanciers.
  - **Documents :** Permis de construire, plans d'exécution, rapports CTC.

---

### 3. 💰 Caisses de Fond de Roulement & Trésorerie
- **Architecture Multi-Caisses :** Caisses centrales, caisses de fond de roulement de chaque chantier et comptes bancaires.
- **Mouvements & Décaissements :**
  - **Sorties d'argent :** Dépenses urgentes, achats de dépannage, main d'œuvre, avances.
  - **Entrées :** Encaissements clients, remboursements.
  - **Alimentations :** Virement direct depuis le compte bancaire ou la caisse centrale vers le fond de roulement du chantier avec mise à jour atomique des soldes.
- **Bons de Caisse Officiels Numérotés (Imprimables) :** Format standard avec montant en lettres et chiffres (DA), motif, bénéficiaire et triple visa (Caissier, Conducteur, Bénéficiaire).

---

### 4. 👷 Module Personnel, Affectations & Paie *(Demandé)*
- **Gestion des Salariés & Tâcherons :** Fiches complètes avec numéro CNAS, CIN/NIN, contrat (Permanent mensuel vs Journalier à la tâche).
- **Affectation Dynamique aux Chantiers :** Affecter un ouvrier ou une équipe à un chantier avec date de début, date de fin, rôle et historique d'affectations.
- **Feuille de Pointage Quotidien :** Pointage par chantier et par date (Présent 8h, Demi-journée, Absent), calcul automatique de la rémunération journalière en DA.
- **Avances sur Salaire :** Déduction automatique des acomptes perçus en caisse lors du calcul de la paie.
- **Calcul & Génération de la Paie :**
  - Calcul automatique du net à payer : `(Salaire de base + Heures supplémentaires + Primes de chantier) - Avances perçues - Retenues CNAS`.
  - Décaissement en espèces ou virement depuis la caisse sélectionnée.
  - **Édition et Impression du Bulletin de Paie Officiel** en Dinars Algériens.

---

### 5. 🚜 Module Matériel, Engins (Interne & Location) & Affectations *(Demandé)*
- **Distinction Parc Interne vs Location :**
  - **Matériel Interne :** Grues à tour, rétrochargeuses, camions bennes, échafaudages appartenant au promoteur (valeur d'acquisition, amortissement, suivi maintenance).
  - **Matériel en Location :** Engins loués auprès de prestataires (taux journalier en DA, coût mensuel, échéances contractuelles).
- **Affectation des Engins aux Chantiers :** Affectation à un projet avec date de début, prévision de fin, relevé de compteur d'heures et assignation du chauffeur/opérateur.
- **Consommations de Carburant (Gasoil) & Entretiens :** Enregistrement des pleins de gasoil (litres, montant en DA), vidanges et réparations avec imputation budgétaire sur le chantier et débit de la caisse.

---

### 6. 📦 Stocks & Matériaux BTP
- **Catalogue & Niveaux de Stock :** Suivi en temps réel des quantités sur le dépôt central et sur chaque chantier.
- **Alertes Stock Critique :** Déclenchement automatique dès que le stock passe sous le seuil d'alerte (sacs de ciment, ferraillage FeE500, briques, agrégats).
- **Mouvements & Traçabilité :** Bons d'entrée (BL fournisseur), bons de sortie pour coulage dalle/voile, et bons de transfert inter-chantiers.

---

### 7. 💳 Dépenses, Fournisseurs & Tiers Bénéficiaires
- **Dépenses :** Suivi par catégorie (Gros œuvre, Second œuvre, Carburant, Salaires, etc.), état de règlement (Payé, Partiel, Non payé).
- **Fournisseurs :** Répertoire complet (NIF, NIS, RC, RIB), historique des factures et suivi du solde restant dû.
- **Bénéficiaires :** Suivi de tous les paiements versés aux artisans, sous-traitants et prestataires.

---

### 8. 📑 Clients, Ventes & Recouvrements Immobiliers
- **Acquéreurs & Contrats de Réservation :** Enregistrement des ventes d'appartements, duplexes et locaux commerciaux.
- **Échéanciers & Encaissements :** Suivi des tranches de paiement selon l'avancement légal, encaissements avec émission de reçus et crédit automatique de la caisse ou du compte bancaire.

---

### 9. 📂 Documents & GED (Gestion Électronique des Documents)
- Stockage et classement par chantier : permis de construire, plans d'architecte DWG/PDF, contrats notariés, rapports du CTC.

---

### 10. 🛡️ Module Gestion des Utilisateurs, Rôles & Permissions (RBAC) *(Dédié)*
- **Comptes Utilisateurs & Périmètres d'Intervention :**
  - Gestion des utilisateurs (Nom, Email, Téléphone, Mot de passe sécurisé bcrypt, Statut Actif / Bloqué).
  - **Restriction de Périmètre par Chantier :** Possibilité d'affecter un utilisateur à un ou plusieurs chantiers spécifiques (ex: un conducteur de travaux restreint uniquement à Annaba ou Oran), ou d'accorder un périmètre global (DG / Promoteur / Chef Comptable).
- **Rôles Système & Rôles Personnalisés :**
  - Rôles standards pré-configurés : `ADMIN`, `CONDUCTEUR`, `CAISSIER`, `COMPTABLE`, `RH`, `MAGASINIER`.
  - **Créateur de Rôles sur Mesure :** Définir des rôles spécifiques selon l'organisation de l'entreprise (ex: "Assistant Conducteur", "Auditeur Interne", "Responsable Logistique") avec code et description.
- **Matrice Granulaire de 33 Permissions :**
  - **Chantiers :** Lecture, création, modification, suppression.
  - **Caisses :** Lecture des soldes, émission de bons de décaissement, alimentations/transferts, création de caisses.
  - **Personnel & Paie :** Répertoire ouvriers, affectation chantiers, saisie des pointages, calcul de paie, décaissement salaires.
  - **Matériel :** Consultation parc, contrats de location, affectations engins, saisie gasoil & maintenance.
  - **Stocks :** Consultation état & alertes, émission de bons (BL, sorties, transferts), catalogue articles.
  - **Dépenses :** Consultation, saisie de factures, règlement des soldes fournisseurs.
  - **Clients & Ventes :** Acquéreurs, contrats de réservation, encaissements des tranches.
  - **GED :** Consultation, téléversement de plans/permis, suppression.
  - **Administration :** Gestion des comptes utilisateurs, configuration des rôles et consultation du journal d'audit.
- **Sélecteur de Profil en Direct (Mode Démo) :** Permet d'incarner en un clic n'importe quel profil utilisateur depuis la barre de navigation supérieure pour tester en direct ses droits et son périmètre.
- **Journal d'Audit Horodaté :** Enregistre automatiquement toute création de compte, modification de droits, réinitialisation de mot de passe et opération financière avec adresse IP.

---

## 🚀 Démarrage Rapide

### Prérequis
- **Node.js** version 20 ou supérieure (testé avec succès sur Node.js v26.10.0)

### Lancement de l'Application

1. **Lancement du Serveur Full-Stack (Recommandé) :**
   ```bash
   npm run server
   ```
   L'application complète (Backend API + Frontend React précompilé) est immédiatement accessible sur :  
   👉 **http://localhost:5000**

2. **Lancement en Mode Développement (Rechargement à chaud Vite) :**
   ```bash
   npm run dev
   ```
   - Serveur API Express : `http://localhost:5000`
   - Client React Vite : `http://localhost:5173`

---

## 🗄️ Base de Données & Données Démo

La base de données SQLite native (`batipromo.db`) est initialisée et pré-remplie automatiquement avec des données algériennes réalistes :
- 4 grands chantiers (Hydra Alger, Front de Mer Oran, Mansourah Constantine, Seraïdi Annaba)
- 7 caisses de fond de roulement et comptes bancaires (BNA, CPA)
- 10 salariés et ouvriers qualifiés (chefs de chantier, grutiers, ferrailleurs, maçons)
- 7 engins lourds (Grues Potain, Rétrochargeuse CAT, Camion Kerax, Groupe Cummins)
- Catalogue complet de matériaux BTP avec alertes de seuil
- Contrats de réservation clients et mouvements de caisse récents.
