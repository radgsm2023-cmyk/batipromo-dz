import React, { useState, useEffect } from 'react';
import { 
  FileCheck2, 
  Plus, 
  Users, 
  DollarSign, 
  Building, 
  CreditCard, 
  Check, 
  Printer, 
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { formatDA, formatDACompact, formatDate } from '../utils/formatters';

export default function ClientsView({ chantiers = [], caisses = [] }) {
  const [subTab, setSubTab] = useState('ventes'); // 'ventes', 'clients'
  const [ventes, setVentes] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedChantier, setSelectedChantier] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [showNewVenteModal, setShowNewVenteModal] = useState(false);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [reglementVenteModal, setReglementVenteModal] = useState(null);

  // Forms
  const [newClient, setNewClient] = useState({
    nom: '',
    prenom: '',
    nin: '',
    telephone: '',
    email: '',
    adresse: '',
    wilaya: 'Alger',
    profession: ''
  });

  const [newVente, setNewVente] = useState({
    chantier_id: '',
    client_id: '',
    lot_designation: '',
    surface_m2: '',
    prix_total: '',
    montant_verse_initial: '',
    caisse_id: '',
    date_vente: new Date().toISOString().slice(0, 10),
    statut: 'RESERVE'
  });

  const [reglementForm, setReglementForm] = useState({
    montant: '',
    caisse_id: '',
    mode_paiement: 'VIREMENT',
    banque: 'BNA',
    numero_piece: '',
    notes: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      if (subTab === 'ventes') {
        const data = await api.getVentes({ chantier_id: selectedChantier || undefined });
        setVentes(data);
      } else {
        const data = await api.getClients();
        setClients(data);
      }
    } catch (e) {
      console.error('Error loading clients / sales:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [subTab, selectedChantier]);

  const handleCreateClient = async (e) => {
    e.preventDefault();
    try {
      await api.createClient(newClient);
      setShowNewClientModal(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Erreur création client');
    }
  };

  const handleCreateVente = async (e) => {
    e.preventDefault();
    try {
      await api.createVente(newVente);
      setShowNewVenteModal(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Erreur enregistrement vente');
    }
  };

  const handleAddReglement = async (e) => {
    e.preventDefault();
    if (!reglementVenteModal) return;
    try {
      await api.reglementVente(reglementVenteModal.id, reglementForm);
      setReglementVenteModal(null);
      loadData();
    } catch (err) {
      alert(err.message || 'Erreur versement client');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Clients, Ventes & Recouvrements Immobiliers</h1>
          <p className="text-xs text-slate-500">
            Gestion des acquéreurs, contrats de réservation, actes notariés, échéanciers de paiement et encaissements en Dinars Algériens (DA)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewVenteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Nouveau Contrat de Vente
          </button>
          <button
            onClick={() => setShowNewClientModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            <Users className="w-4 h-4" />
            Ficher Acquéreur
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSubTab('ventes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${subTab === 'ventes' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <FileCheck2 className="w-4 h-4" />
            Contrats de Vente & Lots ({ventes.length})
          </button>
          <button
            onClick={() => setSubTab('clients')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${subTab === 'clients' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Users className="w-4 h-4" />
            Répertoire des Acquéreurs ({clients.length})
          </button>
        </div>

        {subTab === 'ventes' && (
          <select
            value={selectedChantier}
            onChange={(e) => setSelectedChantier(e.target.value)}
            className="text-xs py-1.5 px-3 border border-slate-200 rounded-lg bg-white font-medium"
          >
            <option value="">Tous les Chantiers</option>
            {chantiers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* SUB-VIEW 1: VENTES */}
      {subTab === 'ventes' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700 uppercase tracking-wider">
            Suivi des Ventes Immobilières & Échéanciers de Paiement
          </div>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3">Réf. Contrat</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Chantier / Projet</th>
                <th className="py-2.5 px-3">Acquéreur</th>
                <th className="py-2.5 px-3">Désignation du Lot</th>
                <th className="py-2.5 px-3">Surface</th>
                <th className="py-2.5 px-3 text-right">Prix Total (DA)</th>
                <th className="py-2.5 px-3 text-right">Montant Versé</th>
                <th className="py-2.5 px-3 text-right">Reste à Recouvrer</th>
                <th className="py-2.5 px-3 text-center">Statut</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {ventes.map((v) => {
                const pctVerse = Math.round((v.montant_verse / v.prix_total) * 100);
                return (
                  <tr key={v.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{v.reference_contrat}</td>
                    <td className="py-2.5 px-3 text-slate-500">{formatDate(v.date_vente)}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{v.chantier_name}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{v.client_nom} {v.client_prenom}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{v.client_telephone}</div>
                    </td>
                    <td className="py-2.5 px-3 max-w-[200px] truncate">{v.lot_designation}</td>
                    <td className="py-2.5 px-3 font-mono">{v.surface_m2} m²</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatDA(v.prix_total)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-bold">
                      {formatDA(v.montant_verse)}
                      <span className="text-[10px] text-slate-400 font-normal block">({pctVerse}%)</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-rose-700 font-bold">
                      {formatDA(v.reste_a_payer)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                        {v.statut}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {v.reste_a_payer > 0 && (
                        <button
                          onClick={() => {
                            setReglementVenteModal(v);
                            setReglementForm({
                              montant: '',
                              caisse_id: caisses[0]?.id || '',
                              mode_paiement: 'VIREMENT',
                              banque: 'BNA',
                              numero_piece: '',
                              notes: `Versement tranche tranche suivante pour lot ${v.lot_designation}`
                            });
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold transition"
                        >
                          + Encaissement
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

      {/* SUB-VIEW 2: CLIENTS */}
      {subTab === 'clients' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700 uppercase tracking-wider">
            Répertoire des Acquéreurs & Engagements Financiers
          </div>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3">Code Client</th>
                <th className="py-2.5 px-3">Nom & Prénom</th>
                <th className="py-2.5 px-3">NIN / Pièce</th>
                <th className="py-2.5 px-3">Téléphone</th>
                <th className="py-2.5 px-3">Wilaya & Adresse</th>
                <th className="py-2.5 px-3">Profession</th>
                <th className="py-2.5 px-3 text-center">Logements Achetés</th>
                <th className="py-2.5 px-3 text-right">Total Engagements (DA)</th>
                <th className="py-2.5 px-3 text-right">Total Encaissé (DA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-500">{c.code}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{c.nom} {c.prenom}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-400">{c.nin || '-'}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-700">{c.telephone}</td>
                  <td className="py-2.5 px-3 text-slate-600">{c.wilaya} ({c.adresse})</td>
                  <td className="py-2.5 px-3 text-slate-600">{c.profession || '-'}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-blue-700">{c.total_acquisitions}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatDA(c.total_engagements_da)}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">{formatDA(c.total_verse_da)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL ENCAISSEMENT CLIENT */}
      {reglementVenteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">Encaissement Versement Client</h3>
            <p className="text-xs text-slate-600 mb-4">
              Acquéreur : <strong>{reglementVenteModal.client_nom} {reglementVenteModal.client_prenom}</strong><br />
              Lot : <strong>{reglementVenteModal.lot_designation}</strong><br />
              Reste à payer : <strong className="text-rose-600 font-mono">{formatDA(reglementVenteModal.reste_a_payer)}</strong>
            </p>
            <form onSubmit={handleAddReglement} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Montant Encaissé en DA *</label>
                <input
                  type="number"
                  required
                  max={reglementVenteModal.reste_a_payer}
                  value={reglementForm.montant}
                  onChange={(e) => setReglementForm({ ...reglementForm, montant: e.target.value })}
                  placeholder="Ex: 5000000"
                  className="w-full p-2 border rounded-lg font-mono font-bold text-sm"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Caisse ou Compte Bancaire Crédité *</label>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Mode de Paiement</label>
                  <select
                    value={reglementForm.mode_paiement}
                    onChange={(e) => setReglementForm({ ...reglementForm, mode_paiement: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-white"
                  >
                    <option value="VIREMENT">Virement Bancaire</option>
                    <option value="CHEQUE">Chèque</option>
                    <option value="ESPECES">Espèces (Reçu de Caisse)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Banque Client</label>
                  <input
                    type="text"
                    value={reglementForm.banque}
                    onChange={(e) => setReglementForm({ ...reglementForm, banque: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                    placeholder="Ex: BNA / BEA / CPA"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">N° Chèque / Référence Virement</label>
                <input
                  type="text"
                  value={reglementForm.numero_piece}
                  onChange={(e) => setReglementForm({ ...reglementForm, numero_piece: e.target.value })}
                  className="w-full p-2 border rounded-lg font-mono"
                  placeholder="Ex: VIR-BNA-99238"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setReglementVenteModal(null)} className="px-4 py-2 border rounded-lg font-semibold">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold">Enregistrer Versement</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
