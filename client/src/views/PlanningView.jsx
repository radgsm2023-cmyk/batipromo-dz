import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, 
  Building, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  Sliders, 
  Trash2, 
  Edit3, 
  HardHat, 
  Layers, 
  Filter,
  RefreshCw,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { formatDate, formatDACompact, getStatusBadge } from '../utils/formatters';

export default function PlanningView({ chantiers = [], onSelectChantier }) {
  const [selectedChantierId, setSelectedChantierId] = useState('');
  const [phases, setPhases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPhase, setEditingPhase] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    chantier_id: '',
    phase_nom: '',
    ordre: 1,
    date_debut_prevue: new Date().toISOString().slice(0, 10),
    date_fin_prevue: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    progress_pct: 0,
    statut: 'A_VENIR',
    responsable: '',
    budget_alloue: 0,
    notes: ''
  });

  const loadPlanning = async () => {
    setLoading(true);
    try {
      const data = await api.getPlanning({ chantier_id: selectedChantierId || undefined });
      setPhases(data);
    } catch (err) {
      console.error('Erreur chargement planning:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chantiers.length > 0 && !selectedChantierId) {
      setSelectedChantierId(chantiers[0].id.toString());
    }
  }, [chantiers]);

  useEffect(() => {
    if (selectedChantierId) {
      loadPlanning();
    }
  }, [selectedChantierId]);

  const handleUpdateProgress = async (phase, newPct) => {
    try {
      const num = Math.min(100, Math.max(0, Number(newPct)));
      await api.updatePlanningPhase(phase.id, { progress_pct: num });
      setPhases(prev => prev.map(p => p.id === phase.id ? { 
        ...p, 
        progress_pct: num,
        statut: num >= 100 ? 'TERMINE' : (num > 0 ? 'EN_COURS' : 'A_VENIR')
      } : p));
    } catch (err) {
      console.error('Erreur mise à jour avancement:', err);
    }
  };

  const handleSavePhase = async (e) => {
    e.preventDefault();
    try {
      if (editingPhase) {
        await api.updatePlanningPhase(editingPhase.id, formData);
      } else {
        await api.createPlanningPhase({
          ...formData,
          chantier_id: Number(formData.chantier_id || selectedChantierId)
        });
      }
      setShowAddModal(false);
      setEditingPhase(null);
      loadPlanning();
    } catch (err) {
      alert(err.message || 'Erreur enregistrement de la phase');
    }
  };

  const handleDeletePhase = async (id) => {
    if (!window.confirm('Confirmez-vous la suppression de cette phase du planning ?')) return;
    try {
      await api.deletePlanningPhase(id);
      setPhases(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  };

  const selectedChantier = chantiers.find(c => c.id.toString() === selectedChantierId);
  const totalPhases = phases.length;
  const completedPhases = phases.filter(p => p.progress_pct >= 100).length;
  const inProgressPhases = phases.filter(p => p.progress_pct > 0 && p.progress_pct < 100).length;
  const overallProgress = totalPhases > 0 ? Math.round(phases.reduce((acc, p) => acc + (p.progress_pct || 0), 0) / totalPhases) : 0;

  return (
    <div className="space-y-6">
      {/* ── Top Header & Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-blue-600" />
            <span>Planning & Jalons des Chantiers</span>
          </h1>
          <p className="text-xs text-slate-500">
            Suivi des phases de construction, calendrier d'exécution et jalons critiques
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Chantier Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-xl border border-slate-300 text-xs shadow-xs">
            <Building className="w-4 h-4 text-blue-600" />
            <select
              value={selectedChantierId}
              onChange={(e) => setSelectedChantierId(e.target.value)}
              className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer text-xs"
            >
              {chantiers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setEditingPhase(null);
              setFormData({
                chantier_id: selectedChantierId,
                phase_nom: '',
                ordre: phases.length + 1,
                date_debut_prevue: new Date().toISOString().slice(0, 10),
                date_fin_prevue: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
                progress_pct: 0,
                statut: 'A_VENIR',
                responsable: '',
                budget_alloue: 0,
                notes: ''
              });
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Phase</span>
          </button>
        </div>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Avancement Global</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-600 font-mono">{overallProgress}%</span>
            <span className="text-xs text-slate-500">des phases</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
            <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${overallProgress}%` }}></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Phases Clôturées</span>
          <div className="text-2xl font-black text-emerald-600 font-mono">
            {completedPhases} / {totalPhases}
          </div>
          <span className="text-[11px] text-emerald-700 font-medium">Livrées & réceptionnées</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">En Cours d'Exécution</span>
          <div className="text-2xl font-black text-amber-600 font-mono">{inProgressPhases}</div>
          <span className="text-[11px] text-amber-700 font-medium">Chantier actif</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Livraison Prévue</span>
          <div className="text-sm font-extrabold text-slate-900 truncate">
            {selectedChantier ? formatDate(selectedChantier.end_date_planned) : '-'}
          </div>
          <span className="text-[11px] text-slate-500 font-mono">{selectedChantier?.wilaya}</span>
        </div>
      </div>

      {/* ── Main Gantt Timeline & Phase Cards ── */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Chronogramme & Phases des Travaux</h2>
            <p className="text-[11px] text-slate-500">Mettez à jour directement l'avancement pourcentage de chaque phase</p>
          </div>
          <button 
            onClick={loadPlanning}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
            title="Rafraîchir"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs">Chargement du planning...</div>
        ) : phases.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">Aucune phase configurée pour ce chantier.</div>
        ) : (
          <div className="space-y-3">
            {phases.map((phase) => {
              const isDone = phase.progress_pct >= 100;
              const isOngoing = phase.progress_pct > 0 && phase.progress_pct < 100;

              return (
                <div 
                  key={phase.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                    isDone 
                      ? 'bg-emerald-50/40 border-emerald-200' 
                      : (isOngoing ? 'bg-white border-blue-200 shadow-xs' : 'bg-slate-50/70 border-slate-200 opacity-80')
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                        isDone 
                          ? 'bg-emerald-600 text-white' 
                          : (isOngoing ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600')
                      }`}>
                        {phase.ordre}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                          {phase.phase_nom}
                        </h3>
                        <p className="text-[10px] text-slate-500 font-mono">
                          Du {formatDate(phase.date_debut_prevue)} au {formatDate(phase.date_fin_prevue)}
                          {phase.responsable && ` • Resp: ${phase.responsable}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isDone 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                          : (isOngoing ? 'bg-blue-100 text-blue-800 border border-blue-300' : 'bg-slate-100 text-slate-600')
                      }`}>
                        {isDone ? 'Terminé' : (isOngoing ? 'En Cours' : 'À Venir')}
                      </span>

                      <button
                        onClick={() => {
                          setEditingPhase(phase);
                          setFormData({
                            chantier_id: phase.chantier_id,
                            phase_nom: phase.phase_nom,
                            ordre: phase.ordre,
                            date_debut_prevue: phase.date_debut_prevue,
                            date_fin_prevue: phase.date_fin_prevue,
                            progress_pct: phase.progress_pct,
                            statut: phase.statut,
                            responsable: phase.responsable || '',
                            budget_alloue: phase.budget_alloue || 0,
                            notes: phase.notes || ''
                          });
                          setShowAddModal(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition"
                        title="Modifier la phase"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeletePhase(phase.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition"
                        title="Supprimer la phase"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Slider + Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Avancement physique :</span>
                      <span className="font-mono font-bold text-slate-800">{phase.progress_pct}%</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-slate-200 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className={`h-2.5 rounded-full transition-all duration-300 ${
                            isDone ? 'bg-emerald-500' : (isOngoing ? 'bg-blue-600' : 'bg-slate-400')
                          }`}
                          style={{ width: `${phase.progress_pct}%` }}
                        />
                      </div>

                      {/* Quick percentage buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        {[0, 25, 50, 75, 100].map(pct => (
                          <button
                            key={pct}
                            onClick={() => handleUpdateProgress(phase, pct)}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition ${
                              phase.progress_pct === pct 
                                ? 'bg-slate-900 text-white' 
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>

                    {phase.notes && (
                      <p className="text-[10px] text-slate-500 italic mt-1 bg-white/60 p-1.5 rounded-lg border border-slate-100">
                        {phase.notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add / Edit Phase Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                {editingPhase ? 'Modifier la Phase de Travaux' : 'Ajouter une Phase au Planning'}
              </h2>
              <button 
                onClick={() => { setShowAddModal(false); setEditingPhase(null); }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePhase} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chantier Associé *</label>
                <select
                  disabled={!!editingPhase}
                  value={formData.chantier_id}
                  onChange={(e) => setFormData({ ...formData, chantier_id: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold"
                >
                  {chantiers.map((c) => (
                    <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-3">
                  <label className="block font-semibold text-slate-700 mb-1">Désignation de la Phase *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Fondations, Gros Œuvre R+4..."
                    value={formData.phase_nom}
                    onChange={(e) => setFormData({ ...formData, phase_nom: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ordre</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.ordre}
                    onChange={(e) => setFormData({ ...formData, ordre: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date Début Prévue *</label>
                  <input
                    type="date"
                    required
                    value={formData.date_debut_prevue}
                    onChange={(e) => setFormData({ ...formData, date_debut_prevue: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date Fin Prévue *</label>
                  <input
                    type="date"
                    required
                    value={formData.date_fin_prevue}
                    onChange={(e) => setFormData({ ...formData, date_fin_prevue: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Avancement (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.progress_pct}
                    onChange={(e) => setFormData({ ...formData, progress_pct: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Responsable / Conducteur</label>
                  <input
                    type="text"
                    placeholder="Ex: Ing. Amine"
                    value={formData.responsable}
                    onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observations / Spécifications</label>
                <textarea
                  rows={2}
                  placeholder="Notes techniques, matériaux ou contraintes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingPhase(null); }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-xs"
                >
                  {editingPhase ? 'Mettre à jour' : 'Enregistrer la Phase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
