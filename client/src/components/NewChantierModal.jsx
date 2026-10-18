import React, { useState } from 'react';
import { X, Building, Check, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function NewChantierModal({ users = [], onClose, onSuccess }) {
  const [code, setCode] = useState(`CHT-0${Math.floor(5 + Math.random() * 5)}-ALG`);
  const [name, setName] = useState('');
  const [type, setType] = useState('Promotionnel Haut Standing');
  const [wilaya, setWilaya] = useState('Alger');
  const [commune, setCommune] = useState('');
  const [address, setAddress] = useState('');
  const [budgetTotal, setBudgetTotal] = useState('');
  const [initialCaisseFond, setInitialCaisseFond] = useState('500000');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDatePlanned, setEndDatePlanned] = useState('2027-12-31');
  const [surfaceTotale, setSurfaceTotale] = useState('');
  const [nombreUnites, setNombreUnites] = useState('');
  const [chefChantierId, setChefChantierId] = useState('');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !wilaya || !budgetTotal) {
      setError('Veuillez remplir les champs obligatoires (Nom, Wilaya, Budget)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.createChantier({
        code,
        name,
        type,
        wilaya,
        commune,
        address,
        status: 'GROS_OEUVRES',
        start_date: startDate,
        end_date_planned: endDatePlanned,
        budget_total: Number(budgetTotal),
        progress_percentage: 10,
        surface_totale_m2: Number(surfaceTotale) || 0,
        nombre_unites: Number(nombreUnites) || 0,
        chef_chantier_id: chefChantierId || null,
        description,
        initial_caisse_fond: Number(initialCaisseFond) || 0
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Erreur lors de la création du chantier');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-400" />
            <h2 className="font-bold text-sm sm:text-base">Nouveau Chantier & Caisse Dédiée</h2>
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
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Code Chantier *</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="w-full text-xs font-mono font-bold p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nom du Projet Immobilier *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Résidence Les Orangers"
                required
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Type de Projet</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Promotionnel Haut Standing">Promotionnel Haut Standing</option>
                <option value="Logements Promotionnels Libres (LPL)">Logements Promotionnels Libres (LPL)</option>
                <option value="Semi-Collectif">Semi-Collectif</option>
                <option value="Centre Commercial & Bureaux">Centre Commercial & Bureaux</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Wilaya *</label>
              <select
                value={wilaya}
                onChange={(e) => setWilaya(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Alger">Alger</option>
                <option value="Oran">Oran</option>
                <option value="Constantine">Constantine</option>
                <option value="Annaba">Annaba</option>
                <option value="Sétif">Sétif</option>
                <option value="Blida">Blida</option>
                <option value="Béjaïa">Béjaïa</option>
                <option value="Tlemcen">Tlemcen</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Commune / Quartier</label>
              <input
                type="text"
                value={commune}
                onChange={(e) => setCommune(e.target.value)}
                placeholder="Ex: Bab Ezzouar"
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Budget Total Prévisionnel (DA) *</label>
              <input
                type="number"
                step="500000"
                value={budgetTotal}
                onChange={(e) => setBudgetTotal(e.target.value)}
                placeholder="Ex: 650000000"
                required
                className="w-full text-xs font-mono font-bold p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Fond de Roulement Initial Caisse (DA)</label>
              <input
                type="number"
                step="50000"
                value={initialCaisseFond}
                onChange={(e) => setInitialCaisseFond(e.target.value)}
                placeholder="Ex: 500000"
                className="w-full text-xs font-mono font-bold p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-emerald-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date Démarrage Chantier</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date Fin Prévisionnelle</label>
              <input
                type="date"
                value={endDatePlanned}
                onChange={(e) => setEndDatePlanned(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Surface Totale (m²)</label>
              <input
                type="number"
                value={surfaceTotale}
                onChange={(e) => setSurfaceTotale(e.target.value)}
                placeholder="Ex: 5200"
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre d'Unités / Lots</label>
              <input
                type="number"
                value={nombreUnites}
                onChange={(e) => setNombreUnites(e.target.value)}
                placeholder="Ex: 32"
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Conducteur / Chef Projet</label>
              <select
                value={chefChantierId}
                onChange={(e) => setChefChantierId(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Sélectionner...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description & Caractéristiques du Projet</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Immeuble R+8 avec sous-sol parking, appartements F3/F4..."
              rows={2}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition"
            >
              <Check className="w-4 h-4" />
              {loading ? 'Création...' : 'Créer Chantier & Caisse'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
