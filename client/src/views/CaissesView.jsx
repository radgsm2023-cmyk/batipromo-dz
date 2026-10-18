import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw, 
  Printer, 
  AlertTriangle, 
  Search, 
  Building, 
  Coins,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Check,
  X,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { formatDA, formatDACompact, formatDate } from '../utils/formatters';

export default function CaissesView({ currentUser, onOpenNewMouvement, onOpenPrintBon }) {
  const [caisses, setCaisses] = useState([]);
  const [mouvements, setMouvements] = useState([]);
  const [pendingMouvements, setPendingMouvements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCaisseId, setSelectedCaisseId] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Rejection modal
  const [rejectModalMvt, setRejectModalMvt] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.permissions?.includes('caisses:validate');

  const loadData = async () => {
    try {
      setLoading(true);
      const [caissesData, mvtData, pendings] = await Promise.all([
        api.getCaisses(),
        api.getAllMouvements({
          caisse_id: selectedCaisseId || undefined,
          type: typeFilter || undefined,
          status: statusFilter || undefined,
          search: search || undefined
        }),
        api.getPendingMouvements()
      ]);
      setCaisses(caissesData);
      setMouvements(mvtData);
      setPendingMouvements(pendings);
    } catch (e) {
      console.error('Error fetching caisses data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCaisseId, typeFilter, statusFilter, search]);

  const handleValidate = async (mvt) => {
    if (!window.confirm(`Confirmer la validation du décaissement de ${formatDA(mvt.montant)} pour "${mvt.motif}" ?\nLe solde de la caisse sera débité.`)) {
      return;
    }

    try {
      setActionLoading(true);
      const res = await api.validateMouvement(mvt.id, { user_id: currentUser?.id });
      setFeedbackMessage({ type: 'success', text: res.message });
      loadData();
      setTimeout(() => setFeedbackMessage(null), 6000);
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Erreur lors de la validation' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectModalMvt) return;
    try {
      setActionLoading(true);
      const res = await api.rejectMouvement(rejectModalMvt.id, { 
        user_id: currentUser?.id,
        rejection_reason: rejectionReason || 'Rejeté par la Direction Générale'
      });
      setFeedbackMessage({ type: 'success', text: res.message });
      setRejectModalMvt(null);
      setRejectionReason('');
      loadData();
      setTimeout(() => setFeedbackMessage(null), 6000);
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Erreur lors du rejet' });
    } finally {
      setActionLoading(false);
    }
  };

  const totalTresorerie = caisses.reduce((acc, c) => acc + c.balance, 0);
  const totalFDR = caisses.filter(c => c.type === 'FOND_ROULEMENT_CHANTIER').reduce((acc, c) => acc + c.balance, 0);
  const totalBanques = caisses.filter(c => c.type === 'COMPTE_BANCAIRE').reduce((acc, c) => acc + c.balance, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Trésorerie & Caisses de Fond de Roulement</h1>
          <p className="text-xs text-slate-500">Gestion des caisses chantiers, validation des sorties sensibles & notification des versements</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenNewMouvement()}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            <ArrowDownRight className="w-4 h-4" />
            Nouveau Décaissement (Bon)
          </button>
          <button
            onClick={() => onOpenNewMouvement()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            <RefreshCw className="w-4 h-4" />
            Alimenter un Fond
          </button>
        </div>
      </div>

      {/* Action feedback toast */}
      {feedbackMessage && (
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-2 text-xs font-semibold transition ${
          feedbackMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
            : 'bg-rose-50 border-rose-300 text-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span>{feedbackMessage.text}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── SECTION VALIDATION ADMIN DES OPÉRATIONS SENSIBLES ── */}
      {pendingMouvements.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-3xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
                    Opérations Sensibles de Caisse en Attente de Validation
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white shadow-xs">
                    {pendingMouvements.length} en attente
                  </span>
                </div>
                <p className="text-[11px] text-amber-900/80">
                  {isAdmin 
                    ? "En tant qu'Administrateur / DG, vous devez valider ou rejeter ces décaissements avant que les fonds ne soient décaissés."
                    : "Ces décaissements sont actuellement soumis à l'approbation de l'Administrateur / Direction Générale."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-amber-800 font-bold bg-white/80 px-3 py-1.5 rounded-xl border border-amber-200">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>Contrôle & Visa Direction</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingMouvements.map((m) => (
              <div key={m.id} className="bg-white rounded-2xl p-4 border border-amber-200/80 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {m.reference}
                      </span>
                      <h3 className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">{m.motif}</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-300 uppercase">
                      À Valider
                    </span>
                  </div>

                  <div className="p-2.5 bg-amber-50/50 rounded-xl mb-3 space-y-1 text-[11px]">
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-400 font-medium">Montant Demandé :</span>
                      <span className="text-sm font-black font-mono text-rose-600">{formatDA(m.montant)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Caisse Débitrice :</span>
                      <span className="font-semibold text-slate-700 truncate max-w-[130px]">{m.caisse_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Chantier :</span>
                      <span className="font-semibold text-slate-700 truncate max-w-[130px]">{m.chantier_name || 'Siège'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Demandé par :</span>
                      <span className="font-semibold text-blue-700 truncate max-w-[130px]">{m.auteur_name || 'Personnel'}</span>
                    </div>
                    {m.beneficiaire_name && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Bénéficiaire :</span>
                        <span className="font-semibold text-slate-700 truncate max-w-[130px]">{m.beneficiaire_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => onOpenPrintBon(m)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                    title="Aperçu du bon de caisse"
                  >
                    <FileText className="w-4 h-4" />
                  </button>

                  {isAdmin ? (
                    <>
                      <button
                        onClick={() => setRejectModalMvt(m)}
                        disabled={actionLoading}
                        className="flex-1 py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Rejeter</span>
                      </button>

                      <button
                        onClick={() => handleValidate(m)}
                        disabled={actionLoading}
                        className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Valider</span>
                      </button>
                    </>
                  ) : (
                    <span className="text-[10px] text-amber-700 italic">En attente visa Admin</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Solde Trésorerie Globale</span>
          <div className="text-2xl font-black text-slate-900 font-mono tracking-tight mt-1">
            {formatDA(totalTresorerie)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Toutes caisses et comptes réunis</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Fonds de Roulement Chantiers</span>
          <div className="text-2xl font-black text-emerald-700 font-mono tracking-tight mt-1">
            {formatDA(totalFDR)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Espèces disponibles sur sites</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Disponibilités Bancaires</span>
          <div className="text-2xl font-black text-blue-700 font-mono tracking-tight mt-1">
            {formatDA(totalBanques)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Comptes BNA, CPA, BEA</span>
        </div>
      </div>

      {/* Cards for each Caisse */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 mb-3">État des Caisses & Comptes Actifs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {caisses.map((c) => {
            const isAlert = c.balance <= c.seuil_alerte && c.type === 'FOND_ROULEMENT_CHANTIER';
            const isBank = c.type === 'COMPTE_BANCAIRE';

            return (
              <div
                key={c.id}
                className={`bg-white rounded-2xl p-4 border shadow-xs transition ${isAlert ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'}`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {c.code}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${isBank ? 'bg-blue-100 text-blue-800' : (c.type === 'CAISSE_CENTRALE' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800')}`}>
                        {isBank ? 'Banque' : (c.type === 'CAISSE_CENTRALE' ? 'Siège' : 'Chantier')}
                      </span>
                      {c.pending_validations_count > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500 text-white animate-pulse">
                          {c.pending_validations_count} attente
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">{c.name}</h3>
                  </div>

                  {isBank ? (
                    <CreditCard className="w-5 h-5 text-blue-500 shrink-0" />
                  ) : (
                    <Wallet className="w-5 h-5 text-emerald-600 shrink-0" />
                  )}
                </div>

                {c.chantier_name && (
                  <p className="text-xs text-slate-500 font-medium mb-3">
                    Affectée à : <strong className="text-slate-700">{c.chantier_name}</strong>
                  </p>
                )}

                <div className="p-3 bg-slate-50 rounded-xl mb-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[11px] text-slate-400 font-medium">Solde Actuel :</span>
                    <span className={`text-base font-black font-mono ${isAlert ? 'text-rose-600' : 'text-slate-900'}`}>
                      {formatDA(c.balance)}
                    </span>
                  </div>

                  {isAlert && (
                    <div className="mt-2 text-[10px] text-rose-700 font-bold flex items-center gap-1 bg-rose-50 p-1.5 rounded">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Attention: Solde sous le seuil ({formatDA(c.seuil_alerte)})
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400 text-[11px]">{c.mouvements_count || 0} opérations</span>
                  <button
                    onClick={() => onOpenNewMouvement(c.id)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
                  >
                    Actionner Caisse
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter & Transactions History */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
            Grand Livre des Mouvements de Caisse, Sorties & Versements
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCaisseId}
              onChange={(e) => setSelectedCaisseId(e.target.value)}
              className="text-xs py-1.5 px-2.5 border border-slate-200 rounded-lg bg-white"
            >
              <option value="">Toutes les Caisses</option>
              {caisses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 border border-slate-200 rounded-lg bg-white"
            >
              <option value="">Tous les Types</option>
              <option value="SORTIE">Sorties / Décaissements</option>
              <option value="ENTREE">Entrées / Versements Bénéficiaires</option>
              <option value="ALIMENTATION">Alimentations FDR</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 border border-slate-200 rounded-lg bg-white"
            >
              <option value="">Tous les Statuts</option>
              <option value="VALIDE">Validés & Décaissés</option>
              <option value="EN_ATTENTE_VALIDATION">En attente de validation</option>
              <option value="REJETE">Rejetés</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3">Réf. Bon</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Caisse</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Statut & Validation</th>
                <th className="py-2.5 px-3">Chantier</th>
                <th className="py-2.5 px-3">Motif & Bénéficiaire</th>
                <th className="py-2.5 px-3">Mode</th>
                <th className="py-2.5 px-3 text-right">Montant (DA)</th>
                <th className="py-2.5 px-3 text-center">Actions & Bon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {mouvements.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-6 text-center text-slate-400">
                    Aucun mouvement trouvé pour les critères sélectionnés.
                  </td>
                </tr>
              ) : (
                mouvements.map((m) => {
                  const isSortie = m.type === 'SORTIE';
                  const isPending = m.status === 'EN_ATTENTE_VALIDATION';
                  const isRejected = m.status === 'REJETE';

                  return (
                    <tr key={m.id} className={`hover:bg-slate-50/80 transition ${isPending ? 'bg-amber-50/30' : ''}`}>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{m.reference}</td>
                      <td className="py-2.5 px-3 text-slate-500">{formatDate(m.date)}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{m.caisse_name}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isSortie ? 'bg-rose-100 text-rose-800' : (m.type === 'ENTREE' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800')
                        }`}>
                          {m.type}
                        </span>
                      </td>

                      {/* Statut & Validation badge */}
                      <td className="py-2.5 px-3">
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                            <span>En attente Admin</span>
                          </span>
                        )}
                        {!isPending && !isRejected && (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Validé</span>
                            </span>
                            {m.validator_name && (
                              <div className="text-[9px] text-slate-400 truncate max-w-[120px]">
                                Par {m.validator_name}
                              </div>
                            )}
                          </div>
                        )}
                        {isRejected && (
                          <div title={m.rejection_reason || 'Rejeté'}>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>Rejeté</span>
                            </span>
                            {m.rejection_reason && (
                              <div className="text-[9px] text-rose-600 truncate max-w-[120px]">
                                {m.rejection_reason}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-slate-600">{m.chantier_name || 'Siège'}</td>
                      <td className="py-2.5 px-3 max-w-[240px] truncate">
                        <div className="font-semibold text-slate-900 truncate">{m.motif}</div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {m.beneficiaire_name ? `Bénéficiaire : ${m.beneficiaire_name}` : (m.fournisseur_name || m.categorie)}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{m.mode_paiement}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-sm">
                        <span className={isSortie ? 'text-rose-600' : 'text-emerald-600'}>
                          {isSortie ? '-' : '+'}{formatDA(m.montant)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isPending && isAdmin && (
                            <>
                              <button
                                onClick={() => handleValidate(m)}
                                disabled={actionLoading}
                                className="p-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                                title="Valider ce décaissement"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setRejectModalMvt(m)}
                                disabled={actionLoading}
                                className="p-1 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                                title="Rejeter ce décaissement"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => onOpenPrintBon(m)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 rounded-lg text-[11px] font-semibold transition"
                            title="Imprimer le bon de caisse"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Bon</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── REJECTION MODAL ── */}
      {rejectModalMvt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>Rejeter la Demande de Sortie</span>
              </div>
              <button onClick={() => setRejectModalMvt(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-3">
              Vous êtes sur le point de rejeter le décaissement <strong>{rejectModalMvt.reference}</strong> d'un montant de <strong>{formatDA(rejectModalMvt.montant)}</strong>.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Motif du Rejet :</label>
              <textarea
                rows="3"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex: Pièce justificative manquante, dépassement de budget chantier..."
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              ></textarea>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectModalMvt(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleRejectConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>Confirmer le Rejet</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
