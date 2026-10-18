import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Plus, 
  Fuel, 
  Wrench, 
  Building, 
  Calendar, 
  Check, 
  Clock, 
  AlertTriangle, 
  ArrowRight,
  ShieldCheck,
  Search,
  Filter,
  Users
} from 'lucide-react';
import { api } from '../services/api';
import { formatDA, formatDACompact, formatDate } from '../utils/formatters';

export default function MaterielView({ chantiers = [], caisses = [], employees = [] }) {
  const [subTab, setSubTab] = useState('parc'); // 'parc', 'affectations', 'carburant'
  const [materiels, setMateriels] = useState([]);
  const [affectations, setAffectations] = useState([]);
  const [consommations, setConsommations] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [typeProprieteFilter, setTypeProprieteFilter] = useState('');
  const [selectedChantier, setSelectedChantier] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [showNewModal, setShowNewModal] = useState(false);
  const [showAffectModal, setShowAffectModal] = useState(false);
  const [showConsoModal, setShowConsoModal] = useState(false);

  // Form states
  const [newMat, setNewMat] = useState({
    nom: '',
    categorie: 'ENGIN_LOURD',
    type_propriete: 'INTERNE',
    cout_location_jour: '',
    cout_location_mois: '',
    valeur_acquisition: '',
    chantier_actuel_id: '',
    compteur_heures_km: '',
    immatriculation_serie: '',
    notes: ''
  });

  const [affectForm, setAffectForm] = useState({
    materiel_id: '',
    chantier_id: '',
    date_debut: new Date().toISOString().slice(0, 10),
    date_fin_prevue: '',
    operateur_id: '',
    cout_impute: '',
    notes: ''
  });

  const [consoForm, setConsoForm] = useState({
    materiel_id: '',
    chantier_id: '',
    date: new Date().toISOString().slice(0, 10),
    type: 'CARBURANT_GASOIL',
    quantite_litres: '',
    montant_total: '',
    caisse_id: '',
    compteur_heures_km: '',
    notes: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      if (subTab === 'parc') {
        const data = await api.getMateriel({
          type_propriete: typeProprieteFilter || undefined,
          chantier_id: selectedChantier || undefined,
          search: search || undefined
        });
        setMateriels(data);
      } else if (subTab === 'affectations') {
        const data = await api.getAffectationsMateriel({
          chantier_id: selectedChantier || undefined
        });
        setAffectations(data);
      } else if (subTab === 'carburant') {
        const data = await api.getConsommations({
          chantier_id: selectedChantier || undefined
        });
        setConsommations(data);
      }
    } catch (e) {
      console.error('Error loading materiel data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [subTab, typeProprieteFilter, selectedChantier, search]);

  const handleCreateMateriel = async (e) => {
    e.preventDefault();
    try {
      await api.createMateriel(newMat);
      setShowNewModal(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Erreur création matériel');
    }
  };

  const handleCreateAffectation = async (e) => {
    e.preventDefault();
    try {
      await api.createAffectationMateriel(affectForm);
      setShowAffectModal(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Erreur affectation matériel');
    }
  };

  const handleLibererMateriel = async (affId) => {
    if (!confirm('Libérer cet équipement et le remettre en parc disponible ?')) return;
    try {
      await api.libererMateriel(affId, { date_fin_reelle: new Date().toISOString().slice(0, 10) });
      loadData();
    } catch (err) {
      alert(err.message || 'Erreur libération');
    }
  };

  const handleCreateConso = async (e) => {
    e.preventDefault();
    try {
      await api.createConsommation(consoForm);
      setShowConsoModal(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Erreur enregistrement carburant');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Parc Matériel, Engins & Location</h1>
          <p className="text-xs text-slate-500">
            Gestion du parc interne & engins loués, affectation aux chantiers, consommation carburant (Gasoil) et entretien
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConsoModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            <Fuel className="w-4 h-4" />
            Plein Gasoil / Entretien
          </button>
          <button
            onClick={() => setShowAffectModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            <Truck className="w-4 h-4" />
            Affecter Engin au Chantier
          </button>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Nouvel Engin / Contrat Location
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSubTab('parc')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${subTab === 'parc' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Truck className="w-4 h-4" />
            Parc & Équipements ({materiels.length})
          </button>
          <button
            onClick={() => setSubTab('affectations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${subTab === 'affectations' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Building className="w-4 h-4" />
            Affectations Chantiers
          </button>
          <button
            onClick={() => setSubTab('carburant')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${subTab === 'carburant' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Fuel className="w-4 h-4" />
            Gasoil & Maintenance
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 text-xs">
          {subTab === 'parc' && (
            <select
              value={typeProprieteFilter}
              onChange={(e) => setTypeProprieteFilter(e.target.value)}
              className="py-1.5 px-3 border border-slate-200 rounded-lg bg-white font-medium"
            >
              <option value="">Tous (Interne & Location)</option>
              <option value="INTERNE">Parc Interne (Propriété)</option>
              <option value="LOCATION">Matériel en Location</option>
            </select>
          )}

          <select
            value={selectedChantier}
            onChange={(e) => setSelectedChantier(e.target.value)}
            className="py-1.5 px-3 border border-slate-200 rounded-lg bg-white font-medium"
          >
            <option value="">Tous les Chantiers</option>
            {chantiers.map((c) => (
              <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* SUB-VIEW 1: PARC MATERIEL */}
      {subTab === 'parc' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700 uppercase tracking-wider">
            Inventaire du Parc Matériel & Contrats de Location
          </div>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3">Code Parc</th>
                <th className="py-2.5 px-3">Désignation de l'Engin</th>
                <th className="py-2.5 px-3">Catégorie</th>
                <th className="py-2.5 px-3">Type Propriété</th>
                <th className="py-2.5 px-3">Chantier Actuel</th>
                <th className="py-2.5 px-3">Opérateur / Chauffeur</th>
                <th className="py-2.5 px-3">Coût Location / Valeur</th>
                <th className="py-2.5 px-3">Compteur (H / Km)</th>
                <th className="py-2.5 px-3 text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {materiels.map((m) => {
                const isLocation = m.type_propriete === 'LOCATION';
                const isDispo = m.statut === 'DISPONIBLE';

                return (
                  <tr key={m.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-500">{m.code_parc}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{m.nom}</div>
                      {m.immatriculation_serie && (
                        <div className="text-[10px] text-slate-400 font-mono">Immat/Série: {m.immatriculation_serie}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{m.categorie}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isLocation ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-indigo-100 text-indigo-800 border border-indigo-300'}`}>
                        {isLocation ? 'LOCATION' : 'INTERNE'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {m.chantier_actuel_name ? (
                        <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {m.chantier_actuel_name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Dépôt Central / Libre</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-700">
                      {m.operateur_actuel || '-'}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold">
                      {isLocation ? (
                        m.cout_location_jour > 0 ? `${formatDA(m.cout_location_jour)}/j` : `${formatDA(m.cout_location_mois)}/mois`
                      ) : (
                        <span className="text-slate-600">{formatDACompact(m.valeur_acquisition)}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono">{m.compteur_heures_km || 0} h</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.statut === 'AFFECTE_CHANTIER' ? 'bg-emerald-100 text-emerald-800' : (isDispo ? 'bg-slate-100 text-slate-700' : 'bg-rose-100 text-rose-800')
                      }`}>
                        {m.statut}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* SUB-VIEW 2: AFFECTATIONS */}
      {subTab === 'affectations' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700 uppercase tracking-wider">
            Affectations en Cours et Historiques des Engins
          </div>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3">Code / Engin</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Chantier Affecté</th>
                <th className="py-2.5 px-3">Opérateur / Chauffeur</th>
                <th className="py-2.5 px-3">Date Début</th>
                <th className="py-2.5 px-3">Date Fin Prévue</th>
                <th className="py-2.5 px-3">Coût Imputé</th>
                <th className="py-2.5 px-3 text-center">Statut</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {affectations.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-slate-900">{a.materiel_nom}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{a.code_parc}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100">{a.type_propriete}</span>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-blue-700">{a.chantier_name}</td>
                  <td className="py-2.5 px-3">{a.operateur_name || '-'}</td>
                  <td className="py-2.5 px-3 text-slate-500">{formatDate(a.date_debut)}</td>
                  <td className="py-2.5 px-3 text-slate-500">{a.date_fin_prevue ? formatDate(a.date_fin_prevue) : 'Indéterminée'}</td>
                  <td className="py-2.5 px-3 font-mono">{formatDA(a.cout_impute)}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${a.statut === 'ACTIF' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                      {a.statut}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {a.statut === 'ACTIF' && (
                      <button
                        onClick={() => handleLibererMateriel(a.id)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 rounded text-[11px] font-semibold transition"
                      >
                        Libérer Engin
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SUB-VIEW 3: CARBURANT & MAINTENANCE */}
      {subTab === 'carburant' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700 uppercase tracking-wider">
            Historique des Consommations de Gasoil & Entretiens Engins
          </div>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Engin Concerné</th>
                <th className="py-2.5 px-3">Chantier</th>
                <th className="py-2.5 px-3">Nature de l'Opération</th>
                <th className="py-2.5 px-3">Quantité (Litres)</th>
                <th className="py-2.5 px-3">Compteur (Heures)</th>
                <th className="py-2.5 px-3">Fournisseur</th>
                <th className="py-2.5 px-3 text-right">Montant Total (DA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {consommations.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-3 text-slate-500">{formatDate(c.date)}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{c.materiel_nom}</td>
                  <td className="py-2.5 px-3 text-slate-700">{c.chantier_name}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800">
                      {c.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                    {c.quantite_litres > 0 ? `${c.quantite_litres} L` : '-'}
                  </td>
                  <td className="py-2.5 px-3 font-mono">{c.compteur_heures_km || '-'} h</td>
                  <td className="py-2.5 px-3">{c.fournisseur_nom || 'Naftal'}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700">
                    {formatDA(c.montant_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL 1: NEW MATERIEL */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-xl w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-3">Ajouter un Engin ou Matériel (Interne / Loué)</h3>
            <form onSubmit={handleCreateMateriel} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Nom / Modèle de l'Équipement *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Grue à tour Potain 45m"
                    value={newMat.nom}
                    onChange={(e) => setNewMat({ ...newMat, nom: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Type de Propriété *</label>
                  <select
                    value={newMat.type_propriete}
                    onChange={(e) => setNewMat({ ...newMat, type_propriete: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-white"
                  >
                    <option value="INTERNE">Parc Interne (Propriété Promoteur)</option>
                    <option value="LOCATION">Matériel en Location (Prestataire)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Catégorie</label>
                  <select
                    value={newMat.categorie}
                    onChange={(e) => setNewMat({ ...newMat, categorie: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-white"
                  >
                    <option value="ENGIN_LOURD">Engin Lourd (Grue, Pompe)</option>
                    <option value="ENGIN_TERRASSEMENT">Terrassement (Pelle, Rétrochargeuse)</option>
                    <option value="VEHICULE_TRANSPORT">Transport (Camion benne, Fardier)</option>
                    <option value="PETIT_MATERIEL">Petit Matériel & Énergie (Groupe, Bétonnière)</option>
                    <option value="ECHAFAUDAGE">Échafaudages & Sécurité</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">N° Immatriculation / Série</label>
                  <input
                    type="text"
                    placeholder="Ex: 00123-116-16"
                    value={newMat.immatriculation_serie}
                    onChange={(e) => setNewMat({ ...newMat, immatriculation_serie: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>

              {newMat.type_propriete === 'LOCATION' ? (
                <div className="grid grid-cols-2 gap-3 bg-amber-50/50 p-3 rounded-lg border border-amber-200">
                  <div>
                    <label className="block font-semibold mb-1">Coût Location par Jour (DA)</label>
                    <input
                      type="number"
                      placeholder="Ex: 15000"
                      value={newMat.cout_location_jour}
                      onChange={(e) => setNewMat({ ...newMat, cout_location_jour: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Coût Location par Mois (DA)</label>
                    <input
                      type="number"
                      placeholder="Ex: 350000"
                      value={newMat.cout_location_mois}
                      onChange={(e) => setNewMat({ ...newMat, cout_location_mois: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block font-semibold mb-1">Valeur d'Acquisition Initiale (DA)</label>
                  <input
                    type="number"
                    placeholder="Ex: 18000000"
                    value={newMat.valeur_acquisition}
                    onChange={(e) => setNewMat({ ...newMat, valeur_acquisition: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Affecter Directement à un Chantier</label>
                  <select
                    value={newMat.chantier_actuel_id}
                    onChange={(e) => setNewMat({ ...newMat, chantier_actuel_id: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-white"
                  >
                    <option value="">Laisser en parc disponible...</option>
                    {chantiers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Compteur Initial (Heures / Km)</label>
                  <input
                    type="number"
                    value={newMat.compteur_heures_km}
                    onChange={(e) => setNewMat({ ...newMat, compteur_heures_km: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowNewModal(false)} className="px-4 py-2 border rounded-lg font-semibold">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold">Enregistrer Matériel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: AFFECTATION MATERIEL */}
      {showAffectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-3">Affecter un Engin à un Chantier</h3>
            <form onSubmit={handleCreateAffectation} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Sélectionner le Matériel *</label>
                <select
                  required
                  value={affectForm.materiel_id}
                  onChange={(e) => setAffectForm({ ...affectForm, materiel_id: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-white"
                >
                  <option value="">Choisir un équipement...</option>
                  {materiels.map((m) => (
                    <option key={m.id} value={m.id}>{m.code_parc} - {m.nom} ({m.type_propriete})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Chantier Destination *</label>
                <select
                  required
                  value={affectForm.chantier_id}
                  onChange={(e) => setAffectForm({ ...affectForm, chantier_id: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-white"
                >
                  <option value="">Choisir chantier...</option>
                  {chantiers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.wilaya})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Date Début *</label>
                  <input
                    type="date"
                    required
                    value={affectForm.date_debut}
                    onChange={(e) => setAffectForm({ ...affectForm, date_debut: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Date Fin Prévue</label>
                  <input
                    type="date"
                    value={affectForm.date_fin_prevue}
                    onChange={(e) => setAffectForm({ ...affectForm, date_fin_prevue: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Opérateur / Chauffeur Dédié</label>
                  <select
                    value={affectForm.operateur_id}
                    onChange={(e) => setAffectForm({ ...affectForm, operateur_id: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-white"
                  >
                    <option value="">Sélectionner conducteur...</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.nom} {emp.prenom} ({emp.poste})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Coût Journalier Imputé (DA)</label>
                  <input
                    type="number"
                    value={affectForm.cout_impute}
                    onChange={(e) => setAffectForm({ ...affectForm, cout_impute: e.target.value })}
                    className="w-full p-2 border rounded-lg font-mono"
                    placeholder="Ex: 12000"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowAffectModal(false)} className="px-4 py-2 border rounded-lg font-semibold">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold">Valider Affectation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CONSO CARBURANT / MAINTENANCE */}
      {showConsoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-3">Saisie Carburant Gasoil / Maintenance</h3>
            <form onSubmit={handleCreateConso} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Matériel / Engin *</label>
                  <select
                    required
                    value={consoForm.materiel_id}
                    onChange={(e) => setConsoForm({ ...consoForm, materiel_id: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-white"
                  >
                    <option value="">Sélectionner engin...</option>
                    {materiels.map((m) => (
                      <option key={m.id} value={m.id}>{m.nom} ({m.code_parc})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Chantier d'Imputation *</label>
                  <select
                    required
                    value={consoForm.chantier_id}
                    onChange={(e) => setConsoForm({ ...consoForm, chantier_id: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-white"
                  >
                    <option value="">Sélectionner chantier...</option>
                    {chantiers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Nature de la Dépense</label>
                  <select
                    value={consoForm.type}
                    onChange={(e) => setConsoForm({ ...consoForm, type: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-white"
                  >
                    <option value="CARBURANT_GASOIL">Carburant Gasoil</option>
                    <option value="VIDANGE_LUBRIFIANT">Vidange & Filtres</option>
                    <option value="REPARATION">Réparation & Pièces</option>
                    <option value="ENTRETIEN">Entretien Préventif</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Quantité (Litres)</label>
                  <input
                    type="number"
                    value={consoForm.quantite_litres}
                    onChange={(e) => setConsoForm({ ...consoForm, quantite_litres: e.target.value })}
                    placeholder="Ex: 500"
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Montant Total TTC (DA) *</label>
                  <input
                    type="number"
                    required
                    value={consoForm.montant_total}
                    onChange={(e) => setConsoForm({ ...consoForm, montant_total: e.target.value })}
                    placeholder="Ex: 14500"
                    className="w-full p-2 border rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Débiter la Caisse FDR</label>
                  <select
                    value={consoForm.caisse_id}
                    onChange={(e) => setConsoForm({ ...consoForm, caisse_id: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-white"
                  >
                    <option value="">Ne pas débiter immédiatement...</option>
                    {caisses.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} [Solde: {formatDA(c.balance)}]</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Observations / Numéro Facture</label>
                <input
                  type="text"
                  placeholder="Ex: Facture Naftal N°498"
                  value={consoForm.notes}
                  onChange={(e) => setConsoForm({ ...consoForm, notes: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowConsoModal(false)} className="px-4 py-2 border rounded-lg font-semibold">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold">Enregistrer Dépense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
