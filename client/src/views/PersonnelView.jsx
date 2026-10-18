import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  CalendarCheck, 
  FileText, 
  Check, 
  Clock, 
  Printer, 
  CreditCard, 
  AlertCircle, 
  Building,
  UserCheck,
  Search,
  CheckCircle2,
  XCircle,
  Coins
} from 'lucide-react';
import { api } from '../services/api';
import { formatDA, formatDACompact, formatDate } from '../utils/formatters';

export default function PersonnelView({ chantiers = [], caisses = [], onOpenPrintPaie }) {
  const [subTab, setSubTab] = useState('employees'); // 'employees', 'affectations', 'pointages', 'paies'
  const [employees, setEmployees] = useState([]);
  const [affectations, setAffectations] = useState([]);
  const [pointages, setPointages] = useState([]);
  const [paies, setPaies] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedChantier, setSelectedChantier] = useState('');
  const [search, setSearch] = useState('');
  const [pointageDate, setPointageDate] = useState(new Date().toISOString().slice(0, 10));
  const [paieMois, setPaieMois] = useState('2026-10');

  // Modals state
  const [showNewEmpModal, setShowNewEmpModal] = useState(false);
  const [showNewAffectModal, setShowNewAffectModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(null); // paie object to pay

  const loadAll = async () => {
    setLoading(true);
    try {
      if (subTab === 'employees') {
        const data = await api.getEmployees({ chantier_id: selectedChantier || undefined, search: search || undefined });
        setEmployees(data);
      } else if (subTab === 'affectations') {
        const data = await api.getAffectationsPersonnel({ chantier_id: selectedChantier || undefined });
        setAffectations(data);
      } else if (subTab === 'pointages') {
        const data = await api.getPointages({ chantier_id: selectedChantier || undefined, date: pointageDate });
        setPointages(data);
      } else if (subTab === 'paies') {
        const data = await api.getPaies({ mois_annee: paieMois, chantier_id: selectedChantier || undefined });
        setPaies(data);
      }
    } catch (e) {
      console.error('Error loading personnel data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [subTab, selectedChantier, search, pointageDate, paieMois]);

  // Handle saving attendance row
  const handleSavePointage = async (empId, statut, heuresNormales = 8, heuresSup = 0) => {
    try {
      const targetCht = selectedChantier || employees.find(e => e.id === empId)?.chantier_actuel_id || chantiers[0]?.id;
      await api.savePointage({
        employee_id: empId,
        chantier_id: targetCht,
        date: pointageDate,
        statut,
        heures_normales: heuresNormales,
        heures_sup: heuresSup
      });
      loadAll();
    } catch (e) {
      alert(e.message || 'Erreur pointage');
    }
  };

  // Generate monthly payroll
  const handleGeneratePaie = async () => {
    if (!confirm(`Générer automatiquement les fiches de paie pour le mois ${paieMois} ?`)) return;
    try {
      const res = await api.generatePaies({ mois_annee: paieMois, chantier_id: selectedChantier || null });
      alert(res.message);
      loadAll();
    } catch (e) {
      alert(e.message || 'Erreur génération paie');
    }
  };

  // Pay slip
  const handleConfirmPaiementPaie = async (caisseId) => {
    if (!showPayModal) return;
    try {
      await api.payerPaie(showPayModal.id, { caisse_id: caisseId, mode_paiement: 'ESPECES' });
      setShowPayModal(null);
      loadAll();
    } catch (e) {
      alert(e.message || 'Erreur paiement');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gestion du Personnel, Paie & Affectations</h1>
          <p className="text-xs text-slate-500">
            Suivi des salariés, journaliers/tâcherons, pointages de chantier, calcul et édition des bulletins de salaire en Dinars Algériens (DA)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {subTab === 'employees' && (
            <button
              onClick={() => setShowNewEmpModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Nouvel Employé / Ouvrier
            </button>
          )}
          {subTab === 'affectations' && (
            <button
              onClick={() => setShowNewAffectModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Affecter au Chantier
            </button>
          )}
          {subTab === 'paies' && (
            <button
              onClick={handleGeneratePaie}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-sm transition"
            >
              <Coins className="w-4 h-4" />
              Générer la Paie ({paieMois})
            </button>
          )}
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSubTab('employees')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${subTab === 'employees' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Users className="w-4 h-4" />
            Répertoire Personnel ({employees.length})
          </button>
          <button
            onClick={() => setSubTab('affectations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${subTab === 'affectations' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Building className="w-4 h-4" />
            Affectations Chantiers
          </button>
          <button
            onClick={() => setSubTab('pointages')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${subTab === 'pointages' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <CalendarCheck className="w-4 h-4" />
            Pointage Quotidien
          </button>
          <button
            onClick={() => setSubTab('paies')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${subTab === 'paies' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <FileText className="w-4 h-4" />
            Fiches de Paie & Règlements
          </button>
        </div>

        {/* Global Filters */}
        <div className="flex items-center gap-2 text-xs">
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

          {subTab === 'pointages' && (
            <input
              type="date"
              value={pointageDate}
              onChange={(e) => setPointageDate(e.target.value)}
              className="py-1.5 px-2 border border-slate-200 rounded-lg font-bold text-slate-800"
            />
          )}

          {subTab === 'paies' && (
            <input
              type="month"
              value={paieMois}
              onChange={(e) => setPaieMois(e.target.value)}
              className="py-1.5 px-2 border border-slate-200 rounded-lg font-bold text-slate-800"
            />
          )}
        </div>
      </div>

      {/* SUB-VIEW 1: EMPLOYEES DIRECTORY */}
      {subTab === 'employees' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700 uppercase tracking-wider">
            Effectif Global (Permanents & Journaliers Tâcherons)
          </div>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3">Matricule</th>
                <th className="py-2.5 px-3">Nom & Prénom</th>
                <th className="py-2.5 px-3">Fonction / Qualification</th>
                <th className="py-2.5 px-3">Chantier Actuel</th>
                <th className="py-2.5 px-3">Type Contrat</th>
                <th className="py-2.5 px-3">Rémunération de Base</th>
                <th className="py-2.5 px-3">Contact</th>
                <th className="py-2.5 px-3 text-center">Avances ce mois</th>
                <th className="py-2.5 px-3 text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {employees.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-500">{e.matricule}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{e.nom} {e.prenom}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-700">{e.poste}</td>
                  <td className="py-2.5 px-3">
                    {e.chantier_actuel_name ? (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded font-semibold text-[11px]">
                        {e.chantier_actuel_name}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Non affecté</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${e.type_contrat === 'PERMANENT_MENSUEL' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'}`}>
                      {e.type_contrat === 'PERMANENT_MENSUEL' ? 'Permanent' : 'Journalier / Tâcheron'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-semibold">
                    {e.type_contrat === 'PERMANENT_MENSUEL' ? `${formatDA(e.salaire_base)}/m` : `${formatDA(e.taux_journalier)}/j`}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">{e.telephone || '-'}</td>
                  <td className="py-2.5 px-3 text-center font-mono">
                    {e.total_avances_mois > 0 ? (
                      <span className="text-rose-600 font-bold">{formatDA(e.total_avances_mois)}</span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                      {e.statut}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SUB-VIEW 2: AFFECTATIONS */}
      {subTab === 'affectations' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700 uppercase tracking-wider">
            Historique & Suivi des Affectations du Personnel aux Chantiers
          </div>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3">Ouvrier / Salarié</th>
                <th className="py-2.5 px-3">Poste Principal</th>
                <th className="py-2.5 px-3">Chantier Affecté</th>
                <th className="py-2.5 px-3">Rôle Spécifique</th>
                <th className="py-2.5 px-3">Date Début</th>
                <th className="py-2.5 px-3">Date Fin</th>
                <th className="py-2.5 px-3 text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {affectations.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-3 font-bold text-slate-900">{a.nom} {a.prenom} ({a.matricule})</td>
                  <td className="py-2.5 px-3 text-slate-600">{a.poste}</td>
                  <td className="py-2.5 px-3 font-semibold text-blue-700">{a.chantier_name} ({a.wilaya})</td>
                  <td className="py-2.5 px-3">{a.role_sur_chantier}</td>
                  <td className="py-2.5 px-3 text-slate-500">{formatDate(a.date_debut)}</td>
                  <td className="py-2.5 px-3 text-slate-500">{a.date_fin ? formatDate(a.date_fin) : 'En cours'}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${a.statut === 'EN_COURS' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                      {a.statut}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SUB-VIEW 3: POINTAGE QUOTIDIEN */}
      {subTab === 'pointages' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">
              Feuille de Présence & Pointage du : <strong className="text-slate-900">{formatDate(pointageDate)}</strong>
            </span>
            <span className="text-xs text-slate-500">
              Chantier : <strong className="text-slate-800">{selectedChantier ? chantiers.find(c => c.id == selectedChantier)?.name : 'Tous les chantiers'}</strong>
            </span>
          </div>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3">Ouvrier / Salarié</th>
                <th className="py-2.5 px-3">Fonction</th>
                <th className="py-2.5 px-3">Chantier</th>
                <th className="py-2.5 px-3">Taux Journalier / Base</th>
                <th className="py-2.5 px-3 text-center">Pointage Présence</th>
                <th className="py-2.5 px-3 text-right">Rémunération du Jour</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {employees.map((emp) => {
                const p = pointages.find(x => x.employee_id === emp.id);
                const currentStatus = p ? p.statut : 'NON_POINTE';

                return (
                  <tr key={emp.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{emp.nom} {emp.prenom}</td>
                    <td className="py-2.5 px-3 text-slate-600">{emp.poste}</td>
                    <td className="py-2.5 px-3 text-slate-700">{emp.chantier_actuel_name || '-'}</td>
                    <td className="py-2.5 px-3 font-mono">
                      {emp.type_contrat === 'JOURNALIER_TACHERON' ? `${formatDA(emp.taux_journalier)}/j` : 'Mensuel'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
                        <button
                          onClick={() => handleSavePointage(emp.id, 'PRESENT', 8, 0)}
                          className={`px-2 py-1 rounded text-[11px] font-bold transition ${currentStatus === 'PRESENT' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                          Présent (8h)
                        </button>
                        <button
                          onClick={() => handleSavePointage(emp.id, 'DEMI_JOURNEE', 4, 0)}
                          className={`px-2 py-1 rounded text-[11px] font-bold transition ${currentStatus === 'DEMI_JOURNEE' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                          1/2 Jour
                        </button>
                        <button
                          onClick={() => handleSavePointage(emp.id, 'ABSENT', 0, 0)}
                          className={`px-2 py-1 rounded text-[11px] font-bold transition ${currentStatus === 'ABSENT' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                          Absent
                        </button>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-sm">
                      {p && p.montant_du_jour > 0 ? (
                        <span className="text-emerald-700">{formatDA(p.montant_du_jour)}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* SUB-VIEW 4: FICHES DE PAIE */}
      {subTab === 'paies' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">
              Bulletins de Salaire du Mois : <strong className="text-slate-900 font-mono">{paieMois}</strong>
            </span>
            <span className="text-xs text-slate-500">
              Masse Salariale du Mois : <strong className="text-indigo-900 font-mono font-bold">{formatDA(paies.reduce((a, b) => a + b.net_a_payer, 0))}</strong>
            </span>
          </div>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3">Réf. Bulletin</th>
                <th className="py-2.5 px-3">Salarié / Ouvrier</th>
                <th className="py-2.5 px-3">Chantier</th>
                <th className="py-2.5 px-3 text-center">Jours</th>
                <th className="py-2.5 px-3 text-right">Salaire Base (DA)</th>
                <th className="py-2.5 px-3 text-right">Primes Chantier</th>
                <th className="py-2.5 px-3 text-right">Avances Déduites</th>
                <th className="py-2.5 px-3 text-right">Net à Payer (DA)</th>
                <th className="py-2.5 px-3 text-center">Statut</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {paies.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-8 text-center text-slate-400">
                    Aucune fiche de paie générée pour le mois {paieMois}. Cliquez sur "Générer la Paie" ci-dessus.
                  </td>
                </tr>
              ) : (
                paies.map((p) => {
                  const isPaid = p.statut === 'PAYE';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{p.reference}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{p.nom} {p.prenom}</div>
                        <div className="text-[10px] text-slate-400">{p.poste}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{p.chantier_name || 'Multi-Sites'}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{p.jours_travailles} j</td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatDA(p.salaire_base)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-700">+{formatDA(p.primes_chantier)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-700">
                        {p.avances_deduites > 0 ? `-${formatDA(p.avances_deduites)}` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-sm text-indigo-950">
                        {formatDA(p.net_a_payer)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {p.statut}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onOpenPrintPaie(p)}
                            className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded text-[11px] font-semibold transition flex items-center gap-1"
                            title="Imprimer le bulletin de paie"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Bulletin
                          </button>
                          {!isPaid && (
                            <button
                              onClick={() => setShowPayModal(p)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold transition"
                            >
                              Payer
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pay Modal Confirmation */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">Règlement du Salaire en Caisse</h3>
            <p className="text-xs text-slate-600 mb-4">
              Paiement de <strong>{showPayModal.nom} {showPayModal.prenom}</strong> d'un montant de <strong className="text-indigo-900 font-mono">{formatDA(showPayModal.net_a_payer)}</strong> pour le mois {showPayModal.mois_annee}.
            </p>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Sélectionner la Caisse à Débiter :</label>
            <select id="payCaisseSelect" className="w-full text-xs p-2.5 border rounded-lg mb-4 bg-white">
              {caisses.map((c) => (
                <option key={c.id} value={c.id}>{c.name} [Solde: {formatDA(c.balance)}]</option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowPayModal(null)} className="px-4 py-2 border rounded-lg text-xs font-semibold">Annuler</button>
              <button
                onClick={() => {
                  const sel = document.getElementById('payCaisseSelect').value;
                  handleConfirmPaiementPaie(sel);
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
              >
                Confirmer Décaissement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
