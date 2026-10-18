import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Plus, 
  Building, 
  Users, 
  CreditCard, 
  Check, 
  Clock, 
  AlertCircle, 
  Search,
  Filter,
  DollarSign
} from 'lucide-react';
import { api } from '../services/api';
import { formatDA, formatDACompact, formatDate } from '../utils/formatters';

export default function DepensesView({ chantiers = [], caisses = [] }) {
  const [subTab, setSubTab] = useState('depenses'); // 'depenses', 'fournisseurs', 'beneficiaires'
  const [depenses, setDepenses] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [beneficiaires, setBeneficiaires] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedChantier, setSelectedChantier] = useState('');
  const [selectedStatut, setSelectedStatut] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [showNewDepenseModal, setShowNewDepenseModal] = useState(false);
  const [showNewFournisseurModal, setShowNewFournisseurModal] = useState(false);
  const [showNewBenefModal, setShowNewBenefModal] = useState(false);
  const [reglementModal, setReglementModal] = useState(null); // depense to settle

  // Form states
  const [newDep, setNewDep] = useState({
    chantier_id: '',
    fournisseur_id: '',
    beneficiaire_id: '',
    date: new Date().toISOString().slice(0, 10),
    categorie: 'GROS_OEUVRE',
    montant_total: '',
    montant_paye: '',
    mode_reglement: 'CHEQUE',
    caisse_id: '',
    description: '',
    facture_numero: '',
    debiter_caisse: false
  });

  const [newFourn, setNewFourn] = useState({
    name: '',
    specialite: 'Béton prêt à l\'emploi',
    wilaya: 'Alger',
    phone: '',
    email: '',
    nif: '',
    rc: ''
  });

  const [newBenef, setNewBenef] = useState({
    name: '',
    type: 'ARTISAN_TACHERON',
    phone: '',
    nif_cin: '',
    notes: ''
  });

  const [reglementForm, setReglementForm] = useState({
    montant_verse: '',
    caisse_id: '',
    mode_reglement: 'ESPECES'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      if (subTab === 'depenses') {
        const data = await api.getDepenses({
          chantier_id: selectedChantier || undefined,
          statut_paiement: selectedStatut || undefined,
          search: search || undefined
        });
        setDepenses(data);
      } else if (subTab === 'fournisseurs') {
        const data = await api.getFournisseurs();
        setFournisseurs(data);
      } else if (subTab === 'beneficiaires') {
        const data = await api.getBeneficiaires();
        setBeneficiaires(data);
      }
    } catch (e) {
      console.error('Error loading depenses data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [subTab, selectedChantier, selectedStatut, search]);

  const handleCreateDepense = async (e) => {
    e.preventDefault();
    try {
      await api.createDepense(newDep);
      setShowNewDepenseModal(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Erreur création dépense');
    }
  };

  const handleCreateFournisseur = async (e) => {
    e.preventDefault();
    try {
      await api.createFournisseur(newFourn);
      setShowNewFournisseurModal(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Erreur création fournisseur');
    }
  };

  const handleCreateBeneficiaire = async (e) => {
    e.preventDefault();
    try {
      await api.createBeneficiaire(newBenef);
      setShowNewBenefModal(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Erreur création bénéficiaire');
    }
  };

  const handleConfirmReglement = async (e) => {
    e.preventDefault();
    if (!reglementModal) return;
    try {
      await api.reglerDepense(reglementModal.id, reglementForm);
      setReglementModal(null);
      loadData();
    } catch (err) {
      alert(err.message || 'Erreur règlement');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dépenses, Fournisseurs & Bénéficiaires</h1>
          <p className="text-xs text-slate-500">
            Suivi des factures chantiers, échéanciers fournisseurs, sous-traitants et tiers bénéficiaires en Dinars Algériens
          </p>
        </div>
        <div className="flex items-center gap-2">
          {subTab === 'depenses' && (
            <button
              onClick={() => setShowNewDepenseModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Nouvelle Dépense / Facture
            </button>
          )}
          {subTab === 'fournisseurs' && (
            <button
              onClick={() => setShowNewFournisseurModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Nouveau Fournisseur
            </button>
          )}
          {subTab === 'beneficiaires' && (
            <button
              onClick={() => setShowNewBenefModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Nouveau Bénéficiaire / Tâcheron
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSubTab('depenses')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${subTab === 'depenses' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Receipt className="w-4 h-4" />
            Dépenses & Factures ({depenses.length})
          </button>
          <button
            onClick={() => setSubTab('fournisseurs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${subTab === 'fournisseurs' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Building className="w-4 h-4" />
            Fournisseurs & Soldes Dus
          </button>
          <button
            onClick={() => setSubTab('beneficiaires')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${subTab === 'beneficiaires' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Users className="w-4 h-4" />
            Bénéficiaires & Tâcherons
          </button>
        </div>

        {subTab === 'depenses' && (
          <div className="flex items-center gap-2 text-xs">
            <select
              value={selectedChantier}
              onChange={(e) => setSelectedChantier(e.target.value)}
              className="py-1.5 px-3 border border-slate-200 rounded-lg bg-white font-medium"
            >
              <option value="">Tous les Chantiers</option>
              {chantiers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={selectedStatut}
              onChange={(e) => setSelectedStatut(e.target.value)}
              className="py-1.5 px-3 border border-slate-200 rounded-lg bg-white font-medium"
            >
              <option value="">Tous les Statuts</option>
              <option value="PAYE">Entièrement Payé</option>
              <option value="PARTIEL">Partiellement Payé</option>
              <option value="NON_PAYE">Non Payé (En Attente)</option>
            </select>
          </div>
        )}
      </div>

      {/* SUB-VIEW 1: DEPENSES */}
      {subTab === 'depenses' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700 uppercase tracking-wider">
            Registre des Dépenses de Chantiers
          </div>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3">Réf. Dépense</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Chantier</th>
                <th className="py-2.5 px-3">Fournisseur / Bénéficiaire</th>
                <th className="py-2.5 px-3">Catégorie</th>
                <th className="py-2.5 px-3">Description & Facture N°</th>
                <th className="py-2.5 px-3 text-right">Montant Total</th>
                <th className="py-2.5 px-3 text-right">Montant Payé</th>
                <th className="py-2.5 px-3 text-center">Statut</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {depenses.map((d) => {
                const isPaid = d.statut_paiement === 'PAYE';
                return (
                  <tr key={d.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{d.reference}</td>
                    <td className="py-2.5 px-3 text-slate-500">{formatDate(d.date)}</td>
                    <td className="py-2.5 px-3 font-semibold text-blue-700">{d.chantier_name}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{d.fournisseur_name || d.beneficiaire_name || '-'}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 font-medium">{d.categorie}</span>
                    </td>
                    <td className="py-2.5 px-3 max-w-[220px] truncate">
                      <div className="truncate font-semibold">{d.description}</div>
                      {d.facture_numero && <div className="text-[10px] text-slate-400 font-mono">Facture: {d.facture_numero}</div>}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatDA(d.montant_total)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-700">{formatDA(d.montant_paye)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isPaid ? 'bg-emerald-100 text-emerald-800' : (d.statut_paiement === 'PARTIEL' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800')
                      }`}>
                        {d.statut_paiement}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {!isPaid && (
                        <button
                          onClick={() => {
                            setReglementModal(d);
                            setReglementForm({
                              montant_verse: d.montant_total - d.montant_paye,
                              caisse_id: caisses[0]?.id || '',
                              mode_reglement: 'ESPECES'
                            });
                          }}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold transition"
                        >
                          Régler Solde
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* SUB-VIEW 2: FOURNISSEURS */}
      {subTab === 'fournisseurs' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700 uppercase tracking-wider">
            Répertoire des Fournisseurs & Soldes Restant Dus
          </div>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3">Code</th>
                <th className="py-2.5 px-3">Raison Sociale</th>
                <th className="py-2.5 px-3">Spécialité / Métier</th>
                <th className="py-2.5 px-3">Wilaya</th>
                <th className="py-2.5 px-3">Téléphone</th>
                <th className="py-2.5 px-3 font-mono">NIF</th>
                <th className="py-2.5 px-3 text-right">Total Facturé (DA)</th>
                <th className="py-2.5 px-3 text-right">Total Réglé (DA)</th>
                <th className="py-2.5 px-3 text-right">Solde Restant Dû</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {fournisseurs.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-500">{f.code}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{f.name}</td>
                  <td className="py-2.5 px-3 text-slate-700">{f.specialite}</td>
                  <td className="py-2.5 px-3 text-slate-600">{f.wilaya}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">{f.phone || '-'}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-400">{f.nif || '-'}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatDA(f.total_achats)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-700">{formatDA(f.total_regle)}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold">
                    <span className={f.solde_restant_du > 0 ? 'text-rose-600' : 'text-slate-400'}>
                      {formatDA(f.solde_restant_du)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SUB-VIEW 3: BENEFICIAIRES */}
      {subTab === 'beneficiaires' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700 uppercase tracking-wider">
            Bénéficiaires des Bons de Caisse & Règlements
          </div>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3">Nom / Raison</th>
                <th className="py-2.5 px-3">Catégorie</th>
                <th className="py-2.5 px-3">Téléphone</th>
                <th className="py-2.5 px-3">Adresse / Wilaya</th>
                <th className="py-2.5 px-3">Spécialité & Notes</th>
                <th className="py-2.5 px-3 text-center">Opérations</th>
                <th className="py-2.5 px-3 text-right">Total Perçu (DA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {beneficiaires.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-3 font-bold text-slate-900">{b.name}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100">{b.type}</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">{b.phone || '-'}</td>
                  <td className="py-2.5 px-3 text-slate-600">{b.address || '-'}</td>
                  <td className="py-2.5 px-3 text-slate-500 max-w-[250px] truncate">{b.notes || '-'}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-blue-700">{b.total_operations}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">{formatDA(b.total_versements)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL REGLEMENT SOLDE DEPENSE */}
      {reglementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">Règlement du Solde Dépense</h3>
            <p className="text-xs text-slate-600 mb-3">
              Règlement de la facture : <strong>{reglementModal.reference}</strong> ({reglementModal.description}).
            </p>
            <form onSubmit={handleConfirmReglement} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Montant à Régler en DA *</label>
                <input
                  type="number"
                  required
                  value={reglementForm.montant_verse}
                  onChange={(e) => setReglementForm({ ...reglementForm, montant_verse: e.target.value })}
                  className="w-full p-2 border rounded-lg font-mono font-bold text-sm"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Caisse ou Banque Débitée *</label>
                <select
                  required
                  value={reglementForm.caisse_id}
                  onChange={(e) => setReglementForm({ ...reglementForm, caisse_id: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-white"
                >
                  {caisses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} [Solde: {formatDA(c.balance)}]</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Mode de Paiement</label>
                <select
                  value={reglementForm.mode_reglement}
                  onChange={(e) => setReglementForm({ ...reglementForm, mode_reglement: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-white"
                >
                  <option value="ESPECES">Espèces (Bon de Décaissement)</option>
                  <option value="CHEQUE">Chèque</option>
                  <option value="VIREMENT">Virement</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setReglementModal(null)} className="px-4 py-2 border rounded-lg font-semibold">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold">Valider Règlement</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
