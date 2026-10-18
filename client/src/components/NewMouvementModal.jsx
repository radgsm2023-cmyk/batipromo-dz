import React, { useState, useEffect } from 'react';
import { X, ArrowDownRight, ArrowUpRight, RefreshCw, AlertCircle, Check, ShieldAlert, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function NewMouvementModal({ currentUser, caisses = [], chantiers = [], preselectedCaisseId, onClose, onSuccess }) {
  const [type, setType] = useState('SORTIE');
  const [caisseId, setCaisseId] = useState(preselectedCaisseId || (caisses[0]?.id || ''));
  const [sourceCaisseId, setSourceCaisseId] = useState('');
  const [targetCaisseId, setTargetCaisseId] = useState(preselectedCaisseId || '');
  const [chantierId, setChantierId] = useState('');
  const [montant, setMontant] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [modePaiement, setModePaiement] = useState('ESPECES');
  const [categorie, setCategorie] = useState('MAIN_DOEUVRE');
  const [motif, setMotif] = useState('');
  const [pieceJustificative, setPieceJustificative] = useState('');
  const [beneficiaireId, setBeneficiaireId] = useState('');
  const [fournisseurId, setFournisseurId] = useState('');
  const [autoValidate, setAutoValidate] = useState(true);

  const [beneficiaires, setBeneficiaires] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.permissions?.includes('caisses:validate');

  useEffect(() => {
    async function loadTiers() {
      try {
        const [b, f] = await Promise.all([
          api.getBeneficiaires(),
          api.getFournisseurs()
        ]);
        setBeneficiaires(b);
        setFournisseurs(f);
      } catch (e) {
        console.error('Error loading tiers:', e);
      }
    }
    loadTiers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!montant || Number(montant) <= 0) {
      setError('Veuillez renseigner un montant valide en DA');
      return;
    }
    if (!motif && type !== 'ALIMENTATION') {
      setError('Veuillez préciser le motif');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.createMouvement({
        caisse_id: type === 'ALIMENTATION' ? (targetCaisseId || caisseId) : caisseId,
        type,
        source_caisse_id: sourceCaisseId || null,
        target_caisse_id: targetCaisseId || null,
        montant: Number(montant),
        date,
        mode_paiement: modePaiement,
        piece_justificative: pieceJustificative,
        motif: motif || (type === 'ALIMENTATION' ? 'Alimentation de fond de roulement' : 'Mouvement de caisse'),
        categorie,
        chantier_id: chantierId || null,
        beneficiaire_id: beneficiaireId || null,
        fournisseur_id: fournisseurId || null,
        created_by: currentUser?.id || null,
        force_validate: isAdmin ? autoValidate : false
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-sm sm:text-base">Mouvement de Caisse & FDR</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Movement Type Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setType('SORTIE'); setModePaiement('ESPECES'); }}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg transition ${type === 'SORTIE' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <ArrowDownRight className="w-4 h-4" />
              Décaissement / Sortie
            </button>
            <button
              type="button"
              onClick={() => { setType('ENTREE'); setModePaiement('ESPECES'); }}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg transition ${type === 'ENTREE' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <ArrowUpRight className="w-4 h-4" />
              Versement / Entrée
            </button>
            <button
              type="button"
              onClick={() => { setType('ALIMENTATION'); setModePaiement('VIREMENT'); }}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg transition ${type === 'ALIMENTATION' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <RefreshCw className="w-4 h-4" />
              Alimentation FDR
            </button>
          </div>

          {/* Security / Validation Notice Banner */}
          {type === 'SORTIE' && !isAdmin && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Contrôle de Sécurité des Sorties de Caisse :</span>
                <span>Cette opération sera soumise à la <strong>validation de la Direction Générale (Admin)</strong> avant que les fonds ne soient décaissés. Une notification immédiate sera envoyée à l'administrateur.</span>
              </div>
            </div>
          )}

          {type === 'SORTIE' && isAdmin && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-medium">Autorité Administrateur détectée :</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer font-bold">
                <input
                  type="checkbox"
                  checked={autoValidate}
                  onChange={(e) => setAutoValidate(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Valider et décaisser immédiatement</span>
              </label>
            </div>
          )}

          {type === 'ENTREE' && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-900">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Notification de Versement :</span>
                <span>L'enregistrement d'un versement bénéficiaire enverra automatiquement une notification en temps réel à l'administrateur.</span>
              </div>
            </div>
          )}

          {/* Conditional Caisses selectors */}
          {type === 'ALIMENTATION' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Caisse Source (Banque / Siège) *</label>
                <select
                  value={sourceCaisseId}
                  onChange={(e) => setSourceCaisseId(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Sélectionner source...</option>
                  {caisses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({Number(c.balance).toLocaleString('fr-FR')} DA)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Caisse Destination (FDR Chantier) *</label>
                <select
                  value={targetCaisseId}
                  onChange={(e) => setTargetCaisseId(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Sélectionner destination...</option>
                  {caisses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({Number(c.balance).toLocaleString('fr-FR')} DA)</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Caisse de Fond de Roulement Débitée / Créditée *</label>
              <select
                value={caisseId}
                onChange={(e) => setCaisseId(e.target.value)}
                required
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {caisses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name} (Solde: {Number(c.balance).toLocaleString('fr-FR')} DA)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Amount & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Montant en Dinars Algériens (DA) *</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  placeholder="Ex: 85000"
                  required
                  className="w-full text-xs p-2.5 pr-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">DA</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date de l'Opération</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Chantier & Category */}
          {type !== 'ALIMENTATION' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Affectation Chantier</label>
                <select
                  value={chantierId}
                  onChange={(e) => setChantierId(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Frais Généraux Siège</option>
                  {chantiers.map((c) => (
                    <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catégorie Dépense / Recette</label>
                <select
                  value={categorie}
                  onChange={(e) => setCategorie(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="MAIN_DOEUVRE">Main d'œuvre & Tâcherons</option>
                  <option value="ACHAT_MATERIAUX">Achat Matériaux Urgent</option>
                  <option value="AVANCE_SALAIRE">Avance sur Salaire</option>
                  <option value="CARBURANT">Carburant Engins / Véhicules</option>
                  <option value="LOCATION_MATERIEL">Location Matériel / Outillage</option>
                  <option value="SOUS_TRAITANCE">Sous-traitance & Prestataire</option>
                  <option value="FRAIS_GENERAUX">Frais Généraux & Transport</option>
                  <option value="VERSEMENT_BENEFICIAIRE">Versement Bénéficiaire / Tiers</option>
                  <option value="REGLEMENT_CLIENT">Règlement Acquéreur</option>
                  <option value="AUTRE">Autre Dépense</option>
                </select>
              </div>
            </div>
          )}

          {/* Beneficiaire / Fournisseur */}
          {type !== 'ALIMENTATION' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bénéficiaire / Tiers {type === 'ENTREE' ? '(Émetteur du versement)' : ''}
                </label>
                <select
                  value={beneficiaireId}
                  onChange={(e) => setBeneficiaireId(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Sélectionner bénéficiaire...</option>
                  {beneficiaires.map((b) => (
                    <option key={b.id} value={b.id}>{b.name} ({b.type})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fournisseur (si achat direct)</label>
                <select
                  value={fournisseurId}
                  onChange={(e) => setFournisseurId(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Sélectionner fournisseur...</option>
                  {fournisseurs.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Mode & Justificatif */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mode de Paiement</label>
              <select
                value={modePaiement}
                onChange={(e) => setModePaiement(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="ESPECES">Espèces (Caisse)</option>
                <option value="CHEQUE">Chèque Bancaire</option>
                <option value="VIREMENT">Virement Bancaire</option>
                <option value="TRAITE">Traite / Effet</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">N° Pièce Justificative (Optionnel)</label>
              <input
                type="text"
                value={pieceJustificative}
                onChange={(e) => setPieceJustificative(e.target.value)}
                placeholder="Ex: Facture N°441 / Reçu N°12"
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Motif */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Motif Détaillé de l'Opération *</label>
            <textarea
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Ex: Paiement 4 jours ferraillage radier R+6 par M. Bouzid"
              rows={2}
              required={type !== 'ALIMENTATION'}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex items-center gap-2 px-5 py-2 text-white text-xs font-bold rounded-xl shadow-sm transition ${type === 'SORTIE' ? 'bg-rose-600 hover:bg-rose-500' : (type === 'ENTREE' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-blue-600 hover:bg-blue-500')}`}
            >
              <Check className="w-4 h-4" />
              {loading 
                ? 'Enregistrement...' 
                : (type === 'SORTIE' && !isAdmin ? 'Soumettre pour Validation Admin' : 'Enregistrer le Mouvement')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
