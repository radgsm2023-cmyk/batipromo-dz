import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Plus, 
  MapPin, 
  Users, 
  Truck, 
  Wallet, 
  Calendar, 
  ArrowRight, 
  Search,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { formatDA, formatDACompact, formatDate, getStatusBadge } from '../utils/formatters';

export default function ChantiersView({ onSelectChantier, onOpenNewChantier }) {
  const [chantiers, setChantiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [wilayaFilter, setWilayaFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getChantiers();
      setChantiers(data);
    } catch (e) {
      console.error('Error fetching chantiers:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredChantiers = chantiers.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                        c.code.toLowerCase().includes(search.toLowerCase()) ||
                        c.wilaya.toLowerCase().includes(search.toLowerCase());
    const matchWilaya = !wilayaFilter || c.wilaya === wilayaFilter;
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchWilaya && matchStatus;
  });

  const uniqueWilayas = [...new Set(chantiers.map((c) => c.wilaya))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gestion des Chantiers & Projets</h1>
          <p className="text-xs text-slate-500">Supervision multi-sites, avancement gros-œuvres, caisses dédiées et ressources</p>
        </div>
        <button
          onClick={onOpenNewChantier}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Nouveau Chantier
        </button>
      </div>

      {/* Filters bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom de résidence, code (CHT-...), wilaya..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={wilayaFilter}
            onChange={(e) => setWilayaFilter(e.target.value)}
            className="text-xs py-1.5 px-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-700"
          >
            <option value="">Toutes les Wilayas</option>
            {uniqueWilayas.map((w) => (
              <option key={w} value={w}>Wilaya de {w}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-1.5 px-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-700"
          >
            <option value="">Toutes les Phases</option>
            <option value="GROS_OEUVRES">Gros Œuvres</option>
            <option value="SECOND_OEUVRE">Second Œuvre</option>
            <option value="FINITIONS">Finitions</option>
            <option value="ETUDE">En Étude / Permis</option>
            <option value="LIVRE">Livré</option>
          </select>
        </div>
      </div>

      {/* Grid of Chantiers */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 font-semibold">Chargement des chantiers...</div>
      ) : filteredChantiers.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
          Aucun chantier ne correspond aux critères de recherche.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredChantiers.map((c) => {
            const badge = getStatusBadge(c.status);
            const pctBudget = c.budget_total ? Math.min(100, Math.round((c.total_depenses / c.budget_total) * 100)) : 0;

            return (
              <div
                key={c.id}
                onClick={() => onSelectChantier(c.id)}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  {/* Top line: Code, Name, Status Badge */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {c.code}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </div>
                      <h2 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition truncate">
                        {c.name}
                      </h2>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Fond de Roulement</span>
                      <span className="text-sm font-extrabold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {formatDA(c.caisse_solde || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Location & Details */}
                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                    <span className="flex items-center gap-1 font-medium text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      {c.wilaya} ({c.commune})
                    </span>
                    <span className="text-slate-400">•</span>
                    <span>{c.type}</span>
                    {c.nombre_unites > 0 && (
                      <>
                        <span className="text-slate-400">•</span>
                        <span>{c.nombre_unites} logements</span>
                      </>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="font-semibold text-slate-700">Avancement Global du Chantier</span>
                      <span className="font-bold font-mono text-blue-600">{c.progress_percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${c.progress_percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Resource Counters & Budget */}
                  <div className="grid grid-cols-3 gap-2 py-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">Budget Prévu :</span>
                      <strong className="text-slate-800 font-mono text-xs">{formatDACompact(c.budget_total)}</strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">Effectif Actif :</span>
                      <strong className="text-slate-800 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-indigo-500" />
                        {c.effectif_count || 0} ouvriers
                      </strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">Engins Affectés :</span>
                      <strong className="text-slate-800 flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-amber-500" />
                        {c.engins_count || 0} machines
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Card footer CTA */}
                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:text-blue-700">
                  <span className="text-[11px] text-slate-400 font-normal">
                    Chef de Chantier : <strong className="text-slate-600">{c.chef_chantier_name || 'Non désigné'}</strong>
                  </span>
                  <div className="flex items-center gap-1">
                    Accéder au dossier chantier
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
